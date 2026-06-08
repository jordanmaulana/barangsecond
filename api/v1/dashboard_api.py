from decimal import Decimal

from django.db.models import Count, DecimalField, F, Sum
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from credit.models import Installment, mark_overdue
from inventory.models import Product
from sales.models import Sale

ZERO = Decimal("0")
_DEC = DecimalField(max_digits=14, decimal_places=2)

# Profit expression reused across the sales aggregate, the monthly series and per-tag.
_PROFIT = Coalesce(
    Sum(F("sale_price") - F("product__buy_price"), output_field=_DEC), ZERO, output_field=_DEC
)


_CENTS = Decimal("0.01")


def _money(value):
    return str((value if value is not None else ZERO).quantize(_CENTS))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stats(request):
    today = timezone.localdate()
    mark_overdue(today)

    # Inventory: count by status + buy-value of available stock
    by_status = {
        row["status"]: row["n"] for row in Product.objects.values("status").annotate(n=Count("id"))
    }
    available_buy_value = Product.objects.filter(status=Product.Status.AVAILABLE).aggregate(
        v=Coalesce(Sum("buy_price"), ZERO, output_field=_DEC)
    )["v"]

    # Sales: count, revenue, realized profit, cash vs credit
    sales_qs = Sale.objects.all()
    sales_agg = sales_qs.aggregate(
        count=Count("id"),
        revenue=Coalesce(Sum("sale_price"), ZERO, output_field=_DEC),
        profit=_PROFIT,
    )
    by_type = {
        row["sale_type"]: row["n"] for row in sales_qs.values("sale_type").annotate(n=Count("id"))
    }

    # Credit: outstanding balance + overdue exposure (count and Rupiah)
    outstanding = Installment.objects.exclude(status=Installment.Status.PAID).aggregate(
        v=Coalesce(Sum("amount"), ZERO, output_field=_DEC)
    )["v"]
    overdue_qs = Installment.objects.filter(status=Installment.Status.OVERDUE)
    overdue_count = overdue_qs.count()
    overdue_amount = overdue_qs.aggregate(v=Coalesce(Sum("amount"), ZERO, output_field=_DEC))["v"]

    # Series: revenue + profit per month (last 12)
    monthly = (
        sales_qs.annotate(month=TruncMonth("sold_on"))
        .values("month")
        .annotate(
            revenue=Coalesce(Sum("sale_price"), ZERO, output_field=_DEC),
            profit=_PROFIT,
        )
        .order_by("month")
    )
    revenue_by_month = [
        {
            "month": row["month"].strftime("%Y-%m"),
            "revenue": _money(row["revenue"]),
            "profit": _money(row["profit"]),
        }
        for row in monthly
        if row["month"]
    ][-12:]

    return Response(
        {
            "inventory": {
                "available": by_status.get(Product.Status.AVAILABLE, 0),
                "sold_cash": by_status.get(Product.Status.SOLD_CASH, 0),
                "ongoing_installment": by_status.get(Product.Status.ONGOING_INSTALLMENT, 0),
                "installment_paid": by_status.get(Product.Status.INSTALLMENT_PAID, 0),
                "available_buy_value": _money(available_buy_value),
                "stock_aging": _stock_aging(today),
                "avg_days_to_sell": _avg_days_to_sell(),
            },
            "sales": {
                "count": sales_agg["count"],
                "revenue": _money(sales_agg["revenue"]),
                "profit": _money(sales_agg["profit"]),
                "cash": by_type.get(Sale.Type.CASH, 0),
                "credit": by_type.get(Sale.Type.CREDIT, 0),
                "profit_by_tag": _profit_by_tag(),
            },
            "credit": {
                "outstanding": _money(outstanding),
                "overdue_installments": overdue_count,
                "overdue_amount": _money(overdue_amount),
                "collections_by_month": _collections_by_month(),
                "aging": _aging(today),
                **_on_time(),
            },
            "revenue_by_month": revenue_by_month,
        }
    )


def _collections_by_month():
    """Forward cash-flow: still-due (not yet overdue/paid) installments by due month."""
    rows = (
        Installment.objects.filter(status=Installment.Status.DUE)
        .annotate(month=TruncMonth("due_date"))
        .values("month")
        .annotate(amount=Coalesce(Sum("amount"), ZERO, output_field=_DEC))
        .order_by("month")
    )
    return [
        {"month": r["month"].strftime("%Y-%m"), "amount": _money(r["amount"])}
        for r in rows
        if r["month"]
    ][:12]


def _aging(today):
    """Overdue exposure bucketed by how many days past due."""
    buckets = {
        "d1_30": {"count": 0, "amount": ZERO},
        "d31_60": {"count": 0, "amount": ZERO},
        "d60_plus": {"count": 0, "amount": ZERO},
    }
    rows = Installment.objects.filter(status=Installment.Status.OVERDUE).values_list(
        "due_date", "amount"
    )
    for due_date, amount in rows:
        days = (today - due_date).days
        key = "d1_30" if days <= 30 else "d31_60" if days <= 60 else "d60_plus"
        buckets[key]["count"] += 1
        buckets[key]["amount"] += amount
    return {k: {"count": v["count"], "amount": _money(v["amount"])} for k, v in buckets.items()}


def _on_time():
    """On-time collection rate inputs: paid installments and how many landed by due date."""
    paid = Installment.objects.filter(status=Installment.Status.PAID)
    paid_total = paid.count()
    paid_on_time = paid.filter(paid_on__isnull=False, paid_on__lte=F("due_date")).count()
    return {"paid_total": paid_total, "paid_on_time": paid_on_time}


def _profit_by_tag():
    """Realized profit grouped by product tag. Multi-tagged products count toward each tag."""
    rows = (
        Sale.objects.values("product__tags__name")
        .annotate(profit=_PROFIT, count=Count("id"))
        .order_by("-profit")
    )
    return [
        {
            "tag": r["product__tags__name"] or "Untagged",
            "profit": _money(r["profit"]),
            "count": r["count"],
        }
        for r in rows
    ][:8]


def _stock_aging(today):
    """Available stock bucketed by age (idle-capital view)."""
    buckets = {
        "d0_30": {"count": 0, "buy_value": ZERO},
        "d31_60": {"count": 0, "buy_value": ZERO},
        "d61_90": {"count": 0, "buy_value": ZERO},
        "d90_plus": {"count": 0, "buy_value": ZERO},
    }
    rows = Product.objects.filter(status=Product.Status.AVAILABLE).values_list(
        "created_on", "buy_price"
    )
    for created_on, buy_price in rows:
        days = (today - created_on.date()).days
        if days <= 30:
            key = "d0_30"
        elif days <= 60:
            key = "d31_60"
        elif days <= 90:
            key = "d61_90"
        else:
            key = "d90_plus"
        buckets[key]["count"] += 1
        buckets[key]["buy_value"] += buy_price
    return {
        k: {"count": v["count"], "buy_value": _money(v["buy_value"])} for k, v in buckets.items()
    }


def _avg_days_to_sell():
    """Mean days between a product's creation and its sale; null when no sales."""
    spans = (
        (s.sold_on - s.product.created_on.date()).days
        for s in Sale.objects.select_related("product")
    )
    days = [d for d in spans if d >= 0]  # ignore inverted spans (e.g. backdated seed data)
    return round(sum(days) / len(days)) if days else None

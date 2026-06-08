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


def _money(value):
    return str(value if value is not None else ZERO)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stats(request):
    mark_overdue(timezone.localdate())

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
        profit=Coalesce(
            Sum(F("sale_price") - F("product__buy_price"), output_field=_DEC),
            ZERO,
            output_field=_DEC,
        ),
    )
    by_type = {
        row["sale_type"]: row["n"] for row in sales_qs.values("sale_type").annotate(n=Count("id"))
    }

    # Credit: outstanding balance + overdue count
    outstanding = Installment.objects.exclude(status=Installment.Status.PAID).aggregate(
        v=Coalesce(Sum("amount"), ZERO, output_field=_DEC)
    )["v"]
    overdue_count = Installment.objects.filter(status=Installment.Status.OVERDUE).count()

    # Series: revenue per month (last 12)
    monthly = (
        sales_qs.annotate(month=TruncMonth("sold_on"))
        .values("month")
        .annotate(revenue=Coalesce(Sum("sale_price"), ZERO, output_field=_DEC))
        .order_by("month")
    )
    revenue_by_month = [
        {"month": row["month"].strftime("%Y-%m"), "revenue": _money(row["revenue"])}
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
            },
            "sales": {
                "count": sales_agg["count"],
                "revenue": _money(sales_agg["revenue"]),
                "profit": _money(sales_agg["profit"]),
                "cash": by_type.get(Sale.Type.CASH, 0),
                "credit": by_type.get(Sale.Type.CREDIT, 0),
            },
            "credit": {
                "outstanding": _money(outstanding),
                "overdue_installments": overdue_count,
            },
            "revenue_by_month": revenue_by_month,
        }
    )

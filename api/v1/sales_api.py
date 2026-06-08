from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.pagination import StandardPagination
from api.v1.serializers import SaleInputSerializer, SaleSerializer
from core.models import add_months
from credit.models import Credit, Installment
from inventory.models import Product
from sales.models import Sale

CENTS = Decimal("0.01")


def _build_installments(credit, start_date):
    """Create one installment per month. The final row absorbs any rounding
    remainder so the sum of installments equals the financed amount exactly."""
    financed = credit.total_price - credit.down_payment
    monthly = credit.monthly_amount
    rows = []
    accumulated = Decimal("0")
    for seq in range(1, credit.tenor_months + 1):
        if seq == credit.tenor_months:
            amount = financed - accumulated
        else:
            amount = monthly
            accumulated += monthly
        rows.append(
            Installment(
                credit=credit,
                sequence=seq,
                due_date=add_months(start_date, seq),
                amount=amount,
                actor=credit.actor,
            )
        )
    Installment.objects.bulk_create(rows)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def sales(request):
    if request.method == "GET":
        qs = Sale.objects.select_related("product", "credit").prefetch_related(
            "product__tags", "credit__installments"
        )
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(Q(product__title__icontains=search) | Q(buyer_name__icontains=search))
        qs = qs.order_by("-sold_on", "-created_on")
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(SaleSerializer(page, many=True).data)

    serializer = SaleInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    with transaction.atomic():
        product = data["product"]
        sale = Sale.objects.create(
            product=product,
            sale_type=data["sale_type"],
            sale_price=data["sale_price"],
            sold_on=data["sold_on"],
            buyer_name=data.get("buyer_name", ""),
            buyer_phone=data.get("buyer_phone", ""),
            actor=request.user,
        )
        if data["sale_type"] == Sale.Type.CREDIT:
            c = data["credit"]
            tenor = c["tenor_months"]
            down = c.get("down_payment") or Decimal("0")
            monthly = c.get("monthly_amount")
            if monthly is None:
                monthly = ((c["total_price"] - down) / tenor).quantize(
                    CENTS, rounding=ROUND_HALF_UP
                )
            credit = Credit.objects.create(
                sale=sale,
                total_price=c["total_price"],
                down_payment=down,
                tenor_months=tenor,
                monthly_amount=monthly,
                actor=request.user,
            )
            _build_installments(credit, sale.sold_on)
            product.status = Product.Status.ONGOING_INSTALLMENT
        else:
            product.status = Product.Status.SOLD_CASH
        product.save(update_fields=["status", "updated_on"])

    sale = (
        Sale.objects.select_related("product", "credit")
        .prefetch_related("product__tags", "credit__installments")
        .get(id=sale.id)
    )
    return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sale_detail(request, sale_id):
    try:
        sale = (
            Sale.objects.select_related("product", "credit")
            .prefetch_related("product__tags", "credit__installments")
            .get(id=sale_id)
        )
    except Sale.DoesNotExist:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(SaleSerializer(sale).data)

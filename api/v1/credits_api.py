from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.pagination import StandardPagination
from api.v1.serializers import CreditSerializer, InstallmentSerializer
from credit.models import Credit, Installment, mark_overdue
from inventory.models import Product


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def credits(request):
    mark_overdue(timezone.localdate())
    qs = Credit.objects.select_related("sale__product").prefetch_related("installments")
    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(
            Q(sale__product__title__icontains=search) | Q(sale__buyer_name__icontains=search)
        )
    qs = qs.order_by("-sale__sold_on", "-created_on")
    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs, request)
    return paginator.get_paginated_response(CreditSerializer(page, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def credit_detail(request, credit_id):
    mark_overdue(timezone.localdate())
    try:
        credit = (
            Credit.objects.select_related("sale__product")
            .prefetch_related("installments")
            .get(id=credit_id)
        )
    except Credit.DoesNotExist:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(CreditSerializer(credit).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pay_installment(request, installment_id):
    try:
        installment = Installment.objects.select_related("credit__sale__product").get(
            id=installment_id
        )
    except Installment.DoesNotExist:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    if installment.status == Installment.Status.PAID:
        return Response({"detail": "Already paid"}, status=status.HTTP_400_BAD_REQUEST)
    with transaction.atomic():
        installment.status = Installment.Status.PAID
        installment.paid_on = timezone.localdate()
        installment.actor = request.user
        installment.save(update_fields=["status", "paid_on", "actor", "updated_on"])
        credit = installment.credit
        if credit.is_settled:
            product = credit.sale.product
            if product.status == Product.Status.ONGOING_INSTALLMENT:
                product.status = Product.Status.INSTALLMENT_PAID
                product.save(update_fields=["status", "updated_on"])
    return Response(InstallmentSerializer(installment).data)

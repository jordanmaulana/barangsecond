from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.pagination import StandardPagination
from api.v1.serializers import ProductSerializer
from inventory.models import Product

# DB-backed columns the UI may sort by (profit is a Python property, not orderable).
PRODUCT_ORDER_FIELDS = {"title", "buy_price", "sell_price"}


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def products(request):
    if request.method == "POST":
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(actor=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    qs = Product.objects.prefetch_related("tags").all()
    status_filter = request.query_params.get("status")
    if status_filter:
        qs = qs.filter(status=status_filter)
    tag = request.query_params.get("tag")
    if tag:
        qs = qs.filter(tags__id=tag)
    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(Q(title__icontains=search) | Q(tags__name__icontains=search)).distinct()

    ordering = request.query_params.get("ordering", "title")
    if ordering.lstrip("-") not in PRODUCT_ORDER_FIELDS:
        ordering = "title"
    qs = qs.order_by(ordering, "-created_on")

    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs, request)
    return paginator.get_paginated_response(ProductSerializer(page, many=True).data)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def product_detail(request, product_id):
    try:
        product = Product.objects.prefetch_related("tags").get(id=product_id)
    except Product.DoesNotExist:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(ProductSerializer(product).data)

    if request.method == "DELETE":
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = ProductSerializer(product, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save(actor=request.user)
    return Response(serializer.data)

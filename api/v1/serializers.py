from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import serializers

from credit.models import Credit, Installment
from inventory.models import Product, Tag
from sales.models import Sale

User = get_user_model()


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()

    def validate(self, attrs):
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            raise serializers.ValidationError("Google OAuth not configured")
        try:
            claims = id_token.verify_oauth2_token(
                attrs["credential"],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except ValueError as exc:
            raise serializers.ValidationError(f"Invalid Google credential: {exc}") from exc
        if not claims.get("email_verified"):
            raise serializers.ValidationError("Email not verified")
        attrs["claims"] = claims
        return attrs


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        email = value.lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email already registered")
        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.lower()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class ProductSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="tags",
    )
    profit = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    is_sold = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "description",
            "buy_price",
            "sell_price",
            "profit",
            "status",
            "tags",
            "tag_ids",
            "is_sold",
            "created_on",
        ]
        read_only_fields = ["status"]

    def get_is_sold(self, obj):
        return obj.status != Product.Status.AVAILABLE


class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = ["id", "sequence", "due_date", "amount", "status", "paid_on"]


class CreditSerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    paid_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    outstanding = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    is_settled = serializers.BooleanField(read_only=True)
    sale_id = serializers.CharField(source="sale.id", read_only=True)
    product_title = serializers.CharField(source="sale.product.title", read_only=True)
    buyer_name = serializers.CharField(source="sale.buyer_name", read_only=True)
    sold_on = serializers.DateField(source="sale.sold_on", read_only=True)

    class Meta:
        model = Credit
        fields = [
            "id",
            "sale_id",
            "product_title",
            "buyer_name",
            "sold_on",
            "total_price",
            "down_payment",
            "tenor_months",
            "monthly_amount",
            "paid_amount",
            "outstanding",
            "is_settled",
            "installments",
        ]


class SaleSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    credit = CreditSerializer(read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "product",
            "sale_type",
            "sale_price",
            "sold_on",
            "buyer_name",
            "buyer_phone",
            "credit",
            "created_on",
        ]


class CreditInputSerializer(serializers.Serializer):
    total_price = serializers.DecimalField(max_digits=14, decimal_places=2)
    down_payment = serializers.DecimalField(max_digits=14, decimal_places=2, default=0)
    tenor_months = serializers.IntegerField(min_value=1)
    monthly_amount = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)


class SaleInputSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    sale_type = serializers.ChoiceField(choices=Sale.Type.choices)
    sale_price = serializers.DecimalField(max_digits=14, decimal_places=2)
    sold_on = serializers.DateField()
    buyer_name = serializers.CharField(required=False, allow_blank=True, default="")
    buyer_phone = serializers.CharField(required=False, allow_blank=True, default="")
    credit = CreditInputSerializer(required=False)

    def validate(self, attrs):
        if attrs["product"].status != Product.Status.AVAILABLE:
            raise serializers.ValidationError("Product is already sold")
        if attrs["sale_type"] == Sale.Type.CREDIT and not attrs.get("credit"):
            raise serializers.ValidationError("Credit details required for a credit sale")
        return attrs

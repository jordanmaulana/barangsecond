from django.urls import path

from api.v1 import (
    auth_api,
    credits_api,
    dashboard_api,
    payments_api,
    products_api,
    sales_api,
    tags_api,
)

urlpatterns = [
    path("auth/google/", auth_api.google, name="api-v1-auth-google"),
    path("auth/register/", auth_api.register, name="api-v1-auth-register"),
    path("auth/login/", auth_api.login, name="api-v1-auth-login"),
    path("auth/logout/", auth_api.logout, name="api-v1-logout"),
    path("auth/me/", auth_api.me, name="api-v1-me"),
    path("payments/mayar/webhook/", payments_api.webhook, name="api-v1-mayar-webhook"),
    # Inventory
    path("tags/", tags_api.tags, name="api-v1-tags"),
    path("products/", products_api.products, name="api-v1-products"),
    path(
        "products/<str:product_id>/",
        products_api.product_detail,
        name="api-v1-product-detail",
    ),
    # Sales
    path("sales/", sales_api.sales, name="api-v1-sales"),
    path("sales/<str:sale_id>/", sales_api.sale_detail, name="api-v1-sale-detail"),
    # Credit
    path("credits/", credits_api.credits, name="api-v1-credits"),
    path(
        "credits/<str:credit_id>/",
        credits_api.credit_detail,
        name="api-v1-credit-detail",
    ),
    path(
        "installments/<str:installment_id>/pay/",
        credits_api.pay_installment,
        name="api-v1-installment-pay",
    ),
    # Dashboard
    path("dashboard/stats/", dashboard_api.stats, name="api-v1-dashboard-stats"),
]

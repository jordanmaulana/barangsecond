from django.contrib import admin

from sales.models import Sale


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ["product", "sale_type", "sale_price", "sold_on"]
    list_filter = ["sale_type"]

from django.contrib import admin

from inventory.models import Product, Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    search_fields = ["name"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "buy_price", "sell_price"]
    list_filter = ["status", "tags"]
    search_fields = ["title", "description"]

from django.contrib import admin

from credit.models import Credit, Installment


class InstallmentInline(admin.TabularInline):
    model = Installment
    extra = 0


@admin.register(Credit)
class CreditAdmin(admin.ModelAdmin):
    list_display = ["sale", "total_price", "tenor_months", "monthly_amount"]
    inlines = [InstallmentInline]

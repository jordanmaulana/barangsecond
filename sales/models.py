from django.db import models

from core.models import MONEY, BaseModel


class Sale(BaseModel):
    class Type(models.TextChoices):
        CASH = "cash", "Cash"
        CREDIT = "credit", "Sharia credit"

    product = models.OneToOneField(
        "inventory.Product", on_delete=models.PROTECT, related_name="sale"
    )
    sale_type = models.CharField(max_length=10, choices=Type.choices)
    sale_price = models.DecimalField(**MONEY)
    sold_on = models.DateField()
    buyer_name = models.CharField(max_length=200, blank=True)
    buyer_phone = models.CharField(max_length=40, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-sold_on", "-created_on"]

    @property
    def profit(self):
        return self.sale_price - self.product.buy_price

    def __str__(self):
        return f"Sale({self.product.title}, {self.sale_type})"

from django.db import models

from core.models import MONEY, BaseModel


class Tag(BaseModel):
    name = models.CharField(max_length=80, unique=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(BaseModel):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        RESERVED = "reserved", "Reserved"
        SOLD = "sold", "Sold"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    buy_price = models.DecimalField(**MONEY)
    sell_price = models.DecimalField(**MONEY)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    tags = models.ManyToManyField(Tag, blank=True, related_name="products")

    class Meta(BaseModel.Meta):
        ordering = ["-created_on"]

    @property
    def profit(self):
        return self.sell_price - self.buy_price

    def __str__(self):
        return self.title

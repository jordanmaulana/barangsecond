from decimal import Decimal

from django.db import models

from core.models import MONEY, BaseModel


class Credit(BaseModel):
    sale = models.OneToOneField("sales.Sale", on_delete=models.CASCADE, related_name="credit")
    total_price = models.DecimalField(**MONEY)
    down_payment = models.DecimalField(**MONEY, default=Decimal("0"))
    tenor_months = models.PositiveIntegerField()
    monthly_amount = models.DecimalField(**MONEY)

    def __str__(self):
        return f"Credit({self.sale.product.title}, {self.tenor_months}mo)"

    @property
    def paid_amount(self):
        # Iterate the (prefetched) related set so prefetch_related("installments")
        # is reused; .filter() would spawn a fresh query and bypass the cache.
        return sum(
            (i.amount for i in self.installments.all() if i.status == Installment.Status.PAID),
            Decimal("0"),
        )

    @property
    def outstanding(self):
        return sum(
            (i.amount for i in self.installments.all() if i.status != Installment.Status.PAID),
            Decimal("0"),
        )

    @property
    def is_settled(self):
        return all(i.status == Installment.Status.PAID for i in self.installments.all())


class Installment(BaseModel):
    class Status(models.TextChoices):
        DUE = "due", "Due"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"

    credit = models.ForeignKey(Credit, on_delete=models.CASCADE, related_name="installments")
    sequence = models.PositiveIntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(**MONEY)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DUE)
    paid_on = models.DateField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["credit", "sequence"]

    def __str__(self):
        return f"Installment({self.sequence}/{self.credit.tenor_months})"


def mark_overdue(today):
    """Flip any still-due installment past its due date to overdue. Idempotent;
    call before reading credit/dashboard data so no cron job is required."""
    return Installment.objects.filter(status=Installment.Status.DUE, due_date__lt=today).update(
        status=Installment.Status.OVERDUE
    )

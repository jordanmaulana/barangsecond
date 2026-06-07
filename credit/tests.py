from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from credit.models import Credit, Installment, mark_overdue
from inventory.models import Product
from sales.models import Sale


def make_credit(tenor=3, monthly="1000000", down="1000000", total="4000000"):
    product = Product.objects.create(
        title="Car", buy_price=Decimal("100"), sell_price=Decimal("200")
    )
    sale = Sale.objects.create(
        product=product,
        sale_type=Sale.Type.CREDIT,
        sale_price=Decimal(total),
        sold_on=date(2026, 1, 1),
    )
    credit = Credit.objects.create(
        sale=sale,
        total_price=Decimal(total),
        down_payment=Decimal(down),
        tenor_months=tenor,
        monthly_amount=Decimal(monthly),
    )
    for seq in range(1, tenor + 1):
        Installment.objects.create(
            credit=credit,
            sequence=seq,
            due_date=date(2026, seq + 1, 1),
            amount=Decimal(monthly),
        )
    return credit


class CreditModelTests(TestCase):
    def test_outstanding_and_paid(self):
        c = make_credit()
        self.assertEqual(c.outstanding, Decimal("3000000"))
        self.assertEqual(c.paid_amount, Decimal("0"))
        self.assertFalse(c.is_settled)

        first = c.installments.first()
        first.status = Installment.Status.PAID
        first.save()
        self.assertEqual(c.paid_amount, Decimal("1000000"))
        self.assertEqual(c.outstanding, Decimal("2000000"))

    def test_is_settled_when_all_paid(self):
        c = make_credit(tenor=2)
        c.installments.update(status=Installment.Status.PAID)
        self.assertTrue(c.is_settled)
        self.assertEqual(c.outstanding, Decimal("0"))

    def test_mark_overdue_flips_only_past_due(self):
        c = make_credit(tenor=2)
        today = timezone.localdate()
        i1, i2 = list(c.installments.all())
        i1.due_date = today - timedelta(days=1)
        i1.save()
        i2.due_date = today + timedelta(days=30)
        i2.save()

        mark_overdue(today)
        i1.refresh_from_db()
        i2.refresh_from_db()
        self.assertEqual(i1.status, Installment.Status.OVERDUE)
        self.assertEqual(i2.status, Installment.Status.DUE)

    def test_mark_overdue_skips_paid(self):
        c = make_credit(tenor=1)
        i = c.installments.first()
        i.status = Installment.Status.PAID
        i.due_date = timezone.localdate() - timedelta(days=5)
        i.save()
        mark_overdue(timezone.localdate())
        i.refresh_from_db()
        self.assertEqual(i.status, Installment.Status.PAID)


class PayInstallmentApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("u", password="x")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_pay_sets_paid_and_drops_outstanding(self):
        c = make_credit(tenor=2)
        inst = c.installments.first()
        res = self.client.post(f"/api/v1/installments/{inst.id}/pay/")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data["status"], "paid")
        self.assertIsNotNone(res.data["paid_on"])
        c.refresh_from_db()
        self.assertEqual(c.outstanding, Decimal("1000000"))

    def test_double_pay_rejected(self):
        c = make_credit(tenor=1)
        inst = c.installments.first()
        self.client.post(f"/api/v1/installments/{inst.id}/pay/")
        res = self.client.post(f"/api/v1/installments/{inst.id}/pay/")
        self.assertEqual(res.status_code, 400)

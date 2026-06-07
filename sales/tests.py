from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from inventory.models import Product
from sales.models import Sale


class SaleFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("u", password="x")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def _product(self):
        return Product.objects.create(
            title="iPhone", buy_price=Decimal("3000000"), sell_price=Decimal("4000000")
        )

    def test_cash_sale_marks_product_sold(self):
        p = self._product()
        res = self.client.post(
            "/api/v1/sales/",
            {
                "product": p.id,
                "sale_type": "cash",
                "sale_price": "4000000",
                "sold_on": "2026-01-15",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertIsNone(res.data["credit"])
        p.refresh_from_db()
        self.assertEqual(p.status, Product.Status.SOLD)

    def test_credit_sale_generates_schedule(self):
        p = self._product()
        res = self.client.post(
            "/api/v1/sales/",
            {
                "product": p.id,
                "sale_type": "credit",
                "sale_price": "4000000",
                "sold_on": "2026-01-31",
                "credit": {
                    "total_price": "4000000",
                    "down_payment": "1000000",
                    "tenor_months": 3,
                },
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        credit = res.data["credit"]
        self.assertEqual(credit["monthly_amount"], "1000000.00")
        rows = credit["installments"]
        self.assertEqual(len(rows), 3)
        # day clamps: Jan 31 -> Feb 28, Mar 31, Apr 30
        self.assertEqual(
            [r["due_date"] for r in rows][:3], ["2026-02-28", "2026-03-31", "2026-04-30"]
        )
        # installments sum to financed amount (total - down)
        total = sum(Decimal(r["amount"]) for r in rows)
        self.assertEqual(total, Decimal("3000000.00"))

    def test_rounding_remainder_in_last_installment(self):
        p = self._product()
        res = self.client.post(
            "/api/v1/sales/",
            {
                "product": p.id,
                "sale_type": "credit",
                "sale_price": "10000",
                "sold_on": "2026-01-01",
                "credit": {"total_price": "10000", "tenor_months": 3},
            },
            format="json",
        )
        rows = res.data["credit"]["installments"]
        amounts = [Decimal(r["amount"]) for r in rows]
        self.assertEqual(amounts[0], Decimal("3333.33"))
        self.assertEqual(amounts[-1], Decimal("3333.34"))
        self.assertEqual(sum(amounts), Decimal("10000.00"))

    def test_cannot_sell_sold_product(self):
        p = self._product()
        p.status = Product.Status.SOLD
        p.save()
        res = self.client.post(
            "/api/v1/sales/",
            {
                "product": p.id,
                "sale_type": "cash",
                "sale_price": "4000000",
                "sold_on": "2026-01-15",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_credit_sale_requires_credit_block(self):
        p = self._product()
        res = self.client.post(
            "/api/v1/sales/",
            {
                "product": p.id,
                "sale_type": "credit",
                "sale_price": "4000000",
                "sold_on": "2026-01-15",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Sale.objects.count(), 0)

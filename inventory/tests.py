from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from inventory.models import Product


class ProductPaginationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("u", password="x")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        for i in range(25):
            Product.objects.create(
                title=f"Item {i:02d}",
                buy_price=Decimal("1000"),
                sell_price=Decimal("1500"),
            )

    def test_returns_paginated_envelope(self):
        res = self.client.get("/api/v1/products/?page=1&page_size=10")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 25)
        self.assertEqual(res.data["total_pages"], 3)
        self.assertEqual(res.data["page"], 1)
        self.assertEqual(len(res.data["results"]), 10)

    def test_page_size_clamped_to_max(self):
        res = self.client.get("/api/v1/products/?page_size=500")
        self.assertEqual(res.data["page_size"], 50)
        self.assertEqual(len(res.data["results"]), 25)

    def test_search_filters_by_title(self):
        res = self.client.get("/api/v1/products/?search=Item 07")
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["title"], "Item 07")

    def test_ordering_whitelist_rejects_unknown_field(self):
        # unknown ordering falls back to title asc -> first item is "Item 00"
        res = self.client.get("/api/v1/products/?ordering=buy_price; DROP")
        self.assertEqual(res.data["results"][0]["title"], "Item 00")

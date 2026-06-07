"""Seed a demo account (demo@gmail.com / demodemo123) with realistic phone & car
inventory, cash/credit sales, and credit installments in paid/due/overdue states.

Idempotent: each run wipes the demo user's existing inventory/sales/credit data
and rebuilds it. Reuses the canonical sale->credit->installment flow from the
API (`_build_installments`) so demo data matches production behaviour exactly.

    uv run manage.py seed_demo
"""

from decimal import ROUND_HALF_UP, Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from rest_framework.authtoken.models import Token

from api.v1.sales_api import CENTS, _build_installments
from core.models import add_months
from credit.models import Credit, Installment, mark_overdue
from inventory.models import Product, Tag
from sales.models import Sale

DEMO_EMAIL = "demo@gmail.com"
DEMO_PASSWORD = "demodemo123"


def D(value):
    return Decimal(value)


# Each product: title, description, buy, sell, tag, and an optional sale spec.
# sale spec -> months_ago, type ("cash"/"credit"), buyer, phone, and for credit:
# down, tenor, plus "delinquent" (leave past installments unpaid -> overdue).
PRODUCTS = [
    # --- Phones ---
    {
        "title": "iPhone 13 128GB",
        "description": "Ex-inter, mulus 95%, fullset dus charger.",
        "buy": "7500000",
        "sell": "8900000",
        "tag": "Phones",
        "sale": {
            "months_ago": 7,
            "type": "cash",
            "buyer": "Budi Santoso",
            "phone": "0812-3456-7890",
        },
    },
    {
        "title": "iPhone 15 Pro 256GB",
        "description": "iBox resmi, garansi on, kondisi like new.",
        "buy": "14500000",
        "sell": "17500000",
        "tag": "Phones",
        "sale": {
            "months_ago": 5,
            "type": "credit",
            "buyer": "Andi Wijaya",
            "phone": "0813-2233-4455",
            "down": "5000000",
            "tenor": 12,
        },
    },
    {
        "title": "Samsung Galaxy S23",
        "description": "SEIN resmi, normal semua, batt 90%.",
        "buy": "6800000",
        "sell": "8200000",
        "tag": "Phones",
        "sale": {
            "months_ago": 8,
            "type": "credit",
            "buyer": "Siti Rahma",
            "phone": "0856-7788-9900",
            "down": "2000000",
            "tenor": 6,
        },
    },
    {
        "title": "Xiaomi Redmi Note 12",
        "description": "Murah meriah, masih garansi toko.",
        "buy": "2100000",
        "sell": "2600000",
        "tag": "Phones",
        # available
    },
    {
        "title": "Oppo Reno 8 5G",
        "description": "Kamera mantap, fast charging 80W.",
        "buy": "3400000",
        "sell": "4100000",
        "tag": "Phones",
        "sale": {
            "months_ago": 2,
            "type": "cash",
            "buyer": "Rizky Pratama",
            "phone": "0878-1212-3434",
        },
    },
    {
        "title": "Google Pixel 7",
        "description": "Kamera Pixel terbaik, ex-Singapore.",
        "buy": "4200000",
        "sell": "5200000",
        "tag": "Phones",
        "sale": {
            "months_ago": 3,
            "type": "credit",
            "buyer": "Dewi Lestari",
            "phone": "0852-9090-1010",
            "down": "1000000",
            "tenor": 12,
            "delinquent": True,
        },
    },
    {
        "title": "Samsung Galaxy A54",
        "description": "Tahan banting, IP67, layar Super AMOLED.",
        "buy": "3900000",
        "sell": "4700000",
        "tag": "Phones",
        # available
    },
    {
        "title": "iPhone 12 64GB",
        "description": "Klasik tapi gahar, batt service 100%.",
        "buy": "5200000",
        "sell": "6300000",
        "tag": "Phones",
        "sale": {
            "months_ago": 1,
            "type": "cash",
            "buyer": "Fajar Nugroho",
            "phone": "0811-5566-7788",
        },
    },
    # --- Cars ---
    {
        "title": "Toyota Avanza 1.3 G 2019",
        "description": "Pajak panjang, KM 60rb, service record Toyota.",
        "buy": "165000000",
        "sell": "182000000",
        "tag": "Cars",
        "sale": {
            "months_ago": 9,
            "type": "credit",
            "buyer": "Hendra Gunawan",
            "phone": "0817-2345-6789",
            "down": "40000000",
            "tenor": 18,
        },
    },
    {
        "title": "Honda Brio Satya E 2021",
        "description": "Tangan pertama, mulus, ban baru.",
        "buy": "138000000",
        "sell": "151000000",
        "tag": "Cars",
        "sale": {"months_ago": 4, "type": "cash", "buyer": "Maya Sari", "phone": "0813-9988-7766"},
    },
    {
        "title": "Daihatsu Xenia R 2020",
        "description": "Irit BBM, kabin luas, AC dingin.",
        "buy": "148000000",
        "sell": "162000000",
        "tag": "Cars",
        # available
    },
    {
        "title": "Suzuki Ertiga GL 2018",
        "description": "MPV keluarga, interior bersih, mesin halus.",
        "buy": "142000000",
        "sell": "156000000",
        "tag": "Cars",
        "sale": {
            "months_ago": 6,
            "type": "credit",
            "buyer": "Joko Susilo",
            "phone": "0856-1234-5678",
            "down": "30000000",
            "tenor": 12,
        },
    },
    {
        "title": "Honda Jazz RS 2017",
        "description": "Hatchback sporty, audio upgrade, pajak hidup.",
        "buy": "175000000",
        "sell": "192000000",
        "tag": "Cars",
        "sale": {
            "months_ago": 4,
            "type": "credit",
            "buyer": "Putri Anggraini",
            "phone": "0878-4321-0987",
            "down": "45000000",
            "tenor": 12,
        },
    },
    {
        "title": "Toyota Rush S TRD 2019",
        "description": "SUV tangguh, 7 seater, kondisi prima.",
        "buy": "205000000",
        "sell": "224000000",
        "tag": "Cars",
        # available
    },
]


class Command(BaseCommand):
    help = "Create the demo user and seed realistic phone/car inventory, sales, and credits."

    @transaction.atomic
    def handle(self, *args, **options):
        today = timezone.localdate()

        demo, _ = User.objects.get_or_create(username=DEMO_EMAIL, defaults={"email": DEMO_EMAIL})
        demo.email = DEMO_EMAIL
        demo.is_staff = False
        demo.is_superuser = False
        demo.set_password(DEMO_PASSWORD)
        demo.save()
        token, _ = Token.objects.get_or_create(user=demo)

        # Wipe prior demo data. Order matters: Sale->Product is PROTECT, so delete
        # Sales first (cascades Credit + Installment via Credit->Sale CASCADE),
        # then Products, then Tags.
        Sale.objects.filter(actor=demo).delete()
        Product.objects.filter(actor=demo).delete()
        Tag.objects.filter(actor=demo).delete()

        tags = {name: Tag.objects.create(name=name, actor=demo) for name in ("Phones", "Cars")}

        counts = {"products": 0, "cash": 0, "credit": 0, "available": 0}

        for spec in PRODUCTS:
            product = Product.objects.create(
                title=spec["title"],
                description=spec["description"],
                buy_price=D(spec["buy"]),
                sell_price=D(spec["sell"]),
                actor=demo,
            )
            product.tags.add(tags[spec["tag"]])
            counts["products"] += 1

            sale_spec = spec.get("sale")
            if not sale_spec:
                counts["available"] += 1
                continue

            sold_on = add_months(today, -sale_spec["months_ago"])
            sale = Sale.objects.create(
                product=product,
                sale_type=sale_spec["type"],
                sale_price=product.sell_price,
                sold_on=sold_on,
                buyer_name=sale_spec["buyer"],
                buyer_phone=sale_spec.get("phone", ""),
                actor=demo,
            )

            if sale_spec["type"] == Sale.Type.CREDIT:
                down = D(sale_spec["down"])
                tenor = sale_spec["tenor"]
                monthly = ((product.sell_price - down) / tenor).quantize(
                    CENTS, rounding=ROUND_HALF_UP
                )
                credit = Credit.objects.create(
                    sale=sale,
                    total_price=product.sell_price,
                    down_payment=down,
                    tenor_months=tenor,
                    monthly_amount=monthly,
                    actor=demo,
                )
                _build_installments(credit, sale.sold_on)
                self._settle_installments(
                    credit, today, delinquent=sale_spec.get("delinquent", False)
                )
                counts["credit"] += 1
            else:
                counts["cash"] += 1

            product.status = Product.Status.SOLD
            product.save(update_fields=["status", "updated_on"])

        # Flip any still-due past installments (the delinquent credit) to overdue,
        # mirroring the lazy read-path behaviour of the credit/dashboard endpoints.
        overdue = mark_overdue(today)

        self.stdout.write(
            self.style.SUCCESS(
                "Demo data seeded.\n"
                f"  login:      {DEMO_EMAIL} / {DEMO_PASSWORD}\n"
                f"  token:      {token.key}\n"
                f"  products:   {counts['products']} "
                f"({counts['available']} available, "
                f"{counts['cash']} cash sold, {counts['credit']} credit sold)\n"
                f"  overdue:    {overdue} installment(s) marked overdue"
            )
        )

    def _settle_installments(self, credit, today, delinquent):
        """Mark already-due installments PAID (paid_on = due_date). A delinquent
        credit leaves its past installments unpaid so `mark_overdue` flips them."""
        if delinquent:
            return
        paid_rows = []
        for inst in credit.installments.all():
            if inst.due_date <= today:
                inst.status = Installment.Status.PAID
                inst.paid_on = inst.due_date
                paid_rows.append(inst)
        if paid_rows:
            Installment.objects.bulk_update(paid_rows, ["status", "paid_on"])

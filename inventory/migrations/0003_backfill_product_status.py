from django.db import migrations


def backfill_status(apps, schema_editor):
    Product = apps.get_model("inventory", "Product")
    Sale = apps.get_model("sales", "Sale")
    Credit = apps.get_model("credit", "Credit")
    Installment = apps.get_model("credit", "Installment")

    # reserved is dropped -> treat as still in stock
    Product.objects.filter(status="reserved").update(status="available")

    for product in Product.objects.filter(status="sold"):
        sale = Sale.objects.filter(product=product).first()
        if sale is None:
            product.status = "available"
            product.save(update_fields=["status"])
            continue
        if sale.sale_type == "cash":
            product.status = "sold_cash"
        else:
            credit = Credit.objects.filter(sale=sale).first()
            unpaid = (
                credit is not None
                and Installment.objects.filter(credit=credit).exclude(status="paid").exists()
            )
            product.status = "ongoing_installment" if unpaid else "installment_paid"
        product.save(update_fields=["status"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("inventory", "0002_alter_product_status"),
        ("sales", "0001_initial"),
        ("credit", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_status, noop_reverse),
    ]

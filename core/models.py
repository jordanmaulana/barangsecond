from bson.objectid import ObjectId
from django.contrib.auth.models import User
from django.db import models


def make_object_id():
    return str(ObjectId())


def add_months(d, months):
    """Return date `d` shifted forward by `months`, clamping the day to the
    target month's last valid day (e.g. Jan 31 + 1 month -> Feb 28/29)."""
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    # last day of target month: day 1 of next month minus one day
    if month == 12:
        next_month_first = d.replace(year=year + 1, month=1, day=1)
    else:
        next_month_first = d.replace(year=year, month=month + 1, day=1)
    from datetime import timedelta

    last_day = (next_month_first - timedelta(days=1)).day
    return d.replace(year=year, month=month, day=min(d.day, last_day))


class BaseModel(models.Model):
    id = models.CharField(primary_key=True, default=make_object_id, editable=False)
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        abstract = True
        ordering = ["id"]
        indexes = [models.Index(fields=["created_on"])]

    def __str__(self):
        return f"{self.id}"


class AppSetting(models.Model):
    key = models.CharField()
    should_be_unique = models.BooleanField(default=True)
    str_value = models.TextField(null=True, blank=True)
    int_value = models.IntegerField(null=True, blank=True)
    float_value = models.FloatField(null=True, blank=True)
    bool_value = models.BooleanField(default=True)

    class Meta:
        app_label = "core"

    @staticmethod
    def get(key, value_type, default=None):
        if value_type not in ["str", "int", "float", "bool"]:
            raise ValueError("Value type should be one of str, int, float, or bool")
        try:
            setting = AppSetting.objects.get(key__iexact=key)
            return getattr(setting, f"{value_type}_value")
        except AppSetting.DoesNotExist:
            return default

    def __str__(self):
        return self.key


MONEY = {"max_digits": 14, "decimal_places": 2}

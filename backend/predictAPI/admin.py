from django.contrib import admin
from .models import user_setting, TLE_db


class user_settings_admin_model(admin.ModelAdmin):
    model = user_setting


class TLE_db_admin_model(admin.ModelAdmin):
    model = TLE_db
# Register your models here.


admin.site.register(user_setting, user_settings_admin_model)
admin.site.register(TLE_db, TLE_db_admin_model)

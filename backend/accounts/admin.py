from django.contrib import admin
from .models import Role, UserRole

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('role_name', 'description')
    search_fields = ('role_name',)

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('employee', 'role', 'assigned_date')
    list_filter = ('role', 'assigned_date')
    raw_id_fields = ('employee',)

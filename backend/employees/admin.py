from django.contrib import admin
from .models import Location, Branch, Department, Employee, EmployeeAddress

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('city', 'state', 'country', 'postal_code')
    search_fields = ('city', 'country')

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('branch_name', 'location')
    list_filter = ('location',)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('department_name', 'department_code', 'branch', 'manager')
    search_fields = ('department_name', 'department_code')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'first_name', 'last_name', 'email', 'job_title', 'department', 'status')
    list_filter = ('status', 'employment_type', 'department', 'branch')
    search_fields = ('employee_id', 'first_name', 'last_name', 'email')
    raw_id_fields = ('user', 'manager')

@admin.register(EmployeeAddress)
class EmployeeAddressAdmin(admin.ModelAdmin):
    list_display = ('employee', 'address_type', 'city', 'country')
    list_filter = ('address_type',)

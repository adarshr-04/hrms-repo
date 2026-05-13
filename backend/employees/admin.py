from django.contrib import admin
from .models import Department, Employee


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('department_name', 'description')
    search_fields = ('department_name',)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        'employee_id', 'first_name', 'last_name', 'email',
        'job_title', 'department', 'employment_type', 'status'
    )
    list_filter = ('department', 'status', 'employment_type', 'gender')
    search_fields = ('first_name', 'last_name', 'employee_id', 'email')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Primary Information', {
            'fields': ('user', 'employee_id', 'first_name', 'last_name', 'avatar')
        }),
        ('Contact Details', {
            'fields': ('email', 'phone_number', 'alternative_email', 'alternative_phone_number')
        }),
        ('Professional Details', {
            'fields': ('department', 'job_title', 'employment_type', 'status', 'hire_date', 'end_date', 'manager')
        }),
        ('Personal Details', {
            'fields': ('gender', 'date_of_birth', 'current_address', 'permanent_address')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


from django.contrib import admin
from .models import Payroll

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'pay_period_start', 'pay_period_end', 'net_pay', 'status', 'pay_date', 'payment_mode')
    list_filter = ('status', 'payment_mode', 'pay_date', 'employee__department', 'pay_period_start')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id')
    date_hierarchy = 'pay_date'
    raw_id_fields = ('employee',)

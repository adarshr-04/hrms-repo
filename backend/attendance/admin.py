from django.contrib import admin
from .models import Attendance, Shift, AttendanceRequest

@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_time', 'end_time', 'grace_period')
    search_fields = ('name',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'attendance_date', 'check_in', 'check_out', 'work_hours', 'status')
    list_filter = ('status', 'attendance_date', 'employee__department')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id')
    date_hierarchy = 'attendance_date'

@admin.register(AttendanceRequest)
class AttendanceRequestAdmin(admin.ModelAdmin):
    list_display = ('employee', 'attendance_date', 'request_type', 'status', 'reviewed_by')
    list_filter = ('status', 'request_type', 'attendance_date')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id')


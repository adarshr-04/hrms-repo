from django.contrib import admin
from .models import Attendance

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'attendance_date', 'check_in', 'check_out', 'work_hours', 'status')
    list_filter = ('status', 'attendance_date', 'employee__department')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id')
    date_hierarchy = 'attendance_date'

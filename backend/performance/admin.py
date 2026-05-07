from django.contrib import admin
from .models import Performance

@admin.register(Performance)
class PerformanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'reviewer', 'review_date', 'rating', 'status')
    list_filter = ('rating', 'status', 'review_date')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id', 'comments')
    date_hierarchy = 'review_date'
    raw_id_fields = ('employee', 'reviewer')

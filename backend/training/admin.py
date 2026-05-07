from django.contrib import admin
from .models import Training, Enrollment

@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ('training_name', 'training_date', 'trainer_name', 'duration')
    list_filter = ('training_date',)
    search_fields = ('training_name', 'trainer_name')

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'training', 'enrollment_date', 'completion_date', 'status', 'score')
    list_filter = ('status', 'training')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id', 'training__training_name')
    raw_id_fields = ('employee', 'training')

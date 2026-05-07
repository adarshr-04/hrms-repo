from django.contrib import admin
from .models import Project, ProjectAssignment

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('project_name', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'start_date')
    search_fields = ('project_name',)

@admin.register(ProjectAssignment)
class ProjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'project', 'role', 'hours_worked', 'assigned_date')
    list_filter = ('project', 'role')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id', 'role')
    raw_id_fields = ('employee', 'project')

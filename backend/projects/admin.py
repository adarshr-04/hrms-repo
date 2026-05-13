from django.contrib import admin
from .models import Project, ProjectAssignment, TaskLog

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('project_name', 'start_date', 'end_date', 'status')
    list_filter = ('status',)
    search_fields = ('project_name',)

@admin.register(ProjectAssignment)
class ProjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'project', 'role', 'assigned_date')
    list_filter = ('role', 'project')
    search_fields = ('employee__first_name', 'employee__last_name', 'role')

@admin.register(TaskLog)
class TaskLogAdmin(admin.ModelAdmin):
    list_display = ('date', 'owner', 'status', 'task_description')
    list_filter = ('status', 'owner', 'date')
    search_fields = ('task_description', 'owner', 'remarks')

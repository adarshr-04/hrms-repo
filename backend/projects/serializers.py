from rest_framework import serializers
from .models import Project, ProjectAssignment, TaskLog

class ProjectSerializer(serializers.ModelSerializer):
    assignment_count = serializers.IntegerField(source='assignments.count', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'project_name', 'start_date', 'end_date', 'status', 'assignment_count', 'created_at', 'updated_at']

class ProjectAssignmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.get_full_name')
    project_name = serializers.ReadOnlyField(source='project.project_name')

    class Meta:
        model = ProjectAssignment
        fields = '__all__'

class TaskLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskLog
        fields = '__all__'

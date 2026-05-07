from rest_framework import serializers
from .models import Project, ProjectAssignment

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class ProjectAssignmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.get_full_name')
    project_name = serializers.ReadOnlyField(source='project.project_name')

    class Meta:
        model = ProjectAssignment
        fields = '__all__'

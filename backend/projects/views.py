from rest_framework import viewsets
from .models import Project, ProjectAssignment
from .serializers import ProjectSerializer, ProjectAssignmentSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filterset_fields = ['status']
    search_fields = ['project_name']

class ProjectAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectAssignment.objects.all()
    serializer_class = ProjectAssignmentSerializer
    filterset_fields = ['employee', 'project', 'role']
    search_fields = ['employee__first_name', 'employee__last_name', 'role']

from rest_framework import viewsets
from .models import Location, Branch, Department, Employee, EmployeeAddress
from .serializers import (
    LocationSerializer, BranchSerializer, DepartmentSerializer, 
    EmployeeSerializer, EmployeeAddressSerializer
)

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    filterset_fields = ['department', 'branch', 'status', 'employment_type']
    search_fields = ['first_name', 'last_name', 'employee_id', 'email']

class EmployeeAddressViewSet(viewsets.ModelViewSet):
    queryset = EmployeeAddress.objects.all()
    serializer_class = EmployeeAddressSerializer

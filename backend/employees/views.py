from rest_framework import viewsets, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
import pandas as pd
from .models import Department, Employee
from .serializers import (
    DepartmentSerializer, 
    EmployeeSerializer
)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)
    filterset_fields = ['department', 'status', 'employment_type']
    search_fields = ['first_name', 'last_name', 'employee_id', 'email']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("VALIDATION ERROR:", serializer.errors)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='bulk-import')
    def bulk_import(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            else:
                df = pd.read_excel(file)

            created_count = 0
            errors = []

            for index, row in df.iterrows():
                try:
                    # Get or create department by name
                    dept_name = row.get('department')
                    dept = None
                    if dept_name:
                        dept, _ = Department.objects.get_or_create(department_name=dept_name)

                    # Create employee
                    Employee.objects.create(
                        first_name=row.get('first_name'),
                        last_name=row.get('last_name'),
                        email=row.get('email'),
                        employee_id=row.get('employee_id'),
                        job_title=row.get('job_title', 'Employee'),
                        department=dept,
                        phone_number=row.get('phone_number'),
                        hire_date=row.get('hire_date', '2024-01-01'),
                        date_of_birth=row.get('date_of_birth', '1990-01-01'),
                        status='ACTIVE'
                    )
                    created_count += 1
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")

            return Response({
                "message": f"Successfully imported {created_count} employees",
                "errors": errors
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

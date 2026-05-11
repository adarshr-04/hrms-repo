from rest_framework import serializers
from .models import Location, Branch, Department, Employee, EmployeeAddress

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class BranchSerializer(serializers.ModelSerializer):
    location_details = LocationSerializer(source='location', read_only=True)
    
    class Meta:
        model = Branch
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    branch_details = BranchSerializer(source='branch', read_only=True)
    manager_name = serializers.ReadOnlyField(source='manager.get_full_name')

    class Meta:
        model = Department
        fields = '__all__'

class EmployeeAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAddress
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    manager_name = serializers.ReadOnlyField(source='manager.get_full_name')
    addresses = EmployeeAddressSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'email', 
            'phone_number', 'date_of_birth', 'hire_date', 'job_title', 
            'employment_type', 'status', 'department', 
            'branch', 'manager', 'manager_name', 'addresses',
            'created_at', 'updated_at'
        ]

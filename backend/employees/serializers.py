from rest_framework import serializers
from .models import Department, Employee

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    manager_name = serializers.ReadOnlyField(source='manager.get_full_name')
    department_name = serializers.ReadOnlyField(source='department.department_name')

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'email', 
            'phone_number', 'date_of_birth', 'hire_date', 'job_title', 
            'employment_type', 'status', 'department', 'department_name',
            'manager', 'manager_name', 'avatar',
            'alternative_email', 'alternative_phone_number', 
            'current_address', 'permanent_address', 'end_date',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'email': {
                'error_messages': {
                    'unique': "This email address is already registered to another staff member. Please use a different email."
                }
            },
            'employee_id': {
                'required': False, 
                'allow_blank': True,
                'error_messages': {
                    'unique': "This Employee ID is already in use. Please provide a unique ID or leave it blank to auto-generate."
                }
            },
            'last_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'department': {'required': False, 'allow_null': True},
            'employment_type': {'required': False},
            'status': {'required': False},
            'manager': {'required': False, 'allow_null': True},
            'date_of_birth': {'required': False, 'allow_null': True},
            'hire_date': {'required': False, 'allow_null': True},
        }

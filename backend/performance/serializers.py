from rest_framework import serializers
from .models import Performance

class PerformanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.get_full_name')
    reviewer_name = serializers.ReadOnlyField(source='reviewer.get_full_name')

    class Meta:
        model = Performance
        fields = '__all__'

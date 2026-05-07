from rest_framework import viewsets
from .models import Performance
from .serializers import PerformanceSerializer

class PerformanceViewSet(viewsets.ModelViewSet):
    queryset = Performance.objects.all()
    serializer_class = PerformanceSerializer
    filterset_fields = ['employee', 'status', 'rating']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']

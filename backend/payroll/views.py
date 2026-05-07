from rest_framework import viewsets
from .models import Payroll
from .serializers import PayrollSerializer

class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.all()
    serializer_class = PayrollSerializer
    filterset_fields = ['employee', 'payment_mode']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']

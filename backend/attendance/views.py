from rest_framework import viewsets
from .models import Attendance
from .serializers import AttendanceSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    filterset_fields = ['employee', 'attendance_date', 'status']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']

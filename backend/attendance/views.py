from rest_framework import viewsets
from django.db.models import Q
from .models import Attendance
from .serializers import AttendanceSerializer
from accounts.utils import get_user_role

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    pagination_class = None
    filterset_fields = ['employee', 'attendance_date', 'status']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return Attendance.objects.none()

        role = get_user_role(user)

        if role in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            return Attendance.objects.all()
        elif role == 'DEPT_MANAGER':
            try:
                emp_profile = user.employee_profile
                return Attendance.objects.filter(
                    Q(employee=emp_profile) | Q(employee__manager=emp_profile)
                )
            except Exception:
                return Attendance.objects.none()
        else:
            try:
                emp_profile = user.employee_profile
                return Attendance.objects.filter(employee=emp_profile)
            except Exception:
                return Attendance.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not user or user.is_anonymous:
            from rest_framework.exceptions import NotAuthenticated
            raise NotAuthenticated()

        role = get_user_role(user)
        if role in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            serializer.save()
            return

        employee = serializer.validated_data.get('employee')
        try:
            emp_profile = user.employee_profile
            if role == 'DEPT_MANAGER':
                if employee != emp_profile and employee.manager != emp_profile:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only log attendance for yourself or your subordinates.")
            else:
                if employee != emp_profile:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only log attendance for yourself.")
        except Exception:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Invalid profile lookup.")

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if not user or user.is_anonymous:
            from rest_framework.exceptions import NotAuthenticated
            raise NotAuthenticated()

        role = get_user_role(user)
        if role in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            serializer.save()
            return

        employee = serializer.instance.employee
        try:
            emp_profile = user.employee_profile
            if role == 'DEPT_MANAGER':
                if employee != emp_profile and employee.manager != emp_profile:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only update attendance for yourself or your subordinates.")
            else:
                if employee != emp_profile:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only update your own attendance.")
        except Exception:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Invalid profile lookup.")

        serializer.save()

    def destroy(self, request, *args, **kwargs):
        user = request.user
        role = get_user_role(user)
        if role in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            return super().destroy(request, *args, **kwargs)
        
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Only HR and Admin can delete attendance records.")


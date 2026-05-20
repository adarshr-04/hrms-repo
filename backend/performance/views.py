from rest_framework import viewsets
from django.db.models import Q
from .models import Performance
from .serializers import PerformanceSerializer
from accounts.utils import get_user_role

class PerformanceViewSet(viewsets.ModelViewSet):
    queryset = Performance.objects.all()
    serializer_class = PerformanceSerializer
    filterset_fields = ['employee', 'status', 'rating']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return Performance.objects.none()

        role = get_user_role(user)

        if role in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            return Performance.objects.all()
        elif role == 'DEPT_MANAGER':
            try:
                emp_profile = user.employee_profile
                return Performance.objects.filter(
                    Q(employee=emp_profile) | Q(employee__manager=emp_profile) | Q(reviewer=emp_profile)
                )
            except Exception:
                return Performance.objects.none()
        else:
            try:
                emp_profile = user.employee_profile
                return Performance.objects.filter(employee=emp_profile)
            except Exception:
                return Performance.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not user or user.is_anonymous:
            from rest_framework.exceptions import NotAuthenticated
            raise NotAuthenticated()

        role = get_user_role(user)
        if role in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            serializer.save()
            return

        if role == 'DEPT_MANAGER':
            employee = serializer.validated_data.get('employee')
            try:
                emp_profile = user.employee_profile
                if employee.manager != emp_profile or employee == emp_profile:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only submit reviews for your direct reports.")
            except Exception:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Invalid profile lookup.")
            serializer.save(reviewer=emp_profile)
            return

        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Standard employees do not have permission to submit performance reviews.")

    def perform_update(self, serializer):
        user = self.request.user
        if not user or user.is_anonymous:
            from rest_framework.exceptions import NotAuthenticated
            raise NotAuthenticated()

        role = get_user_role(user)
        if role in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            serializer.save()
            return

        if role == 'DEPT_MANAGER':
            review_instance = serializer.instance
            employee = review_instance.employee
            try:
                emp_profile = user.employee_profile
                if review_instance.reviewer != emp_profile and employee.manager != emp_profile:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only modify reviews for your direct reports or reviews you authored.")
            except Exception:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Invalid profile lookup.")
            serializer.save()
            return

        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Standard employees do not have permission to modify performance reviews.")

    def destroy(self, request, *args, **kwargs):
        user = request.user
        role = get_user_role(user)
        if role in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            return super().destroy(request, *args, **kwargs)

        if role == 'DEPT_MANAGER':
            instance = self.get_object()
            employee = instance.employee
            try:
                emp_profile = user.employee_profile
                if instance.reviewer != emp_profile and employee.manager != emp_profile:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only delete reviews for your direct reports or reviews you authored.")
            except Exception:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Invalid profile lookup.")
            return super().destroy(request, *args, **kwargs)

        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Standard employees do not have permission to delete performance reviews.")


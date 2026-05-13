from rest_framework import views, response, permissions, serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'department', 'employee_id']

    def get_role(self, obj):
        # Normalize roles to the set the frontend expects.
        # Pick the highest-privilege role when multiple are assigned.
        if obj.is_superuser:
            return 'SUPER_ADMIN'

        role_priority = ['ADMIN', 'DEPT_MANAGER', 'EMPLOYEE']
        try:
            employee_profile = getattr(obj, 'employee_profile', None)
            if not employee_profile:
                return 'EMPLOYEE'

            role_names = (
                employee_profile.roles
                .select_related('role')
                .values_list('role__role_name', flat=True)
            )
            normalized = {str(name).strip().upper() for name in role_names if name}
            for role in role_priority:
                if role in normalized:
                    return role
            return 'EMPLOYEE'
        except Exception:
            return 'EMPLOYEE'

    def get_department(self, obj):
        try:
            return obj.employee_profile.department.department_name if obj.employee_profile.department else None
        except:
            return None

    def get_employee_id(self, obj):
        try:
            # Return the public employee identifier (EMP-0001...), not the DB pk.
            return obj.employee_profile.employee_id
        except Exception:
            return None

class ProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return response.Response(serializer.data)

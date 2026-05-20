from rest_framework import views, response, permissions, serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    employee_profile_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'department', 'employee_id', 'employee_profile_id']

    def get_role(self, obj):
        from accounts.utils import get_user_role
        return get_user_role(obj)

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

    def get_employee_profile_id(self, obj):
        try:
            return obj.employee_profile.id
        except Exception:
            return None

class ProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return response.Response(serializer.data)

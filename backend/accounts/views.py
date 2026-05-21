from rest_framework import views, response, permissions, serializers
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import User
from django.db import transaction

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
        data = serializer.data
        try:
            emp = request.user.employee_profile
            data['phone_number'] = emp.phone_number
            data['alternative_email'] = emp.alternative_email
            data['alternative_phone_number'] = emp.alternative_phone_number
            data['current_address'] = emp.current_address
            data['permanent_address'] = emp.permanent_address
            data['avatar'] = emp.avatar.url if emp.avatar else None
        except Exception:
            pass
        return response.Response(data)

    @transaction.atomic
    def patch(self, request):
        user = request.user
        data = request.data

        # Update User model fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            # Email uniqueness check for user model if changed
            new_email = data['email']
            if new_email != user.email:
                if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                    raise ValidationError({'email': 'This email address is already in use.'})
                user.email = new_email
        user.save()

        # Update Employee profile if it exists
        try:
            emp = user.employee_profile
            if 'first_name' in data:
                emp.first_name = data['first_name']
            if 'last_name' in data:
                emp.last_name = data['last_name']
            if 'email' in data:
                emp.email = data['email']
            if 'phone_number' in data:
                emp.phone_number = data['phone_number']
            if 'alternative_email' in data:
                emp.alternative_email = data['alternative_email']
            if 'alternative_phone_number' in data:
                emp.alternative_phone_number = data['alternative_phone_number']
            if 'current_address' in data:
                emp.current_address = data['current_address']
            if 'permanent_address' in data:
                emp.permanent_address = data['permanent_address']
            if 'avatar' in request.FILES:
                emp.avatar = request.FILES['avatar']
            elif 'avatar' in data and data['avatar'] is None:
                emp.avatar = None
            emp.save()
        except Exception:
            pass

        return self.get(request)

class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            raise ValidationError({'error': 'Both current_password and new_password are required.'})

        if not user.check_password(current_password):
            raise ValidationError({'current_password': 'Old password is incorrect.'})

        user.set_password(new_password)
        user.save()
        return response.Response({'message': 'Password changed successfully.'})

from rest_framework import viewsets, decorators
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'link', 'is_read', 'created_at']

class NotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        raise ValidationError({'error': 'Notifications are read-only for creation.'})

    @decorators.action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return response.Response({'status': 'marked as read'})

    @decorators.action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return response.Response({'status': 'all marked as read'})



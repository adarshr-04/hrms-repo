from django.conf import settings
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


import random
from .models import PasswordResetCode

class ForgotPasswordView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            raise ValidationError({'email': 'Email field is required.'})

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise ValidationError({'email': 'No registered employee found with this company email.'})

        # Generate 6-digit random code
        code = f"{random.randint(100000, 999999)}"
        PasswordResetCode.objects.filter(user=user, is_used=False).update(is_used=True)
        PasswordResetCode.objects.create(user=user, code=code)

        if settings.DEBUG:
            # Print to console for convenient local development access.
            print(f"\n=====================================")
            print(f"PASSWORD RESET REQUEST FOR: {email}")
            print(f"VERIFICATION CODE: {code}")
            print(f"=====================================\n")

        payload = {
            'message': 'Verification code sent successfully.',
            'email': email
        }
        if settings.DEBUG:
            payload['code'] = code

        return response.Response(payload)

class ResetPasswordView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('new_password')

        if not email or not code or not new_password:
            raise ValidationError({'error': 'Email, code, and new_password are required fields.'})

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise ValidationError({'error': 'No registered employee found with this company email.'})

        try:
            reset_record = PasswordResetCode.objects.get(user=user, code=code, is_used=False)
        except PasswordResetCode.DoesNotExist:
            raise ValidationError({'code': 'Invalid or expired verification code.'})

        # Set new password
        user.set_password(new_password)
        user.save()

        # Mark code as used
        reset_record.is_used = True
        reset_record.save()

        return response.Response({
            'message': 'Password has been reset successfully. You can now log in.'
        })


from .models import Announcement
from accounts.utils import get_user_role

class AnnouncementSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'priority', 'posted_by', 'posted_by_name', 'is_active', 'created_at']
        read_only_fields = ['posted_by', 'posted_by_name']

    def get_posted_by_name(self, obj):
        if obj.posted_by:
            return f"{obj.posted_by.first_name} {obj.posted_by.last_name}".strip() or obj.posted_by.username
        return 'System'

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.filter(is_active=True)
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def perform_create(self, serializer):
        role = get_user_role(self.request.user)
        if role not in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            raise ValidationError({'error': 'Only Admin and HR can post announcements.'})
        serializer.save(posted_by=self.request.user)

    def perform_update(self, serializer):
        role = get_user_role(self.request.user)
        if role not in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            raise ValidationError({'error': 'Only Admin and HR can edit announcements.'})
        serializer.save()

    def perform_destroy(self, instance):
        role = get_user_role(self.request.user)
        if role not in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            raise ValidationError({'error': 'Only Admin and HR can delete announcements.'})
        instance.is_active = False
        instance.save()

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileView, ChangePasswordView, NotificationViewSet, ForgotPasswordView, ResetPasswordView, AnnouncementViewSet

router = DefaultRouter()
router.register('notifications', NotificationViewSet, basename='notifications')
router.register('announcements', AnnouncementViewSet, basename='announcements')

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('', include(router.urls)),
]


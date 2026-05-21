from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileView, ChangePasswordView, NotificationViewSet

router = DefaultRouter()
router.register('notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('', include(router.urls)),
]


from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, ShiftViewSet, AttendanceRequestViewSet

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet)
router.register(r'shifts', ShiftViewSet)
router.register(r'requests', AttendanceRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]


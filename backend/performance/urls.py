from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PerformanceViewSet

router = DefaultRouter()
router.register(r'performance', PerformanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

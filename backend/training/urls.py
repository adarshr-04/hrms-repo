from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrainingViewSet, EnrollmentViewSet

router = DefaultRouter()
router.register(r'trainings', TrainingViewSet)
router.register(r'enrollments', EnrollmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

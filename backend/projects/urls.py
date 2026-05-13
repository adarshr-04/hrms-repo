from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectAssignmentViewSet, TaskLogViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'assignments', ProjectAssignmentViewSet)
router.register(r'task-logs', TaskLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

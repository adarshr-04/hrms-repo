from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobPostingViewSet, CandidateViewSet, ApplicationViewSet

router = DefaultRouter()
router.register(r'jobs', JobPostingViewSet)
router.register(r'candidates', CandidateViewSet)
router.register(r'applications', ApplicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobPostingViewSet, CandidateViewSet, ApplicationViewSet, InterviewViewSet, OfferLetterViewSet

router = DefaultRouter()
router.register(r'jobs', JobPostingViewSet)
router.register(r'candidates', CandidateViewSet)
router.register(r'applications', ApplicationViewSet)
router.register(r'interviews', InterviewViewSet)
router.register(r'offers', OfferLetterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]



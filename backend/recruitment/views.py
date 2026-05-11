from rest_framework import viewsets
from .models import JobPosting, Candidate, Application
from .serializers import JobPostingSerializer, CandidateSerializer, ApplicationSerializer

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    filterset_fields = ['status', 'employment_type', 'location']
    search_fields = ['title', 'description']

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    search_fields = ['first_name', 'last_name', 'email']

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    filterset_fields = ['job', 'candidate', 'status']

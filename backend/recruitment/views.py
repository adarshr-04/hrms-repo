from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from .models import JobPosting, Candidate, Application
from .serializers import JobPostingSerializer, CandidateSerializer, ApplicationSerializer
from accounts.utils import get_user_role

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    filterset_fields = ['status', 'employment_type', 'location']
    search_fields = ['title', 'description']

    def perform_create(self, serializer):
        user = self.request.user
        role = get_user_role(user)
        if role not in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            raise PermissionDenied("Only HR and Admins can create job postings.")
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        role = get_user_role(user)
        if role not in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            raise PermissionDenied("Only HR and Admins can modify job postings.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        user = request.user
        role = get_user_role(user)
        if role not in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            raise PermissionDenied("Only HR and Admins can delete job postings.")
        return super().destroy(request, *args, **kwargs)

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    search_fields = ['first_name', 'last_name', 'email']

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return Candidate.objects.none()
        role = get_user_role(user)
        if role not in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            raise PermissionDenied("You do not have permission to view candidate information.")
        return Candidate.objects.all()

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    filterset_fields = ['job', 'candidate', 'status']

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return Application.objects.none()
        role = get_user_role(user)
        if role not in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            raise PermissionDenied("You do not have permission to view job applications.")
        return Application.objects.all()


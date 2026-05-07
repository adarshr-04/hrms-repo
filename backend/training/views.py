from rest_framework import viewsets
from .models import Training, Enrollment
from .serializers import TrainingSerializer, EnrollmentSerializer

class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.all()
    serializer_class = TrainingSerializer
    search_fields = ['training_name', 'trainer_name']

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    filterset_fields = ['employee', 'training', 'status']
    search_fields = ['employee__first_name', 'employee__last_name', 'training__training_name']

from rest_framework import serializers
from .models import JobPosting, Candidate, Application

class JobPostingSerializer(serializers.ModelSerializer):
    application_count = serializers.IntegerField(source='applications.count', read_only=True)

    class Meta:
        model = JobPosting
        fields = '__all__'

class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = '__all__'

class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.ReadOnlyField(source='job.title')
    candidate_name = serializers.ReadOnlyField(source='candidate.__str__')

    class Meta:
        model = Application
        fields = '__all__'

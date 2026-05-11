from django.contrib import admin
from .models import JobPosting, Candidate, Application

@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ('title', 'location', 'employment_type', 'status', 'created_at')
    list_filter = ('status', 'employment_type', 'location')
    search_fields = ('title', 'description')

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone_number', 'created_at')
    search_fields = ('first_name', 'last_name', 'email')

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job', 'status', 'applied_at')
    list_filter = ('status', 'applied_at')
    search_fields = ('candidate__first_name', 'candidate__last_name', 'job__title')

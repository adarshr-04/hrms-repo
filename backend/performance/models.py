from django.db import models
from employees.models import BaseModel, Employee

class Performance(BaseModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('ACKNOWLEDGED', 'Acknowledged'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    reviewer = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='conducted_reviews')
    review_date = models.DateField()
    rating = models.IntegerField(help_text="Rating from 1 to 5")
    comments = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    class Meta:
        verbose_name_plural = "Performance"

    def __str__(self):
        return f"Review for {self.employee.employee_id} on {self.review_date}"

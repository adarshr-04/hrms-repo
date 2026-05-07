from django.db import models
from employees.models import BaseModel, Employee

class Role(BaseModel):
    role_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.role_name

class UserRole(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='employees')
    assigned_date = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('employee', 'role')

    def __str__(self):
        return f"{self.employee.employee_id} - {self.role.role_name}"

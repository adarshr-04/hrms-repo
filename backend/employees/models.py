from django.db import models
from django.contrib.auth.models import User

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Department(BaseModel):
    department_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.department_name

class Employee(BaseModel):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    EMPLOYMENT_TYPES = [
        ('FULL_TIME', 'Full-time'),
        ('PART_TIME', 'Part-time'),
        ('CONTRACT', 'Contract'),
        ('INTERN', 'Intern'),
    ]

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('TERMINATED', 'Terminated'),
        ('ON_LEAVE', 'On Leave'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile', null=True, blank=True)
    employee_id = models.CharField(max_length=20, unique=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    hire_date = models.DateField(blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, default='FULL_TIME')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    
    @property
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    alternative_email = models.EmailField(blank=True, null=True)
    alternative_phone_number = models.CharField(max_length=20, blank=True, null=True)
    current_address = models.TextField(blank=True, null=True)
    permanent_address = models.TextField(blank=True, null=True)
    end_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.employee_id:
            last_employee = Employee.objects.all().order_by('id').last()
            next_id = 1
            if last_employee:
                next_id = last_employee.id + 1
            
            self.employee_id = f'EMP-{next_id:04d}'
            
            # Uniqueness check loop
            while Employee.objects.filter(employee_id=self.employee_id).exists():
                next_id += 1
                self.employee_id = f'PITS{next_id:04d}'
                
        super(Employee, self).save(*args, **kwargs)

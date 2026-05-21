from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from accounts.utils import get_user_role
from .models import Notification

# Import target models safely (lazy import if needed, or normal import inside handler to avoid circular dependencies)

@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
    # This is a stub if we need to do real-time web sockets (optional)
    pass

# Helper to get all HR/Admin/SuperAdmin users
def get_hr_and_admin_users():
    users = User.objects.filter(is_active=True)
    recipients = []
    for u in users:
        role = get_user_role(u)
        if role in ['SUPER_ADMIN', 'ADMIN', 'HR']:
            recipients.append(u)
    return recipients

# 1. Leaves signals
@receiver(post_save, sender='leaves.Leave')
def leave_request_changed(sender, instance, created, **kwargs):
    try:
        from leaves.models import Leave
        employee = instance.employee
        
        # When leave request is newly created as PENDING
        if created:
            # 1. Notify manager
            if employee.manager and employee.manager.user:
                Notification.objects.create(
                    user=employee.manager.user,
                    title="New Leave Request",
                    message=f"{employee.get_full_name} has requested {instance.total_days} days of leave ({instance.leave_type}).",
                    link="/leaves"
                )
            # 2. Notify all HR/Admin
            hr_users = get_hr_and_admin_users()
            for hr in hr_users:
                # Avoid notifying manager twice
                if employee.manager and hr == employee.manager.user:
                    continue
                Notification.objects.create(
                    user=hr,
                    title="New Leave Request",
                    message=f"{employee.get_full_name} has requested {instance.total_days} days of leave ({instance.leave_type}).",
                    link="/leaves"
                )
        else:
            # When leave status has been modified
            if employee.user:
                Notification.objects.create(
                    user=employee.user,
                    title=f"Leave Request {instance.get_status_display()}",
                    message=f"Your leave request for {instance.total_days} days of {instance.leave_type} has been {instance.status.lower()} by the HR/Manager.",
                    link="/leaves"
                )
    except Exception as e:
        print(f"Error in leave signal: {e}")

# 2. Performance signals
@receiver(post_save, sender='performance.Performance')
def performance_review_changed(sender, instance, created, **kwargs):
    try:
        employee = instance.employee
        if employee.user:
            title = "New Performance Review Published" if created else "Performance Review Updated"
            msg = f"Your performance evaluation for date {instance.review_date} has been published with rating {instance.rating}/5."
            Notification.objects.create(
                user=employee.user,
                title=title,
                message=msg,
                link="/performance"
            )
    except Exception as e:
        print(f"Error in performance signal: {e}")

# 3. Payroll signals
@receiver(post_save, sender='payroll.Payroll')
def payroll_disbursed(sender, instance, created, **kwargs):
    try:
        employee = instance.employee
        # Notify only when paid
        if instance.status == 'PAID' and employee.user:
            Notification.objects.create(
                user=employee.user,
                title="Payslip Disbursed",
                message=f"Your salary statement for period {instance.pay_period_start} to {instance.pay_period_end} has been disbursed.",
                link="/payroll"
            )
    except Exception as e:
        print(f"Error in payroll signal: {e}")

# 4. Training signals
@receiver(post_save, sender='training.Enrollment')
def training_enrollment_changed(sender, instance, created, **kwargs):
    try:
        employee = instance.employee
        training = instance.training
        if employee.user:
            if created:
                Notification.objects.create(
                    user=employee.user,
                    title="New Training Enrollment",
                    message=f"You have been enrolled in the training program: {training.training_name}.",
                    link="/training"
                )
            elif instance.status == 'COMPLETED':
                score_str = f" with score {instance.score}%" if instance.score else ""
                Notification.objects.create(
                    user=employee.user,
                    title="Training Program Completed",
                    message=f"Congratulations! You completed the training '{training.training_name}'{score_str}.",
                    link="/training"
                )
    except Exception as e:
        print(f"Error in training signal: {e}")

# 5. Recruitment signals
@receiver(post_save, sender='recruitment.Application')
def recruitment_application_changed(sender, instance, created, **kwargs):
    try:
        job = instance.job
        candidate = instance.candidate
        
        # When a new candidate applies
        if created:
            hr_users = get_hr_and_admin_users()
            for hr in hr_users:
                Notification.objects.create(
                    user=hr,
                    title="New Job Application",
                    message=f"A new candidate, {candidate.first_name} {candidate.last_name}, has applied for '{job.title}'.",
                    link="/recruitment"
                )
        else:
            # When status of applicant changes
            hr_users = get_hr_and_admin_users()
            for hr in hr_users:
                Notification.objects.create(
                    user=hr,
                    title="Pipeline Candidate Updated",
                    message=f"Candidate {candidate.first_name} {candidate.last_name} ({job.title}) moved to state: {instance.get_status_display()}.",
                    link="/recruitment"
                )
    except Exception as e:
        print(f"Error in recruitment signal: {e}")

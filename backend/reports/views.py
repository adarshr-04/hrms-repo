from rest_framework import views, response, permissions
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count, Avg, Sum, Q
from django.db.models.functions import TruncMonth
from accounts.utils import get_user_role


def require_admin_hr(user):
    role = get_user_role(user)
    if role not in ['SUPER_ADMIN', 'ADMIN', 'HR']:
        raise PermissionDenied("Only Admin/HR users can access reports.")


# ─── 1. Workforce Report ───────────────────────────────────────────────────────
class WorkforceReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin_hr(request.user)
        from employees.models import Employee, Department

        employees = Employee.objects.all()

        # Total counts
        total = employees.count()
        active = employees.filter(status='ACTIVE').count()
        inactive = employees.filter(status='INACTIVE').count()
        terminated = employees.filter(status='TERMINATED').count()
        on_leave = employees.filter(status='ON_LEAVE').count()

        # By department
        by_dept = list(
            Department.objects.annotate(
                count=Count('employees')
            ).values('department_name', 'count').order_by('-count')
        )

        # By employment type
        by_type = list(
            employees.values('employment_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # By gender
        by_gender = list(
            employees.values('gender')
            .annotate(count=Count('id'))
        )

        return response.Response({
            'total': total,
            'by_status': {
                'active': active,
                'inactive': inactive,
                'terminated': terminated,
                'on_leave': on_leave,
            },
            'by_department': by_dept,
            'by_employment_type': by_type,
            'by_gender': by_gender,
        })


# ─── 2. Attendance Report ──────────────────────────────────────────────────────
class AttendanceReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin_hr(request.user)
        from attendance.models import Attendance

        year = request.query_params.get('year')
        qs = Attendance.objects.all()
        if year:
            qs = qs.filter(attendance_date__year=year)

        # Monthly trend (all statuses)
        monthly = list(
            qs.annotate(month=TruncMonth('attendance_date'))
            .values('month', 'status')
            .annotate(count=Count('id'))
            .order_by('month', 'status')
        )

        # Format month to string for JSON serialisation
        for row in monthly:
            if row['month']:
                row['month'] = row['month'].strftime('%Y-%m')

        # Status totals
        status_totals = {
            s: qs.filter(status=s).count()
            for s in ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE']
        }

        # Average work hours
        avg_hours = qs.filter(work_hours__isnull=False).aggregate(
            avg=Avg('work_hours')
        )['avg'] or 0

        return response.Response({
            'monthly_trend': monthly,
            'status_totals': status_totals,
            'avg_work_hours': round(float(avg_hours), 2),
        })


# ─── 3. Leaves Report ─────────────────────────────────────────────────────────
class LeavesReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin_hr(request.user)
        from leaves.models import Leave

        year = request.query_params.get('year')
        qs = Leave.objects.all()
        if year:
            qs = qs.filter(start_date__year=year)

        # By type
        by_type = list(
            qs.values('leave_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # By status
        by_status = list(
            qs.values('status')
            .annotate(count=Count('id'))
        )

        total = qs.count()
        approved = qs.filter(status='APPROVED').count()
        approval_rate = round((approved / total * 100), 1) if total else 0

        # Monthly trend
        monthly = list(
            qs.annotate(month=TruncMonth('start_date'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        for row in monthly:
            if row['month']:
                row['month'] = row['month'].strftime('%Y-%m')

        return response.Response({
            'total': total,
            'approval_rate': approval_rate,
            'by_type': by_type,
            'by_status': by_status,
            'monthly_trend': monthly,
        })


# ─── 4. Payroll Report ────────────────────────────────────────────────────────
class PayrollReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin_hr(request.user)
        from payroll.models import Payroll

        year = request.query_params.get('year')
        qs = Payroll.objects.all()
        if year:
            qs = qs.filter(pay_period_start__year=year)

        # Monthly spend
        monthly = list(
            qs.annotate(month=TruncMonth('pay_period_start'))
            .values('month')
            .annotate(total=Sum('net_pay'), count=Count('id'))
            .order_by('month')
        )
        for row in monthly:
            if row['month']:
                row['month'] = row['month'].strftime('%Y-%m')
            row['total'] = float(row['total'] or 0)

        # By department
        from employees.models import Department
        by_dept = []
        for dept in Department.objects.all():
            emp_ids = dept.employees.values_list('id', flat=True)
            dept_qs = qs.filter(employee_id__in=emp_ids)
            avg = dept_qs.aggregate(avg=Avg('net_pay'))['avg'] or 0
            total = dept_qs.aggregate(total=Sum('net_pay'))['total'] or 0
            by_dept.append({
                'department': dept.department_name,
                'avg_net_pay': round(float(avg), 2),
                'total_net_pay': round(float(total), 2),
                'count': dept_qs.count(),
            })

        # Status split
        paid = qs.filter(status='PAID').aggregate(total=Sum('net_pay'))['total'] or 0
        pending = qs.filter(status='PENDING').aggregate(total=Sum('net_pay'))['total'] or 0
        overall_total = qs.aggregate(total=Sum('net_pay'))['total'] or 0

        return response.Response({
            'monthly_trend': monthly,
            'by_department': sorted(by_dept, key=lambda x: x['total_net_pay'], reverse=True),
            'status_split': {
                'paid': round(float(paid), 2),
                'pending': round(float(pending), 2),
                'total': round(float(overall_total), 2),
            },
        })


# ─── 5. Performance Report ────────────────────────────────────────────────────
class PerformanceReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin_hr(request.user)
        from performance.models import Performance

        year = request.query_params.get('year')
        qs = Performance.objects.all()
        if year:
            qs = qs.filter(review_date__year=year)

        overall_avg = qs.aggregate(avg=Avg('rating'))['avg'] or 0

        # Rating distribution
        rating_dist = []
        for r in range(1, 6):
            rating_dist.append({
                'rating': r,
                'count': qs.filter(rating=r).count()
            })

        # Average by department
        from employees.models import Department
        by_dept = []
        for dept in Department.objects.all():
            emp_ids = dept.employees.values_list('id', flat=True)
            dept_qs = qs.filter(employee_id__in=emp_ids)
            avg = dept_qs.aggregate(avg=Avg('rating'))['avg'] or 0
            by_dept.append({
                'department': dept.department_name,
                'avg_rating': round(float(avg), 2),
                'count': dept_qs.count(),
            })

        # Top performers (rating >= 4)
        top_performers = list(
            qs.filter(rating__gte=4)
            .select_related('employee')
            .values('employee__first_name', 'employee__last_name',
                    'employee__employee_id', 'rating', 'review_date')
            .order_by('-rating', '-review_date')[:10]
        )

        return response.Response({
            'overall_avg_rating': round(float(overall_avg), 2),
            'rating_distribution': rating_dist,
            'by_department': sorted(by_dept, key=lambda x: x['avg_rating'], reverse=True),
            'top_performers': top_performers,
        })

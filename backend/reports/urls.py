from django.urls import path
from .views import (
    WorkforceReportView,
    AttendanceReportView,
    LeavesReportView,
    PayrollReportView,
    PerformanceReportView,
)

urlpatterns = [
    path('workforce/', WorkforceReportView.as_view(), name='report-workforce'),
    path('attendance/', AttendanceReportView.as_view(), name='report-attendance'),
    path('leaves/', LeavesReportView.as_view(), name='report-leaves'),
    path('payroll/', PayrollReportView.as_view(), name='report-payroll'),
    path('performance/', PerformanceReportView.as_view(), name='report-performance'),
]

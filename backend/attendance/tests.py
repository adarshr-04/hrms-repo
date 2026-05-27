from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from employees.models import Employee
from .models import Attendance

class AttendanceAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testemployee',
            email='testemployee@example.com',
            password='password123'
        )
        self.employee = Employee.objects.create(
            user=self.user,
            first_name='Test',
            last_name='Employee',
            email='testemployee@example.com'
        )
        self.attendance = Attendance.objects.create(
            employee=self.employee,
            attendance_date='2026-05-26',
            check_in='09:00:00',
            check_out='17:00:00',
            status='PRESENT',
            work_hours=8.0
        )

    def test_resume_shift_clears_check_out(self):
        self.client.force_authenticate(user=self.user)
        
        # Patch request to set check_out to None (null) and update check_in
        response = self.client.patch(
            f'/api/attendance/attendance/{self.attendance.id}/',
            {
                'check_in': '17:30:00',
                'check_out': None,
                'notes': 'Resumed shift'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from database
        self.attendance.refresh_from_db()
        self.assertEqual(str(self.attendance.check_in), '17:30:00')
        self.assertIsNone(self.attendance.check_out)
        self.assertEqual(self.attendance.notes, 'Resumed shift')

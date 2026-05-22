from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Role, UserRole
from employees.models import Employee
from .models import Project, ProjectAssignment


class ProjectAssignmentPermissionTests(APITestCase):
    def setUp(self):
        self.manager_user = User.objects.create_user(
            username='manager',
            email='manager@example.com',
            password='password123',
        )
        self.team_user = User.objects.create_user(
            username='team',
            email='team@example.com',
            password='password123',
        )
        self.other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='password123',
        )
        self.hr_user = User.objects.create_user(
            username='hr',
            email='hr@example.com',
            password='password123',
        )

        self.manager = Employee.objects.create(
            user=self.manager_user,
            first_name='Manager',
            email='manager@example.com',
        )
        self.team_member = Employee.objects.create(
            user=self.team_user,
            first_name='Team',
            email='team@example.com',
            manager=self.manager,
        )
        self.other_employee = Employee.objects.create(
            user=self.other_user,
            first_name='Other',
            email='other@example.com',
        )
        self.hr_employee = Employee.objects.create(
            user=self.hr_user,
            first_name='HR',
            email='hr@example.com',
        )

        manager_role = Role.objects.create(role_name='DEPT_MANAGER')
        hr_role = Role.objects.create(role_name='HR')
        UserRole.objects.create(employee=self.manager, role=manager_role)
        UserRole.objects.create(employee=self.hr_employee, role=hr_role)

        self.project = Project.objects.create(
            project_name='Website Refresh',
            start_date='2026-05-01',
            status='IN_PROGRESS',
        )

    def test_manager_can_assign_project_to_direct_report(self):
        self.client.force_authenticate(self.manager_user)

        response = self.client.post('/api/projects/assignments/', {
            'employee': self.team_member.id,
            'project': self.project.id,
            'role': 'Developer',
            'assigned_date': '2026-05-22',
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ProjectAssignment.objects.filter(
            employee=self.team_member,
            project=self.project,
        ).exists())

    def test_manager_cannot_assign_project_to_employee_outside_team(self):
        self.client.force_authenticate(self.manager_user)

        response = self.client.post('/api/projects/assignments/', {
            'employee': self.other_employee.id,
            'project': self.project.id,
            'role': 'Developer',
            'assigned_date': '2026-05-22',
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_hr_can_assign_project_to_any_employee(self):
        self.client.force_authenticate(self.hr_user)

        response = self.client.post('/api/projects/assignments/', {
            'employee': self.other_employee.id,
            'project': self.project.id,
            'role': 'Developer',
            'assigned_date': '2026-05-22',
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


class ForgotPasswordTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='password123',
        )

    @override_settings(DEBUG=False)
    def test_reset_code_is_not_returned_when_debug_is_false(self):
        response = self.client.post('/api/accounts/forgot-password/', {
            'email': self.user.email,
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('code', response.data)

    @override_settings(DEBUG=True)
    def test_reset_code_is_returned_in_debug_for_local_testing(self):
        response = self.client.post('/api/accounts/forgot-password/', {
            'email': self.user.email,
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('code', response.data)

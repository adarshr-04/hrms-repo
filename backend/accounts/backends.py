from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.db.models import Q

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        try:
            # Match either by username or by email case-insensitively
            user = User.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
        except User.DoesNotExist:
            return None
        except User.MultipleObjectsReturned:
            # In case multiple users have the same email address, try to return an active one
            return User.objects.filter(Q(username__iexact=username) | Q(email__iexact=username), is_active=True).first()
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

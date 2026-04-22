"""Entity UserProfile — extension du modele User Django."""

import uuid

from django.contrib.auth.models import User
from django.db import models

from app.domain.user.models.user_bean import ALL_SPECTRE_ROLES


class UserProfileEntity(models.Model):
    """Extension du modele User Django avec les champs metier SPECTRE."""

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=20,
        choices=[(r, r) for r in ALL_SPECTRE_ROLES],
    )
    laboratoire = models.CharField(max_length=100, blank=True, default="")
    service = models.CharField(max_length=100, blank=True, default="")
    numero = models.CharField(max_length=30, blank=True, default="")
    bureau = models.CharField(max_length=50, blank=True, default="")
    force_password_change = models.BooleanField(default=True)
    # Incrémenté à chaque émission d'un jeton d'activation — permet le single-use :
    # un jeton n'est valide que si sa version == version courante du profil.
    password_token_version = models.PositiveIntegerField(default=0)
    dashboard_preferences = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profile"
        indexes = [
            models.Index(fields=["uuid"], name="user_profile_uuid_idx"),
            models.Index(fields=["role"], name="user_profile_role_idx"),
        ]

    def __str__(self):
        return f"{self.user.username} ({self.role})"

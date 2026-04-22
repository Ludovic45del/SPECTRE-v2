"""Serializers utilisateur — validation input uniquement."""

from rest_framework import serializers

from app.domain.user.models.user_bean import ALL_SPECTRE_ROLES


class CreateUserSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150)
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")
    role = serializers.ChoiceField(choices=[(r, r) for r in ALL_SPECTRE_ROLES])
    laboratoire = serializers.CharField(max_length=100, required=False, default="")
    service = serializers.CharField(max_length=100, required=False, default="")
    numero = serializers.CharField(max_length=30, required=False, default="")
    bureau = serializers.CharField(max_length=50, required=False, default="")
    password = serializers.CharField(
        min_length=8,
        max_length=128,
        required=False,
        write_only=True,
    )


class UpdateUserSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    role = serializers.ChoiceField(choices=[(r, r) for r in ALL_SPECTRE_ROLES])
    laboratoire = serializers.CharField(max_length=100, required=False)
    service = serializers.CharField(max_length=100, required=False)
    numero = serializers.CharField(max_length=30, required=False)
    bureau = serializers.CharField(max_length=50, required=False)


class DashboardPreferencesSerializer(serializers.Serializer):
    layout = serializers.ListField(
        child=serializers.DictField(), required=False, default=list, max_length=20
    )
    widgets = serializers.DictField(required=False, default=dict)
    shortcuts = serializers.ListField(
        child=serializers.DictField(), required=False, default=list, max_length=50
    )
    todos = serializers.ListField(
        child=serializers.DictField(), required=False, default=list, max_length=100
    )


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        min_length=8,
        max_length=128,
        write_only=True,
    )


class SetInitialPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(
        min_length=8,
        max_length=128,
        write_only=True,
    )

"""JWT enrichi avec les informations de profil SPECTRE."""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class SpectreTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Ajoute role et force_password_change dans la reponse du login."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        if hasattr(user, "profile"):
            token["role"] = user.profile.role
            token["force_password_change"] = user.profile.force_password_change
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if hasattr(self.user, "profile"):
            data["role"] = self.user.profile.role
            data["force_password_change"] = self.user.profile.force_password_change
        data["first_name"] = self.user.first_name or None
        return data


class SpectreTokenObtainPairView(TokenObtainPairView):
    serializer_class = SpectreTokenObtainPairSerializer

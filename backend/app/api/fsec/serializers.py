"""Serializers FSEC - Validation des entrées pour les FSECs."""

from rest_framework import serializers


class FsecSerializer(serializers.Serializer):
    """Serializer pour la validation des FSECs."""

    # Versioning (optionnel pour création)
    version_uuid = serializers.UUIDField(required=False, allow_null=True)
    fsec_uuid = serializers.UUIDField(required=False, allow_null=True)

    # Foreign Keys
    campaign_id = serializers.UUIDField(required=False, allow_null=True)
    status_id = serializers.IntegerField(required=False, allow_null=True)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    rack_id = serializers.IntegerField(required=False, allow_null=True)

    # Champs de base
    name = serializers.CharField(max_length=50, required=True)
    comments = serializers.CharField(max_length=4000, required=False, allow_blank=True, allow_null=True)
    is_active = serializers.BooleanField(required=False, default=True)

    # Champs workflow
    delivery_date = serializers.DateField(required=False, allow_null=True)
    shooting_date = serializers.DateField(required=False, allow_null=True)
    preshooting_pressure = serializers.FloatField(required=False, allow_null=True)
    experience_srxx = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    localisation = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    depressurization_failed = serializers.BooleanField(required=False, allow_null=True)


class FsecDocumentsSerializer(serializers.Serializer):
    """Serializer pour la validation des documents FSEC."""

    uuid = serializers.UUIDField(required=False, allow_null=True)
    fsec_id = serializers.UUIDField(required=True)
    # Les sous-types FSEC sont seedés à partir de l'id 0
    # (cf. data/fsec/fsec_document_subtypes.csv, ex: "Visrad initial").
    subtype_id = serializers.IntegerField(required=True, min_value=0)
    name = serializers.CharField(max_length=100, required=True)
    path = serializers.CharField(max_length=500, required=True)
    date = serializers.DateField(required=True)


class FsecTeamsSerializer(serializers.Serializer):
    """Serializer pour la validation des membres d'équipe FSEC.

    name OU user_uuid est requis selon le rôle (MOE/TCI → name, autres → user_uuid).
    Le service `fsec_teams_service` valide la cohérence et renvoie 400 sinon.
    """

    uuid = serializers.UUIDField(required=False, allow_null=True)
    fsec_id = serializers.UUIDField(required=True)
    # Les rôles FSEC sont seedés à partir de l'id 0
    # (cf. data/fsec/fsec_roles.csv, ex: "RCE" id=0).
    role_id = serializers.IntegerField(required=True, min_value=0)
    name = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    user_uuid = serializers.UUIDField(required=False, allow_null=True)


class FsecCreateVersionSerializer(FsecSerializer):
    """Serializer pour la création d'une nouvelle version de FSEC.

    Hérite de FsecSerializer et retire les champs de versioning
    (version_uuid, fsec_uuid, is_active) qui sont gérés par le service.
    """

    version_uuid = None
    fsec_uuid = None
    is_active = None

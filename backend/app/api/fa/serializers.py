"""Serializers FA - Validation des entrées pour les Fiches d'Anomalie."""

from rest_framework import serializers


class FaSerializer(serializers.Serializer):
    """Serializer pour la validation des Fiches d'Anomalie (FA)."""

    # Identifiant (optionnel pour création)
    uuid = serializers.UUIDField(required=False, allow_null=True)

    # Foreign Keys
    fsec_version_id = serializers.UUIDField(required=False)
    status_id = serializers.IntegerField(required=False, allow_null=True)
    type_id = serializers.IntegerField(required=False, allow_null=True)
    criticality_id = serializers.IntegerField(required=False, allow_null=True)

    # Identifiant généré (en lecture seule)
    identifier = serializers.CharField(required=False, read_only=True)

    # Phase Ouvert
    fsec_step_id = serializers.IntegerField(required=False, allow_null=True)
    fsec_step_other = serializers.CharField(
        max_length=255, required=False, allow_blank=True, allow_null=True
    )
    discoverer = serializers.CharField(max_length=100, required=False, allow_blank=True)
    discoverer_user_uuid = serializers.UUIDField(required=False, allow_null=True)
    event_date = serializers.DateField(required=False, allow_null=True)
    observation = serializers.CharField(
        max_length=4000, required=False, allow_blank=True
    )
    location_equipment = serializers.CharField(
        max_length=255, required=False, allow_blank=True, allow_null=True
    )
    quick_analysis = serializers.CharField(
        max_length=4000, required=False, allow_blank=True
    )
    immediate_measures = serializers.CharField(
        max_length=4000, required=False, allow_blank=True, allow_null=True
    )
    iec_validation_open = serializers.BooleanField(required=False, default=False)
    iec_validation_open_date = serializers.DateField(required=False, allow_null=True)
    iec_validation_open_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    iec_validation_open_user_uuid = serializers.UUIDField(
        required=False, allow_null=True
    )

    # Phase En cours
    cause = serializers.CharField(
        max_length=4000, required=False, allow_blank=True, allow_null=True
    )
    experience_impact = serializers.CharField(
        max_length=4000, required=False, allow_blank=True, allow_null=True
    )
    iec_validation_progress = serializers.BooleanField(required=False, default=False)
    iec_validation_progress_date = serializers.DateField(
        required=False, allow_null=True
    )
    iec_validation_progress_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    iec_validation_progress_user_uuid = serializers.UUIDField(
        required=False, allow_null=True
    )

    # Phase Clos
    closure_validation = serializers.CharField(
        max_length=4000, required=False, allow_blank=True, allow_null=True
    )
    closure_date = serializers.DateField(required=False, allow_null=True)
    closure_validator_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    closure_validator_user_uuid = serializers.UUIDField(required=False, allow_null=True)


class FaPatchSerializer(serializers.Serializer):
    """Serializer pour le PATCH partiel des FA."""

    # Champs modifiables via PATCH
    status_id = serializers.IntegerField(required=False, allow_null=True)
    type_id = serializers.IntegerField(required=False, allow_null=True)
    criticality_id = serializers.IntegerField(required=False, allow_null=True)
    fsec_step_id = serializers.IntegerField(required=False, allow_null=True)
    fsec_step_other = serializers.CharField(
        max_length=255, required=False, allow_blank=True, allow_null=True
    )
    discoverer = serializers.CharField(max_length=100, required=False, allow_blank=True)
    discoverer_user_uuid = serializers.UUIDField(required=False, allow_null=True)
    event_date = serializers.DateField(required=False, allow_null=True)
    observation = serializers.CharField(
        max_length=4000, required=False, allow_blank=True
    )
    location_equipment = serializers.CharField(
        max_length=255, required=False, allow_blank=True, allow_null=True
    )
    quick_analysis = serializers.CharField(
        max_length=4000, required=False, allow_blank=True
    )
    immediate_measures = serializers.CharField(
        max_length=4000, required=False, allow_blank=True, allow_null=True
    )
    cause = serializers.CharField(
        max_length=4000, required=False, allow_blank=True, allow_null=True
    )
    experience_impact = serializers.CharField(
        max_length=4000, required=False, allow_blank=True, allow_null=True
    )


class FaValidatePhaseSerializer(serializers.Serializer):
    """Serializer pour la validation d'une phase FA (Ouvert ou En cours).

    `validator_name` reste accepte (legacy, transition). Au moins un des deux
    champs (`validator_name` ou `validator_user_uuid`) doit etre fourni : la
    coherence est validee dans le service avec rejet 400 si role != IEC.
    """

    validator_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True
    )
    validator_user_uuid = serializers.UUIDField(required=False, allow_null=True)
    validation_date = serializers.DateField(required=False)


class FaCloseSerializer(serializers.Serializer):
    """Serializer pour la fermeture d'une FA."""

    validator_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True
    )
    validator_user_uuid = serializers.UUIDField(required=False, allow_null=True)
    closure_validation = serializers.CharField(max_length=4000, required=False)
    closure_date = serializers.DateField(required=False)

"""Entité abstraite BaseStep - Champs communs pour toutes les étapes."""

import uuid

from django.db import models


class BaseStepEntity(models.Model):
    """Modèle abstrait avec les champs communs à toutes les étapes.

    Ce modèle définit les champs partagés par toutes les entités de type step:
    - fsec_version_id: Clé étrangère vers FsecEntity
    - operator: Opérateur ayant effectué l'étape
    - date_of_fulfilment: Date de réalisation
    - created_at: Date de création
    - modified_at: Date de modification
    """

    class Meta:
        abstract = True

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    operator = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    # Note: fsec_version_id doit être défini dans chaque sous-classe
    # car le related_name doit être unique pour chaque modèle

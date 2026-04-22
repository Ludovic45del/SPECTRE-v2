---
name: spectre-dev-assistant
description: Assistant de developpement pour le projet SPECTRE (Django REST + React TypeScript). Guide la creation de nouvelles entites metier, la correction de bugs avec tests, et le refactoring avec qualite. Use when user says "ajoute une entite", "nouveau module", "new entity", "add module", "fix le bug", "fix bug", "ce test echoue", "test fails", "refactor", "ameliore", "improve", "refactorise". Covers Clean Architecture backend (Bean, Service, Repository, Entity, Mapper, Controller) and Feature-Sliced Design frontend (Zod Schema, TanStack Query, Vitest, MSW).
license: MIT
metadata:
  author: SPECTRE Team
  version: 1.0.0
  category: development
  tags: [django, react, typescript, clean-architecture, fsd]
---

# SPECTRE Dev Assistant

Assistant de developpement pour le projet SPECTRE - application full-stack Django REST + React TypeScript de gestion de campagnes industrielles, FSECs, analyses de defaillance (FA) et planning labo.

## Important

- Reseau ferme : pas d'acces Internet en production
- PostgreSQL 16+ (dev et prod), configure via backend/.env
- Commentaires en francais acceptes
- Conventions strictes : Black 120, isort, Flake8 (backend) / ESLint + strict TS (frontend)
- Toujours consulter `references/architecture.md` et `references/conventions.md` pour les regles detaillees

---

## Use Case 1 : Ajout d'une nouvelle entite metier

**Declencheurs** : "ajoute une entite X", "nouveau module Y", "new entity X", "add module Y", "cree le modele Z"

### Workflow sequentiel (11 etapes backend + 6 etapes frontend)

Avant de commencer, demander a l'utilisateur :
- Le nom de l'entite (ex: "Inspection")
- Le module de rattachement (campaign, fsec, fa, steps, planning, embase, dashboard, user, ou nouveau)
- Les champs principaux et leurs types
- Les relations avec les entites existantes

### Phase 1 : Backend (dans cet ordre strict)

#### Etape 1 - Bean (DTO)
Creer `backend/app/domain/<module>/models/<name>_bean.py`

```python
from dataclasses import dataclass
from typing import Optional
from datetime import date, datetime
import uuid as uuid_lib

@dataclass
class <Name>Bean:
    id: Optional[int] = None
    uuid: Optional[uuid_lib.UUID] = None
    # champs metier ici
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
```

**Validation** : Verifier que le Bean n'importe aucun module Django/DRF.

#### Etape 2 - Interface Repository
Creer ou modifier `backend/app/domain/<module>/interface/<name>_repository.py`

```python
import abc
from typing import List, Optional
from app.domain.<module>.models.<name>_bean import <Name>Bean

class I<Name>Repository(abc.ABC):
    @abc.abstractmethod
    def create(self, bean: <Name>Bean) -> <Name>Bean:
        pass

    @abc.abstractmethod
    def get_by_uuid(self, uuid) -> Optional[<Name>Bean]:
        pass

    @abc.abstractmethod
    def get_all(self) -> List[<Name>Bean]:
        pass

    @abc.abstractmethod
    def update(self, bean: <Name>Bean) -> <Name>Bean:
        pass

    @abc.abstractmethod
    def delete(self, uuid) -> None:
        pass
```

**Validation** : Verifier que l'interface n'importe aucun module ORM.

#### Etape 3 - Service (logique metier)
Creer `backend/app/domain/<module>/services/<name>_service.py`

```python
from app.domain.<module>.interface.<name>_repository import I<Name>Repository
from app.domain.<module>.models.<name>_bean import <Name>Bean
from app.domain.exceptions import NotFoundException, ConflictException, ValidationException

def create_<name>(repository: I<Name>Repository, bean: <Name>Bean) -> <Name>Bean:
    # Validation metier ici
    return repository.create(bean)

def get_<name>_by_uuid(repository: I<Name>Repository, uuid) -> <Name>Bean:
    bean = repository.get_by_uuid(uuid)
    if not bean:
        raise NotFoundException("<NAME>", str(uuid))
    return bean
```

**Validation** : Le service est une collection de fonctions pures. Pas d'import HTTP, pas d'import ORM. Le repository est passe en argument.

#### Etape 4 - Entity (modele Django ORM)
Creer `backend/app/repository/<module>/models/<name>_entity.py`

```python
import uuid
from django.db import models

class <Name>Entity(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    # champs ici
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "<module>_<name>"
        indexes = [
            models.Index(fields=["uuid"], name="<name>_uuid_idx"),
        ]
```

**Validation** : Verifier les contraintes Meta (db_table, indexes, unique_together si besoin). Les FK utilisent `on_delete=models.PROTECT`.

#### Etape 5 - Implementation Repository
Creer `backend/app/repository/<module>/repositories/<name>_repository.py`

```python
from django.db import transaction
from app.domain.<module>.interface.<name>_repository import I<Name>Repository
from app.domain.<module>.models.<name>_bean import <Name>Bean
from app.repository.<module>.models.<name>_entity import <Name>Entity
from app.mapper.<module>.<name>_mapper import (
    <name>_mapper_entity_to_bean,
    <name>_mapper_bean_to_entity,
)

class <Name>Repository(I<Name>Repository):
    @transaction.atomic
    def create(self, bean: <Name>Bean) -> <Name>Bean:
        entity = <name>_mapper_bean_to_entity(bean)
        entity.save()
        return <name>_mapper_entity_to_bean(entity)

    def get_by_uuid(self, uuid):
        try:
            entity = <Name>Entity.objects.select_related().get(uuid=uuid)
            return <name>_mapper_entity_to_bean(entity)
        except <Name>Entity.DoesNotExist:
            return None
```

**Validation** : `@transaction.atomic` sur toutes les ecritures. Utiliser `select_related()` pour les FK.

#### Etape 6 - Mapper
Creer `backend/app/mapper/<module>/<name>_mapper.py`

Quatre fonctions obligatoires :
- `<name>_mapper_entity_to_bean(entity) -> Bean`
- `<name>_mapper_bean_to_entity(bean) -> Entity`
- `<name>_mapper_api_to_bean(data: dict) -> Bean`
- `<name>_mapper_bean_to_api(bean) -> dict`

**Validation** : Verifier que les 4 directions de mapping sont couvertes.

#### Etape 7 - Serializer (validation input uniquement)
Ajouter dans `backend/app/api/<module>/serializers.py`

```python
from rest_framework import serializers

class <Name>Serializer(serializers.Serializer):
    # Champs de validation input (pas de ModelSerializer)
    name = serializers.CharField(max_length=255)
    # ...
```

**Validation** : PAS de `ModelSerializer`. Le serializer ne sert qu'a la validation d'entree.

#### Etape 8 - Controller (ViewSet)
Creer `backend/app/api/<module>/<name>_controller.py`

```python
from rest_framework import viewsets, status
from django.http import JsonResponse
from app.api.<module>.serializers import <Name>Serializer
from app.domain.<module>.services import <name>_service
from app.mapper.<module>.<name>_mapper import <name>_mapper_api_to_bean, <name>_mapper_bean_to_api
from app.repository.<module>.repositories.<name>_repository import <Name>Repository

class <Name>Controller(viewsets.ViewSet):
    lookup_field = "uuid"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.repository = <Name>Repository()

    def list(self, request):
        beans = <name>_service.get_all_<name>s(self.repository)
        data = [<name>_mapper_bean_to_api(b) for b in beans]
        return JsonResponse(data, safe=False)

    def create(self, request):
        serializer = <Name>Serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bean = <name>_mapper_api_to_bean(serializer.validated_data)
        created = <name>_service.create_<name>(self.repository, bean)
        return JsonResponse(<name>_mapper_bean_to_api(created), status=201)

    def retrieve(self, request, uuid=None):
        bean = <name>_service.get_<name>_by_uuid(self.repository, uuid)
        return JsonResponse(<name>_mapper_bean_to_api(bean))
```

**Validation** : Le controller instantie son propre repository dans `__init__`. Retourne `JsonResponse` avec des donnees mappees.

#### Etape 9 - Enregistrement route
Modifier `backend/app/api/urls.py` :

```python
router.register(r"<name>s", <Name>Controller, basename="<name>s")
```

#### Etape 10 - Migration
```bash
cd backend && python manage.py makemigrations
python manage.py migrate --settings=config.settings
```

**Validation** : Verifier que la migration est generee correctement. Pas de migration vide.

#### Etape 11 - Tests backend
Creer `backend/app/tests/unit/<module>/test_<name>_service.py`

```python
import pytest
from unittest.mock import MagicMock
from app.domain.<module>.services import <name>_service
from app.domain.<module>.models.<name>_bean import <Name>Bean

@pytest.mark.unit
class TestCreate<Name>:
    def test_create_<name>_success(self, sample_<name>_bean, mock_<name>_repository):
        mock_<name>_repository.create.return_value = sample_<name>_bean
        result = <name>_service.create_<name>(mock_<name>_repository, sample_<name>_bean)
        assert result == sample_<name>_bean
        mock_<name>_repository.create.assert_called_once()
```

Ajouter les fixtures dans `backend/app/tests/conftest.py`.

**Validation** : Lancer `cd backend && pytest app/tests/unit/<module>/test_<name>_service.py -v -m unit`

### Phase 2 : Frontend (dans cet ordre)

#### Etape 1 - Schema Zod
Creer `frontend/src/entities/<module>/model/<name>.schema.ts`

```typescript
import { z } from "zod";

// Schema brut API (snake_case)
export const <Name>ApiSchema = z.object({
  uuid: z.string().uuid(),
  // champs snake_case
  created_at: z.string(),
  updated_at: z.string(),
});

// Schema domaine (camelCase)
export const <Name>Schema = <Name>ApiSchema.transform((data) => ({
  uuid: data.uuid,
  // transformation snake_case -> camelCase
  createdAt: data.created_at,
  updatedAt: data.updated_at,
}));

export type <Name> = z.infer<typeof <Name>Schema>;
```

#### Etape 2 - Query Keys
Creer `frontend/src/entities/<module>/api/<name>.keys.ts`

```typescript
export const <name>Keys = {
  all: ["<name>s"] as const,
  lists: () => [...<name>Keys.all, "list"] as const,
  details: () => [...<name>Keys.all, "detail"] as const,
  detail: (uuid: string) => [...<name>Keys.details(), uuid] as const,
};
```

#### Etape 3 - Query Hooks (TanStack Query)
Creer `frontend/src/entities/<module>/api/<name>.queries.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/client";
import { <Name>Schema } from "../model/<name>.schema";
import { <name>Keys } from "./<name>.keys";

export function use<Name>s() {
  return useQuery({
    queryKey: <name>Keys.lists(),
    queryFn: ({ signal }) => api.get("/api/v1/<name>s/", z.array(<Name>Schema), signal),
  });
}

export function useCreate<Name>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/api/v1/<name>s/", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: <name>Keys.all }),
  });
}
```

#### Etape 4 - Feature components
Creer `frontend/src/features/<module>/<feature>/ui/<Name>Modal.tsx`

Utiliser les patterns existants : React Hook Form + Zod, MUI `sx` prop, `memo()`, `useCallback`.

#### Etape 5 - Page
Creer ou modifier `frontend/src/pages/<module>/index.tsx`

#### Etape 6 - Route
Enregistrer dans `frontend/src/app/router/index.tsx` avec lazy loading.

**Validation finale** :
```bash
cd frontend && npm run lint && npx tsc --noEmit && npm run test
```

---

## Use Case 2 : Correction de bug avec tests

**Declencheurs** : "fix le bug X", "fix bug X", "ce test echoue", "test fails", "erreur sur Y", "bug dans Z"

### Workflow iteratif

#### Etape 1 - Analyse
1. Identifier le symptome exact (message d'erreur, comportement incorrect)
2. Localiser la couche responsable :
   - **Erreur 4xx/5xx** : commencer par le controller puis remonter
   - **Donnees incorrectes** : verifier le mapper puis le service
   - **Test echoue** : lire le test pour comprendre l'intention, puis le code teste
3. Lire le code concerne et ses tests existants

#### Etape 2 - Identification de la couche
| Symptome | Couche probable | Fichiers a verifier |
|----------|----------------|---------------------|
| Erreur de validation input | Serializer | `app/api/<module>/serializers.py` |
| Regle metier non respectee | Service | `app/domain/<module>/services/` |
| Donnee manquante/incorrecte en DB | Repository/Entity | `app/repository/<module>/` |
| Transformation de donnees | Mapper | `app/mapper/<module>/` |
| Erreur HTTP/routing | Controller/URLs | `app/api/<module>/`, `app/api/urls.py` |
| Erreur d'affichage frontend | Component/Schema | `src/entities/`, `src/features/` |
| Erreur de cache/requete | Query hooks | `src/entities/<module>/api/` |

#### Etape 3 - Ecrire le fix
1. Appliquer le fix en respectant les conventions (voir `references/conventions.md`)
2. Ne pas modifier d'autres fichiers que ceux concernes par le bug
3. Respecter les limites de couche (pas d'ORM dans un service, pas de HTTP dans le domain)

#### Etape 4 - Ajouter/modifier les tests
**Backend** :
```bash
cd backend && pytest app/tests/unit -v -m unit --tb=short
```
- Si le test existant couvrait deja le cas : le corriger
- Sinon : ajouter un test specifique pour le cas de regression

**Frontend** :
```bash
cd frontend && npm run test -- --run
```
- Utiliser `renderWithProviders()` et MSW pour les tests de composants
- Utiliser `renderHook()` + `waitFor()` pour les tests de hooks

#### Etape 5 - Verification
```bash
# Backend
cd backend && pytest app/tests/unit -v -m unit
cd backend && black --check --diff .
cd backend && isort --check-only --diff .
cd backend && flake8 app --max-line-length=120 --exclude=migrations

# Frontend
cd frontend && npm run lint
cd frontend && npx tsc --noEmit
cd frontend && npm run test -- --run
```

#### Etape 6 - Boucle de raffinement
Si les tests echouent encore :
1. Relire le message d'erreur
2. Verifier si le fix a introduit une regression
3. Ajuster et relancer
4. Repeter jusqu'a ce que tous les tests passent ET le lint soit propre

---

## Use Case 3 : Refactoring avec qualite

**Declencheurs** : "refactor X", "ameliore Y", "improve Z", "refactorise", "nettoie le code", "clean up"

### Workflow avec intelligence metier

#### Etape 1 - Audit d'architecture
Avant tout refactoring, verifier ces regles (voir `references/architecture.md`) :

**Backend - Violations a detecter** :
- Import ORM (`django.db`, `models.`) dans un service → INTERDIT
- Import HTTP (`request`, `Response`, `status`) dans le domain → INTERDIT
- Logique metier dans un controller → A DEPLACER vers le service
- Requete ORM dans un service → A DEPLACER vers le repository
- `ModelSerializer` au lieu de `Serializer` → A CORRIGER

**Frontend - Violations a detecter** :
- Import `@features` dans `@entities` → INTERDIT (sens unique)
- Import `@pages` dans `@features` → INTERDIT
- Appel API direct sans `@shared/api/client` → A CORRIGER
- Schema sans validation Zod → A CORRIGER

#### Etape 2 - Plan de refactoring
1. Lister les changements prevus
2. Identifier les fichiers impactes
3. Evaluer le risque de regression
4. Proposer le plan a l'utilisateur avant d'executer

#### Etape 3 - Execution avec conventions
Appliquer les conventions de nommage (voir `references/conventions.md`) :
- `*Bean` pour les DTOs
- `*Entity` pour les modeles ORM
- `*Controller` pour les ViewSets
- `I*Repository` pour les interfaces
- `*Schema` / `*ApiSchema` pour les schemas Zod
- `use*` pour les hooks React

#### Etape 4 - Verification de couverture
```bash
# Backend - seuil 80% unit, 70% integration
cd backend && pytest app/tests/unit -v -m unit --cov=app --cov-report=term-missing --cov-fail-under=80

# Frontend - seuils 80% lines, 75% branches, 85% functions
cd frontend && npm run test:coverage
```

#### Etape 5 - Validation complete
```bash
# Backend
cd backend && black . && isort --profile=black --line-length=120 .
cd backend && flake8 app --max-line-length=120 --exclude=migrations
cd backend && pytest -v

# Frontend
cd frontend && npm run lint
cd frontend && npx tsc --noEmit
cd frontend && npm run test -- --run
cd frontend && npm run build
```

---

## Troubleshooting

### Erreurs Django courantes

**`django.db.utils.IntegrityError: UNIQUE constraint failed`**
- Cause : Tentative d'insertion d'un doublon
- Solution : Verifier le service pour une validation `exists_by_*` avant `create()`

**`django.core.exceptions.FieldError: Cannot resolve keyword`**
- Cause : Nom de champ incorrect dans un queryset
- Solution : Verifier le nom du champ dans l'Entity (pas le Bean)

**`rest_framework.exceptions.ValidationError`**
- Cause : Donnees d'entree invalides
- Solution : Verifier le Serializer et les champs requis

**Migration qui echoue**
- Cause frequente : FK vers une table inexistante ou champ rename
- Solution : `python manage.py showmigrations` pour verifier l'etat, corriger puis `makemigrations`

### Erreurs React/TypeScript courantes

**`ZodError: Expected string, received undefined`**
- Cause : Le backend renvoie un champ null/absent que le schema attend
- Solution : Utiliser `.nullable()` ou `.optional()` dans le schema Zod

**`QueryClient: No QueryClient set`**
- Cause : Composant rendu sans provider
- Solution : Utiliser `renderWithProviders()` dans les tests

**`TypeError: Cannot read properties of undefined`**
- Cause frequente : Donnees pas encore chargees (loading state)
- Solution : Verifier `isLoading` / `data?.field` avant l'acces

**ESLint `@typescript-eslint/no-unused-vars`**
- Cause : Variable importee mais non utilisee apres refactoring
- Solution : Supprimer l'import inutilise, ne pas prefixer par `_` sauf si intentionnel

### Commandes de debug utiles

```bash
# Verifier l'etat des migrations
cd backend && python manage.py showmigrations

# Tester un seul fichier
cd backend && pytest app/tests/unit/campaign/test_campaign_service.py -v -m unit
cd frontend && npm run test -- --run src/entities/campaign

# Verifier les types sans build
cd frontend && npx tsc --noEmit

# Formater avant commit
cd backend && black . && isort --profile=black --line-length=120 .
cd frontend && npx eslint --fix src/
```

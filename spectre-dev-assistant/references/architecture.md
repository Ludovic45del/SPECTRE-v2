# Architecture SPECTRE - Regles et Contraintes

## Backend - Clean Architecture

### Diagramme des couches

```
API Controllers  -->  Domain Services  -->  Repository Interfaces
  (app/api/)         (app/domain/*/       (app/domain/*/
                      services/)           interface/)
       |                    |                     |
  Serializers          Beans (DTOs)         Repository Impls
  (validation)     (app/domain/*/          (app/repository/*/
                    models/)                repositories/)
       |                    |                     |
       +--------  Mappers  -+-----  ORM Entities  +
                (app/mapper/)       (app/repository/*/
                                     models/)
```

### Regles de dependance strictes

| Couche | Peut importer | NE PEUT PAS importer |
|--------|--------------|----------------------|
| Controller (`app/api/`) | Service, Mapper, Repository, Serializer | Entity directement |
| Service (`app/domain/*/services/`) | Interface Repository, Bean, Exceptions | Django ORM, HTTP, Serializer |
| Bean (`app/domain/*/models/`) | stdlib Python uniquement | Tout framework |
| Interface (`app/domain/*/interface/`) | Bean | Django ORM |
| Repository (`app/repository/*/repositories/`) | Interface, Bean, Entity, Mapper | Service, Controller |
| Mapper (`app/mapper/`) | Bean, Entity | Service, Controller |
| Entity (`app/repository/*/models/`) | Django models | Service, Bean |
| Serializer (`app/api/*/serializers.py`) | DRF serializers | Service, Entity |

### Flux de donnees

**Creation (POST)** :
```
Request JSON
  → Controller.create()
    → Serializer.is_valid()          (validation input)
    → mapper_api_to_bean(data)       (dict → Bean)
    → service.create(repo, bean)     (logique metier)
      → repo.create(bean)            (persistence)
        → mapper_bean_to_entity()    (Bean → Entity)
        → entity.save()
        → mapper_entity_to_bean()    (Entity → Bean)
    → mapper_bean_to_api(bean)       (Bean → dict)
  → JsonResponse(data)
```

**Lecture (GET)** :
```
Request
  → Controller.retrieve(uuid)
    → service.get_by_uuid(repo, uuid)
      → repo.get_by_uuid(uuid)
        → Entity.objects.get(uuid=uuid)
        → mapper_entity_to_bean()
      → (validation metier si besoin)
    → mapper_bean_to_api(bean)
  → JsonResponse(data)
```

### Modules metier

| Module | Description | Entites principales |
|--------|-------------|---------------------|
| `campaign` | Gestion des campagnes industrielles | Campaign, CampaignTeams, CampaignDocuments |
| `fsec` | Composants d'evaluation structurelle | Fsec, FsecTeams, FsecDocuments |
| `fa` | Analyses de defaillance | Fa |
| `steps` | Etapes de processus (assemblage, metrologie, etc.) | Assembly, Metrology, Sealing, Pictures, Gas steps... |
| `planning` | Planning et ordonnancement labo | PlanningCampaignStep, LabEvent, MemberPeriod |
| `embase` | Gestion des embases | Embase, Etalonnage |
| `dashboard` | Tableau de bord aggrege | (lecture seule) |

### Gestion des erreurs

Les exceptions metier sont definies dans `app/domain/exceptions.py` :

```python
class DomainException(Exception): ...
class NotFoundException(DomainException):     # → 404
class ConflictException(DomainException):     # → 409
class ValidationException(DomainException):   # → 400
class InvalidDataException(DomainException):  # → 400
```

Le `ErrorHandlerMiddleware` (`app/core/middleware.py`) intercepte toutes les `DomainException` et les convertit en reponse JSON :

```json
{
  "error": "Campaign not found",
  "type": "NotFoundException",
  "code": "CAMPAIGN_NOT_FOUND",
  "status": 404
}
```

---

## Frontend - Feature-Sliced Design (FSD)

### Couches et aliases

| Alias | Path | Responsabilite | Peut importer |
|-------|------|---------------|---------------|
| `@app` | `src/app` | Config, providers, router | Tout |
| `@pages` | `src/pages` | Pages route-level | @features, @entities, @widgets, @shared |
| `@features` | `src/features` | Logique metier (forms, modals) | @entities, @widgets, @shared |
| `@entities` | `src/entities` | Modeles, API hooks, schemas | @shared uniquement |
| `@widgets` | `src/widgets` | Composants UI reutilisables | @shared uniquement |
| `@shared` | `src/shared` | Client API, theme, utils | Rien d'autre |

### Regle de dependance FSD

**Les imports ne vont que vers le bas** :
```
@app → @pages → @features → @entities → @shared
                                ↓
                            @widgets → @shared
```

Toute violation de cette regle est un bug d'architecture.

### Client API

Le client API (`@shared/api/client.ts`) :
- Injecte automatiquement le JWT
- Rafraichit le token sur 401
- Valide les reponses avec Zod
- Pattern : `api.get(url, schema, signal)`

### State Management

| Type | Technologie | Localisation |
|------|------------|--------------|
| Server state | TanStack React Query | `@entities/*/api/*.queries.ts` |
| Client state | Zustand | `@features/*/model/*.store.ts` |
| Form state | React Hook Form + Zod | Dans les composants feature |

### Routing

- React Router v6 avec lazy loading
- Routes protegees via wrapper d'auth
- Enregistrement dans `src/app/router/index.tsx`

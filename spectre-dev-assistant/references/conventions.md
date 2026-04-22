# Conventions de code SPECTRE

## Backend (Python)

### Formatage

| Outil | Config |
|-------|--------|
| Black | line-length=120 |
| isort | profile=black, line-length=120 |
| Flake8 | max-line-length=120, exclude=migrations |

### Commandes de formatage

```bash
cd backend
black .
isort --profile=black --line-length=120 .
flake8 app --max-line-length=120 --exclude=migrations
```

### Nommage

| Element | Convention | Exemple |
|---------|-----------|---------|
| Bean (DTO) | PascalCase + `Bean` | `CampaignBean` |
| Entity (ORM) | PascalCase + `Entity` | `CampaignEntity` |
| Repository interface | `I` + PascalCase + `Repository` | `ICampaignRepository` |
| Repository impl | PascalCase + `Repository` | `CampaignRepository` |
| Service functions | snake_case, verbe_nom | `create_campaign()`, `get_campaign_by_uuid()` |
| Controller | PascalCase + `Controller` | `CampaignController` |
| Serializer | PascalCase + `Serializer` | `CampaignSerializer` |
| Mapper functions | `<module>_mapper_<direction>` | `campaign_mapper_entity_to_bean()` |
| Fichiers | snake_case | `campaign_bean.py`, `campaign_service.py` |
| Dossiers | snake_case | `campaign/`, `models/` |

### Patterns de code

**Bean** :
```python
@dataclass
class XxxBean:
    id: Optional[int] = None
    uuid: Optional[uuid_lib.UUID] = None
    # champs...
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
```

**Service** :
```python
# Fonctions pures, repository en premier argument
def create_xxx(repository: IXxxRepository, bean: XxxBean) -> XxxBean:
    _validate_xxx(bean)
    return repository.create(bean)

# Validation privee
def _validate_xxx(bean: XxxBean) -> None:
    if not bean.name:
        raise ValidationException("name", "Le nom est requis")
```

**Entity** :
```python
class XxxEntity(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    # FK : on_delete=models.PROTECT, db_column explicite
    campaign = models.ForeignKey(
        CampaignEntity, on_delete=models.PROTECT,
        db_column="campaign_id", related_name="xxx_set"
    )

    class Meta:
        db_table = "module_xxx"
        indexes = [models.Index(fields=["uuid"], name="xxx_uuid_idx")]
```

**Controller** :
```python
class XxxController(viewsets.ViewSet):
    lookup_field = "uuid"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.repository = XxxRepository()
```

**Repository** :
```python
class XxxRepository(IXxxRepository):
    @transaction.atomic
    def create(self, bean: XxxBean) -> XxxBean:
        entity = xxx_mapper_bean_to_entity(bean)
        entity.save()
        return xxx_mapper_entity_to_bean(entity)
```

### Tests backend

**Structure** :
```
app/tests/
├── conftest.py          # Fixtures partagees (beans, mock repos)
├── unit/                # @pytest.mark.unit - pas de DB
│   ├── campaign/
│   ├── fsec/
│   └── ...
├── integration/         # @pytest.mark.integration - DB reelle
└── service/             # @pytest.mark.service - workflows
```

**Pattern de test unitaire** :
```python
@pytest.mark.unit
class TestCreateXxx:
    def test_create_success(self, sample_xxx_bean, mock_xxx_repository):
        mock_xxx_repository.create.return_value = sample_xxx_bean
        result = xxx_service.create_xxx(mock_xxx_repository, sample_xxx_bean)
        assert result == sample_xxx_bean
        mock_xxx_repository.create.assert_called_once()

    def test_create_conflict(self, sample_xxx_bean, mock_xxx_repository):
        mock_xxx_repository.exists_by_name.return_value = True
        with pytest.raises(ConflictException):
            xxx_service.create_xxx(mock_xxx_repository, sample_xxx_bean)
```

**Seuils de couverture** :
- Unit : 80%
- Integration : 70%

---

## Frontend (TypeScript)

### Formatage

| Outil | Config |
|-------|--------|
| ESLint | TypeScript + React plugins |
| TypeScript | strict mode (noUnusedLocals, noUnusedParameters) |

### Commandes

```bash
cd frontend
npm run lint          # ESLint
npx tsc --noEmit      # Type check
npm run test -- --run  # Vitest one-shot
npm run test:coverage  # Avec couverture
```

### Nommage

| Element | Convention | Exemple |
|---------|-----------|---------|
| Composants (.tsx) | PascalCase | `CampaignOverviewPage.tsx` |
| Hooks/utils (.ts) | camelCase | `useCampaignTeamForm.ts` |
| Schemas Zod | PascalCase + `Schema` | `CampaignSchema`, `CampaignApiSchema` |
| Query keys | camelCase + `Keys` | `campaignKeys` |
| Query hooks | `use` + PascalCase | `useCampaigns()`, `useCreateCampaign()` |
| Stores Zustand | `use` + PascalCase + `Store` | `useCreateCampaignStore()` |
| Types inferred | PascalCase | `type Campaign = z.infer<typeof CampaignSchema>` |
| Fichiers schema | kebab-case | `campaign.schema.ts` |
| Fichiers queries | kebab-case | `campaign.queries.ts` |

### Patterns de code

**Schema Zod** (transformation snake_case -> camelCase) :
```typescript
export const XxxApiSchema = z.object({
  uuid: z.string().uuid(),
  field_name: z.string(),        // snake_case du backend
  created_at: z.string(),
});

export const XxxSchema = XxxApiSchema.transform((d) => ({
  uuid: d.uuid,
  fieldName: d.field_name,       // camelCase pour le frontend
  createdAt: d.created_at,
}));

export type Xxx = z.infer<typeof XxxSchema>;
```

**Query Keys** (hierarchie pour invalidation) :
```typescript
export const xxxKeys = {
  all: ["xxxs"] as const,
  lists: () => [...xxxKeys.all, "list"] as const,
  details: () => [...xxxKeys.all, "detail"] as const,
  detail: (uuid: string) => [...xxxKeys.details(), uuid] as const,
};
```

**Query Hooks** :
```typescript
export function useXxxs() {
  return useQuery({
    queryKey: xxxKeys.lists(),
    queryFn: ({ signal }) => api.get("/api/v1/xxxs/", z.array(XxxSchema), signal),
  });
}

export function useCreateXxx() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: XxxCreate) => api.post("/api/v1/xxxs/", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: xxxKeys.all }),
  });
}
```

**Composant avec memo** :
```typescript
export const XxxModal = memo(function XxxModal({ open, onClose }: Props) {
  const handleSubmit = useCallback((data: FormData) => {
    // ...
  }, []);

  return (
    <Dialog open={open} onClose={onClose}>
      {/* MUI sx prop pour le style */}
      <Box sx={{ p: 2 }}>...</Box>
    </Dialog>
  );
});
```

### Tests frontend

**Test de composant** :
```typescript
import { renderWithProviders, setup } from "@test/utils";
import { server } from "@test/mocks/server";
import { http, HttpResponse } from "msw";

describe("XxxModal", () => {
  it("should create xxx successfully", async () => {
    const { user } = setup(<XxxModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Nom"), "Test");
    await user.click(screen.getByRole("button", { name: /creer/i }));

    await waitFor(() => {
      expect(screen.getByText("Succes")).toBeInTheDocument();
    });
  });
});
```

**Test de hook** :
```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@test/utils";

describe("useXxxs", () => {
  it("should fetch xxxs", async () => {
    const { result } = renderHook(() => useXxxs(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });
});
```

**Seuils de couverture** :
- Lines : 80%
- Branches : 75%
- Functions : 85%

---

## API Endpoints

Base URL : `/api/v1/`

Pattern d'enregistrement :
```python
# backend/app/api/urls.py
router = DefaultRouter()
router.register(r"campaigns", CampaignController, basename="campaigns")
router.register(r"fsecs", FsecController, basename="fsecs")
# etc.
```

Toutes les entites utilisent des UUID pour les lookups REST :
- `GET /api/v1/xxxs/` - liste
- `GET /api/v1/xxxs/<uuid>/` - detail
- `POST /api/v1/xxxs/` - creation
- `PUT /api/v1/xxxs/<uuid>/` - mise a jour complete
- `PATCH /api/v1/xxxs/<uuid>/` - mise a jour partielle
- `DELETE /api/v1/xxxs/<uuid>/` - suppression

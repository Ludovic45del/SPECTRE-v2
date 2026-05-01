# Cahier des charges — Module Stock SPECTRE

> Document destiné à Claude Code (ou tout développeur) pour implémenter de bout en bout le module Stock dans l'application SPECTRE existante (Django + DRF backend, React frontend).
>
> Ce document est autonome : toutes les règles métier, le modèle de données, les endpoints, les comportements UI et les cas limites sont spécifiés. Aucune question ne devrait rester ouverte pour l'implémentation.

---

## 1. Objectif

Ajouter un module **Stock** permettant :

1. De **cataloguer** tous les éléments physiques utilisés au laboratoire :
   - **Éléments sérialisés** (instances uniques) : cibles, plaques, cônes, structurations, etc.
   - **Consommables** (quantifiés) : colles, visserie, produits chimiques, etc.
2. De **tracer** les mouvements de stock (entrées/sorties) via un historique manuel.
3. D'**associer** des éléments (sérialisés ou consommables) à une FSEC via un **tableau récapitulatif** présent dans la section Assemblage de chaque FSEC.
4. D'**alerter** visuellement sur les stocks faibles et les produits périmés.

Le module est **indépendant** dans la navigation (menu principal), avec ses propres sous-rubriques.

---

## 2. Architecture cible (rappel patterns existants)

Le module DOIT suivre strictement les patterns déjà en place dans SPECTRE. Pour chaque domaine :

```
Controller (DRF ViewSet)
    → Service (logique métier pure)
        → Repository (accès données, implémente une Interface abstraite)
            → Entity (Django Model)
Mapper (Entity ↔ Bean ↔ API dict) pour les conversions
Serializer (DRF, validation input)
```

Références à lire AVANT de coder :
- `backend/app/api/campaign/campaign_controller.py` (pattern Controller)
- `backend/app/domain/campaign/services/campaign_service.py` (pattern Service)
- `backend/app/repository/campaign/repositories/campaign_repository.py` (pattern Repository)
- `backend/app/repository/shared/base_child_repository.py` (pattern générique)
- `backend/app/domain/exceptions.py` (exceptions métier)

**Respecter aussi :**
- Tous les PK en `UUIDField(default=uuid.uuid4)`.
- Tables en SNAKE_CASE MAJUSCULES (`STOCK_CATALOG_ITEM`).
- Relations en `models.PROTECT` par défaut (pas CASCADE sauf intention explicite).
- Soft-delete via `is_active` là où c'est nécessaire (jamais de vraie suppression sur un item référencé).
- Audit trail : `created_at` (auto_now_add) et `updated_at` (auto_now) partout.
- Middleware d'erreur existant (`ErrorHandlerMiddleware`) : les services lèvent des `DomainException`, le middleware fait le mapping HTTP.
- Permissions actuelles : période de dev → utiliser `IsReadOnlyOrOperateur` sur toutes les routes (GET ouvert à tous, écritures pour operateur+admin). À durcir plus tard.

---

## 3. Modèle de données

### 3.1 Entité `StockCatalogItem` — table `STOCK_CATALOG_ITEM`

Le catalogue unique contenant TOUS les items (sérialisés + consommables). Un champ `kind` distingue les deux types.

| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `uuid` | UUIDField | PK, auto | Identifiant unique |
| `kind` | CharField(20) | choices=`['element','consumable']`, **requis** | `element` = sérialisé (instance unique), `consumable` = quantifié |
| `category` | CharField(50) | choices=`['pieces_elementaires','structuration','structuration_speciale','structuration_ec','colles','autres']`, **requis** | Rubrique métier (enum strict, cf. §4.6 pour le mapping kind↔rubriques) |
| `name` | CharField(200) | **requis** | Nom d'affichage de l'item |
| `reference` | CharField(200) | nullable/blank | Référence fournisseur ou numéro interne (ex. `2024_LMJ_Gorfou-1`, `N°521`) |
| `caracteristique` | CharField(200) | nullable/blank | Ex. `PEEK` |
| `type_de_colle` | CharField(100) | nullable/blank | Ex. `UV`, `3090` (utilisé surtout pour `category='Colle'` ou pour retrouver la colle d'un assemblage) |
| `fournisseur` | CharField(100) | nullable/blank | Ex. `LIE`, `DTRI` |
| `remarques` | TextField(4000) | nullable/blank | Notes libres |
| **Champs consumable uniquement** | | | (tous nullables quand kind=`element`) |
| `unite` | CharField(50) | nullable/blank | Texte libre : `g`, `ml`, `tube`, `unité`… |
| `quantite` | IntegerField | nullable, default=0 | Stock courant (mis à jour automatiquement par les StockMovement) |
| `seuil_alerte` | IntegerField | nullable | Si `quantite <= seuil_alerte` → alerte visuelle |
| `date_peremption` | DateField | nullable | Alerte si dépassée ou approche (seuil 30j côté UI, non configurable en v1) |
| `type_d_achat` | CharField(100) | nullable/blank | Texte libre (cf. Excel template) |
| **Champs element uniquement** | | | (tous nullables quand kind=`consumable`) |
| `installation` | CharField(10) | nullable, choices=`['LMJ','OMEGA']` | Installation cible pour les éléments |
| `status` | CharField(20) | nullable, choices=`['dispo','reservee','affectee','tiree']`, default=`'dispo'` | Cycle de vie d'un élément sérialisé |
| `materiaux_mat` | CharField(200) | nullable/blank | Matériau de la structuration (visible/pertinent uniquement quand `category='structuration_speciale'`) |
| **Placement physique** | | | |
| `boite` | CharField(200) | nullable/blank | `numero_de_boite_ou_descriptif_boite` |
| `emplacement` | CharField(200) | nullable/blank | Emplacement physique |
| **Metadata** | | | |
| `is_active` | BooleanField | default=True | Soft-delete |
| `created_at` | DateTimeField | auto_now_add | |
| `updated_at` | DateTimeField | auto_now | |

**Index :**
```python
indexes = [
    models.Index(fields=['kind'], name='stock_item_kind_idx'),
    models.Index(fields=['category'], name='stock_item_category_idx'),
    models.Index(fields=['status'], name='stock_item_status_idx'),
    models.Index(fields=['is_active'], name='stock_item_active_idx'),
    models.Index(fields=['date_peremption'], name='stock_item_perem_idx'),
]
```

**Validations métier (à faire dans le service) :**
- **Cohérence kind ↔ rubrique** (cf. §4.6) :
  - Si `kind='element'` : `category ∈ {pieces_elementaires, structuration, structuration_speciale, structuration_ec}`.
  - Si `kind='consumable'` : `category ∈ {colles, autres}`.
  - Toute autre combinaison → `ValidationException` (code: `INVALID_KIND_CATEGORY`).
- Si `kind='element'` : `status` requis, `installation` requis, `quantite` et `unite` et `seuil_alerte` et `date_peremption` et `type_d_achat` doivent être null.
- Si `kind='consumable'` : `status` doit être null, `installation` doit être null, `materiaux_mat` doit être null, `unite` requis, `quantite` requis (peut être 0).
- `materiaux_mat` n'est cohérent qu'avec `category='structuration_speciale'` (sinon doit être null) — soft check (warning, pas bloquant) côté service.
- `name` + `reference` doivent être uniques ensemble pour un `kind` donné (pour éviter les doublons) → contrainte à vérifier dans le service, pas via DB (référence peut être nulle).

### 3.2 Entité `StockMovement` — table `STOCK_MOVEMENT`

Historique manuel des entrées/sorties. Exclusivement pour les consommables en v1 (les éléments sérialisés ont leur historique implicite via `status`).

| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `uuid` | UUIDField | PK, auto | |
| `catalog_item` | FK vers StockCatalogItem | PROTECT, required, `db_column='catalog_item_uuid'`, `related_name='movements'` | Item concerné |
| `movement_type` | CharField(20) | choices=`['entree','sortie','ajustement']`, required | Type de mouvement |
| `quantite_delta` | IntegerField | required, != 0 | Positif pour `entree`, négatif pour `sortie`, signé libre pour `ajustement` |
| `quantite_apres` | IntegerField | required | Snapshot du stock après mouvement (redondant mais utile pour audit) |
| `date` | DateField | required | Date du mouvement |
| `remarque` | TextField(1000) | nullable/blank | |
| `auteur_name` | CharField(100) | nullable/blank | Nom libre (pas de FK user en v1 pour rester simple — à durcir plus tard) |
| `created_at` | DateTimeField | auto_now_add | |

**Index :**
```python
indexes = [
    models.Index(fields=['catalog_item', '-date'], name='stock_mvmt_item_date_idx'),
    models.Index(fields=['movement_type'], name='stock_mvmt_type_idx'),
]
```

**Règles métier :**
- N'est créable QUE pour `catalog_item.kind='consumable'`. Lever `ValidationException` sinon.
- Le service doit mettre à jour `catalog_item.quantite` de manière atomique (`transaction.atomic` + `select_for_update`) lors de la création d'un mouvement.
- `quantite_apres` est calculé côté serveur, jamais reçu du client.
- Un mouvement est **non-modifiable** après création (pas de PATCH). Pour corriger : créer un mouvement d'ajustement. DELETE réservé admin, et doit recalculer `quantite` (à implémenter proprement).

### 3.3 Entité `FsecAssemblyItem` — table `FSEC_ASSEMBLY_ITEM`

Ligne du tableau récap d'une FSEC. Lien stock ↔ FSEC **au niveau `fsec_uuid`** (partagé entre versions).

⚠️ **Attention** : le modèle FSEC utilise `version_uuid` comme PK, et `fsec_uuid` comme colonne logique partagée entre versions. Ici on référence `fsec_uuid` sans FK directe (car plusieurs lignes FSEC partagent ce même UUID). On stocke `fsec_uuid` comme `UUIDField` simple et on gère l'intégrité applicative.

| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `uuid` | UUIDField | PK, auto | |
| `fsec_uuid` | UUIDField | **required**, indexed | FSEC "logique" (partagée entre versions) |
| `catalog_item` | FK vers StockCatalogItem | PROTECT, required, `db_column='catalog_item_uuid'`, `related_name='fsec_assembly_items'` | Item utilisé |
| `sort_order` | IntegerField | default=0 | Ordre d'affichage dans le tableau |
| `remarque` | TextField(1000) | nullable/blank | Commentaire libre spécifique à cette utilisation |
| `created_at` | DateTimeField | auto_now_add | |
| `updated_at` | DateTimeField | auto_now | |

**Index :**
```python
indexes = [
    models.Index(fields=['fsec_uuid'], name='fsec_asm_item_fsec_idx'),
    models.Index(fields=['catalog_item'], name='fsec_asm_item_catalog_idx'),
]
```

**Règles métier CRITIQUES :**
- **Unicité** : pour un `catalog_item` de `kind='element'`, il ne peut y avoir **qu'UNE seule ligne** `FsecAssemblyItem` dans toute la base (un élément sérialisé ne peut être utilisé qu'une fois, sur une seule FSEC). À enforcer via `UniqueConstraint` conditionnelle ou vérification service.
- Pour un `catalog_item` de `kind='consumable'`, **pas de limite** (plusieurs FSEC peuvent utiliser la même colle).
- Pour une même `(fsec_uuid, catalog_item)`, pas de duplicata → `UniqueConstraint(fields=['fsec_uuid','catalog_item'])`.

---

## 4. Logique métier

### 4.1 Cycle de vie d'un élément sérialisé

**États :** `dispo → reservee → affectee → tiree`

**Transitions autorisées (permissif avant tir, figé après) :**

```
dispo     ⇄ reservee
reservee  ⇄ affectee
affectee  → tiree          (unidirectionnel)
tiree     → (rien, terminus)
```

Depuis n'importe quel état avant `tiree`, on peut revenir à `dispo` (libération manuelle).

### 4.2 Couplage automatique statut FSEC ↔ statut élément

Quand on modifie le tableau récap d'une FSEC OU quand la FSEC change de statut, appliquer :

| Action | Effet sur élément |
|---|---|
| **Ajout d'un élément** au tableau récap (peu importe le statut FSEC) | L'élément passe automatiquement `dispo → reservee`. Si déjà `reservee/affectee/tiree` sur **la même FSEC** → rien à faire. Si déjà réservé sur une **autre** FSEC → `ConflictException`. |
| **Suppression d'un élément** du tableau récap | Si `status != tiree` : élément repasse `→ dispo`. Si `status == tiree` : refuser la suppression (`ValidationException`), car le tableau est verrouillé. |
| **FSEC passe au statut "En cours d'assemblage"** (id=1 dans `fsec_status.csv`) | Tous les éléments associés à cette FSEC en `reservee` passent `→ affectee`. |
| **FSEC passe au statut "Tirée"** (id=7) | Tous les éléments associés à cette FSEC en `affectee` (ou `reservee`) passent `→ tiree`. Le tableau devient immuable. |
| **FSEC repasse en arrière** (ex. de "Tirée" à autre chose — si c'est possible dans ta logique) | **Pas géré en v1**. Le statut `tiree` est irréversible. Si tu veux l'autoriser plus tard, le service doit gérer la rétropropagation. |

**Implémentation :**
- Créer un service `sync_element_statuses_for_fsec(fsec_uuid, new_fsec_status_id)` appelé dans `patch_fsec` / `update_fsec` du service FSEC existant.
- Créer des helpers `reserve_element(catalog_item_uuid, fsec_uuid)` et `release_element(catalog_item_uuid, fsec_uuid)` dans le service Stock.

### 4.3 Verrouillage du tableau récap

Quand la FSEC est au statut **"Tirée" (id=7)**, toutes les routes de modification du tableau récap (POST/PATCH/DELETE sur `FsecAssemblyItem`) retournent `409 Conflict` avec le code `FSEC_LOCKED`. Seul le GET reste ouvert.

L'UI doit aussi désactiver visuellement les contrôles (mais la vraie sécurité est côté backend).

### 4.4 Versioning FSEC

- Le tableau récap est partagé entre toutes les versions d'une même FSEC via `fsec_uuid`.
- Quand on crée une nouvelle version (`create_new_version` dans `fsec_service.py`), **aucune copie n'est faite** : la nouvelle version voit automatiquement le même tableau.
- Quand on consulte le tableau depuis v1 ou v2, on affiche le même contenu, modifiable des deux côtés (tant que la FSEC n'est pas tirée).

### 4.5 Alertes visuelles (côté frontend)

- **Stock bas** : `kind='consumable'` AND `seuil_alerte IS NOT NULL` AND `quantite <= seuil_alerte` → badge orange/rouge dans le catalogue et tableau de bord.
- **Périmé** : `date_peremption <= today` → badge rouge.
- **Péremption proche** : `date_peremption <= today + 30 jours` → badge orange.

Ces calculs se font côté frontend à partir de `quantite`, `seuil_alerte`, `date_peremption` retournés par l'API. Pas d'endpoint spécifique — un filtre côté client sur la liste du catalogue suffit pour la v1.

### 4.6 Rubriques (enum)

`category` est un **enum strict de 6 valeurs**, groupées par `kind`. C'est l'unique source de vérité côté backend ET frontend (pas de saisie libre, pas d'endpoint dynamique).

| Code (stocké) | Libellé UI | Kind |
|---|---|---|
| `pieces_elementaires` | Pièces élémentaires | `element` |
| `structuration` | Structuration | `element` |
| `structuration_speciale` | Structuration spéciale | `element` |
| `structuration_ec` | Structuration EC | `element` |
| `colles` | Colles | `consumable` |
| `autres` | Autres | `consumable` |

→ 4 rubriques élément + 2 rubriques consommable.

**Comportement frontend :**
- Le dropdown "Rubrique" du formulaire de création/édition est filtré selon le `kind` choisi à l'étape 1 du formulaire (modal de choix kind → modal de saisie). Aucune rubrique cross-kind n'est sélectionnable.
- Le filtre "Rubrique" de la barre d'outils du catalogue affiche les 6 valeurs groupées visuellement par kind (cf. maquette HTML).

**Comportement backend :**
- Le service vérifie la cohérence `kind` ↔ `category` à chaque création/édition. Toute combinaison invalide → `ValidationException` avec code `INVALID_KIND_CATEGORY` (cf. §5.5).
- Pas d'endpoint dynamique `/categories/` : les valeurs sont figées dans le code (constante `CATEGORY_BY_KIND` dans `stock_constants.py`).

⚠️ **Pas d'ajout dynamique en v1.** Si une 7e rubrique devient nécessaire, c'est une migration backend (ajout de la valeur aux choices, mise à jour du mapping kind↔rubrique, regen du frontend).

---

## 5. API REST

Toutes les routes sont préfixées `/api/v1/stock/`. Authentification JWT requise (via middleware existant).

### 5.1 Catalogue

```
GET    /api/v1/stock/catalog/
         ?kind=element|consumable
         ?category=pieces_elementaires|structuration|structuration_speciale|structuration_ec|colles|autres
         ?status=dispo|reservee|affectee|tiree
         ?installation=LMJ|OMEGA
         ?is_active=true|false  (default: true)
         ?page=<int>&page_size=<int>
       → Liste paginée (pattern PaginatedControllerMixin existant)

GET    /api/v1/stock/catalog/:uuid/
       → Détail d'un item

POST   /api/v1/stock/catalog/
       → Création. Body = StockCatalogItemSerializer. Valide kind/champs cohérents
         et la cohérence kind↔category (cf. §4.6).

PUT    /api/v1/stock/catalog/:uuid/
       → Remplacement complet.

PATCH  /api/v1/stock/catalog/:uuid/
       → Mise à jour partielle. Interdit de modifier `kind` après création.
         Modifier `category` est autorisé tant que la cohérence kind↔category est respectée.

DELETE /api/v1/stock/catalog/:uuid/
       → Soft-delete (is_active=False). Refusé si référencé dans un FsecAssemblyItem
         (ValidationException). Admin uniquement (IsReadOnlyOrAdmin).
```

### 5.2 Mouvements

```
GET    /api/v1/stock/movements/
         ?catalog_item_uuid=<uuid>
         ?movement_type=entree|sortie|ajustement
         ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
         ?page=<int>
       → Liste paginée, triée par date desc puis created_at desc.

GET    /api/v1/stock/movements/:uuid/
       → Détail.

POST   /api/v1/stock/movements/
       → Création. Refusé si catalog_item.kind != 'consumable'.
         Met à jour atomiquement catalog_item.quantite.
         Calcule quantite_apres côté serveur.

DELETE /api/v1/stock/movements/:uuid/
       → Admin uniquement. Recalcule catalog_item.quantite.
```

Pas de PUT/PATCH sur les mouvements (immuables après création).

### 5.3 Tableau récap FSEC

```
GET    /api/v1/fsec-assembly-items/fsec/:fsec_uuid/
       → Liste des items du tableau récap d'une FSEC, triés par sort_order puis created_at.
         Chaque item retourné inclut les données du catalog_item (nom, référence, fournisseur, etc.)
         pour éviter un N+1 côté frontend.

POST   /api/v1/fsec-assembly-items/
       Body: { fsec_uuid, catalog_item_uuid, sort_order?, remarque? }
       → Ajoute une ligne. Déclenche la réservation automatique de l'élément si kind='element'.
         Refusé si FSEC au statut "Tirée" (code: FSEC_LOCKED).
         Refusé si catalog_item kind=element déjà réservé/utilisé ailleurs (code: ELEMENT_ALREADY_USED).

PATCH  /api/v1/fsec-assembly-items/:uuid/
       Body: { sort_order?, remarque? }
       → Modifier l'ordre ou la remarque uniquement. Pas de changement de catalog_item (pour changer,
         supprimer + recréer). Refusé si FSEC verrouillée.

DELETE /api/v1/fsec-assembly-items/:uuid/
       → Supprime. Si catalog_item.kind='element' et status != tiree, libère l'élément (→ dispo).
         Refusé si FSEC verrouillée.
```

### 5.4 Routes utilitaires

```
GET    /api/v1/stock/catalog/available-for-fsec/:fsec_uuid/
         ?kind=element|consumable
         ?category=<string>
       → Liste des items ASSIGNABLES à cette FSEC :
         - consumables : tous les actifs
         - elements : status=dispo OU déjà réservé pour cette même FSEC
       Utilisé pour peupler le dropdown "Éléments" du tableau récap.

GET    /api/v1/stock/alerts/
       → Retourne 3 arrays :
         {
           "low_stock": [...],          // consommables sous seuil
           "expired": [...],            // consommables date_peremption <= today
           "expiring_soon": [...]       // consommables date_peremption <= today + 30j
         }
       Utilisé pour un widget dashboard et un onglet "Alertes".
```

### 5.5 Codes d'erreur spécifiques

À ajouter dans `ErrorHandlerMiddleware._enrich_error_code` :

- `FSEC_LOCKED` : tentative de modifier un tableau récap d'une FSEC Tirée
- `ELEMENT_ALREADY_USED` : tentative de réserver un élément déjà réservé ailleurs
- `INVALID_KIND_OPERATION` : ex. mouvement sur un item `kind='element'`
- `INVALID_KIND_CATEGORY` : tentative de créer/éditer un item avec une rubrique incohérente avec son kind (ex. `kind=consumable` + `category=structuration`) — cf. §4.6
- `CATALOG_ITEM_IN_USE` : tentative de supprimer un item référencé par un FsecAssemblyItem

---

## 6. Structure des fichiers (arborescence à créer)

```
backend/app/
├── api/
│   ├── stock/
│   │   ├── __init__.py
│   │   ├── catalog_controller.py
│   │   ├── movement_controller.py
│   │   ├── fsec_assembly_controller.py
│   │   ├── alert_controller.py
│   │   └── serializers.py
│   └── urls.py  (ajouter les routes stock)
│
├── domain/
│   └── stock/
│       ├── __init__.py
│       ├── interface/
│       │   ├── __init__.py
│       │   ├── catalog_repository.py         (IStockCatalogRepository)
│       │   ├── movement_repository.py        (IStockMovementRepository)
│       │   └── fsec_assembly_repository.py   (IFsecAssemblyItemRepository)
│       ├── models/
│       │   ├── __init__.py
│       │   ├── stock_catalog_bean.py
│       │   ├── stock_movement_bean.py
│       │   ├── fsec_assembly_item_bean.py
│       │   └── stock_constants.py            (ITEM_KINDS, ELEMENT_STATUSES, MOVEMENT_TYPES, etc.)
│       └── services/
│           ├── __init__.py
│           ├── catalog_service.py
│           ├── movement_service.py
│           ├── fsec_assembly_service.py
│           ├── element_lifecycle_service.py  (reserve/release/sync_with_fsec_status)
│           └── alert_service.py
│
├── mapper/
│   └── stock/
│       ├── __init__.py
│       ├── catalog_mapper.py
│       ├── movement_mapper.py
│       └── fsec_assembly_mapper.py
│
└── repository/
    └── stock/
        ├── __init__.py
        ├── models/
        │   ├── __init__.py
        │   ├── stock_catalog_entity.py
        │   ├── stock_movement_entity.py
        │   └── fsec_assembly_item_entity.py
        └── repositories/
            ├── __init__.py
            ├── stock_catalog_repository.py
            ├── stock_movement_repository.py
            └── fsec_assembly_item_repository.py
```

**Frontend** (à adapter à ton arborescence React existante — à explorer) :

```
frontend/src/
├── pages/
│   └── Stock/
│       ├── StockPage.tsx              (layout avec onglets)
│       ├── CatalogTab.tsx             (tableau + filtres + CRUD)
│       ├── MovementsTab.tsx           (historique + formulaire création)
│       ├── AlertsTab.tsx              (3 sections : périmés, péremption proche, stock bas)
│       └── CatalogItemForm.tsx        (modal création/édition d'item)
├── components/
│   └── FsecAssembly/
│       └── FsecAssemblyItemsTable.tsx (le tableau "Listing éléments" à intégrer dans AssemblyStep)
└── api/
    └── stock.ts                       (fonctions d'appel API : getCatalog, createMovement, etc.)
```

---

## 7. Migration Django

Une migration `app/migrations/0046_stock_module.py` (numéro à ajuster selon la dernière existante = 0045) qui :

1. Crée la table `STOCK_CATALOG_ITEM` avec tous les champs, index et contraintes.
2. Crée la table `STOCK_MOVEMENT` avec FK vers `STOCK_CATALOG_ITEM` (`on_delete=PROTECT`).
3. Crée la table `FSEC_ASSEMBLY_ITEM` avec FK vers `STOCK_CATALOG_ITEM` et colonne `fsec_uuid` (UUIDField simple, pas FK — voir §3.3).
4. Ajoute les contraintes d'unicité :
   ```python
   UniqueConstraint(
       fields=['fsec_uuid', 'catalog_item'],
       name='uq_fsec_assembly_item_fsec_item'
   )
   ```
5. Pas de seed de données. L'Excel template n'a pas de données réelles, c'est aux utilisateurs de saisir leur catalogue.

---

## 8. Frontend — Module Stock (menu principal)

### 8.1 Onglets

Le module expose 3 onglets dans sa page principale :

**Onglet 1 — Catalogue** (par défaut)
- Table paginée avec colonnes : `Type` (Élément/Consommable), `Rubrique`, `Nom`, `Référence`, `Fournisseur`, `Quantité/Statut`, `Emplacement`, `Actions`.
- Filtres en haut :
  - `Kind` (tous / élément / consommable)
  - `Rubrique` : dropdown des **6 valeurs figées** (cf. §4.6), groupées visuellement par kind (Éléments / Consommables) comme dans la maquette.
  - `Installation` (LMJ / OMEGA, visible quand kind=element)
  - `Statut` (dispo / réservée / affectée / tirée, visible quand kind=element)
  - Recherche texte plein sur `name` + `reference`.
- Bouton "Nouvel item" → flux en 2 étapes :
  - **Étape 1** : modal de choix `Kind` (Élément sérialisé / Consommable) — cf. maquette écran 4.
  - **Étape 2** : modal de saisie, formulaire adaptatif selon le kind (cf. listes de champs ci-dessous).
- Actions par ligne : Éditer (modal), Supprimer (soft-delete, admin only).
- Badges visuels dans la colonne Quantité/Statut :
  - Consommable sous seuil → badge orange.
  - Consommable périmé → badge rouge.
  - Élément avec status != dispo → badge de couleur par statut, avec le numéro FSEC associé quand applicable (réservée/affectée/tirée).

**Modal kind=element — champs visibles, dans cet ordre** (cf. §3.1 pour les types) :

| Champ formulaire | Champ modèle | Requis | Notes |
|---|---|:---:|---|
| Nom | `name` | ✓ | |
| Référence | `reference` | | Identifiant unique de l'instance (ex. `CIB-D2-2026-042`) |
| Rubrique | `category` | ✓ | Dropdown filtré sur les **4 valeurs element** : `pieces_elementaires`, `structuration`, `structuration_speciale`, `structuration_ec` |
| Installation | `installation` | ✓ | Radio LMJ / OMEGA |
| Caractéristique | `caracteristique` | | Texte libre (ex. `PEEK`, `Épaisseur 50µm`) |
| Type de colle | `type_de_colle` | | Texte libre (ex. `UV`, `3090`) |
| Matériaux | `materiaux_mat` | | **Visible uniquement si `category='structuration_speciale'`** |
| Fournisseur | `fournisseur` | | |
| Boîte | `boite` | | |
| Emplacement | `emplacement` | | |
| Observations | `remarques` | | Textarea |

→ `status` n'est PAS un champ de formulaire en création : forcé à `dispo` côté serveur. Il devient lecture seule dans le formulaire d'édition (modifié uniquement via le cycle de vie FSEC, cf. §4.2).

**Modal kind=consumable — champs visibles, dans cet ordre** :

| Champ formulaire | Champ modèle | Requis | Notes |
|---|---|:---:|---|
| Nom | `name` | ✓ | |
| Référence | `reference` | | Référence fournisseur ou code interne |
| Rubrique | `category` | ✓ | Dropdown filtré sur les **2 valeurs consumable** : `colles`, `autres` |
| Caractéristique | `caracteristique` | | Texte libre |
| Type de colle / nature | `type_de_colle` | | Surtout pertinent pour `category='colles'` (ex. `Époxy`, `Cyanoacrylate`) |
| Quantité initiale | `quantite` | ✓ | Entier ≥ 0 |
| Unité | `unite` | ✓ | Texte libre (ex. `tubes`, `L`, `kits`) |
| Seuil d'alerte | `seuil_alerte` | | Entier. Alerte si `quantite ≤ seuil_alerte` |
| Type d'achat | `type_d_achat` | | Texte libre (cf. Excel template) |
| Fournisseur | `fournisseur` | | |
| Date de péremption | `date_peremption` | | Alerte 30 jours avant (cf. §4.5) |
| Boîte | `boite` | | |
| Emplacement | `emplacement` | | |
| Observations | `remarques` | | Textarea |

**Onglet 2 — Mouvements**
- Table paginée : `Date`, `Item (nom + ref)`, `Type` (entrée/sortie/ajustement), `Quantité Δ`, `Stock après`, `Auteur`, `Remarque`.
- Filtres : item, type, plage de dates.
- Bouton "Nouveau mouvement" → modal :
  - Choix de l'item (autocomplete sur consommables uniquement).
  - Type, quantité (positive même pour sortie, le signe est appliqué côté serveur selon le type), date, remarque, auteur.
- Pas d'édition, seulement suppression (admin).

**Onglet 3 — Alertes**
- 3 sections côte à côte ou empilées :
  - **Périmés** (date_peremption ≤ aujourd'hui) — liste avec lien vers l'item.
  - **Péremption proche** (≤ 30 jours) — idem.
  - **Stock bas** (quantite ≤ seuil_alerte) — idem.
- Compteurs en en-tête de chaque section.
- Rafraîchi à chaque ouverture de l'onglet.

### 8.2 Pattern UI

Suivre le style des autres pages SPECTRE (Campaigns, FSECs, Embases). Utiliser les mêmes composants tableau, modals, badges. Ne pas introduire de nouvelle librairie UI.

---

## 9. Frontend — Tableau récap dans l'écran Assemblage d'une FSEC

### 9.1 Emplacement

Dans le composant d'édition d'un `AssemblyStep` (à trouver dans le frontend existant, probablement `frontend/src/pages/Fsec/.../AssemblyStepForm.tsx`), **ajouter une section** après les bancs d'assemblage, titrée **"Listing éléments"**.

### 9.2 Structure visuelle (cf. image fournie par l'utilisateur)

Tableau avec en-tête bleu clair :

```
| Éléments ▼ | Référence ▼ | Caractéristique | Type de colle | Fournisseur |
|------------|-------------|-----------------|---------------|-------------|
| Cible      | 2024_LMJ... |                 |               | LIE         |
| Structu... | N°521       |                 | UV            | LIE         |
| Plaque     |             | PEEK            |               | DTRI        |
| Cône       |             |                 | 3090          | LIE         |
| [+]        |             |                 |               |             |
```

**Colonnes toujours visibles** (cellules vides si N/A), avec des **dropdowns** pour les deux premières colonnes :
- Dropdown "Éléments" : liste les items du catalogue (via `/available-for-fsec/:fsec_uuid/`) groupés par `category`. Afficher le nom + catégorie.
- Dropdown "Référence" : filtré selon l'élément choisi (les items du catalogue ayant la même catégorie/nom). Alternative plus simple : dès que l'élément est choisi, sa référence est affichée automatiquement (champ read-only).
- Colonnes `Caractéristique`, `Type de colle`, `Fournisseur` : affichent les valeurs de l'item du catalogue (read-only).

**En pratique (choix recommandé pour simplifier) :**
- Une seule dropdown principale par ligne (combinant nom + référence), qui cherche dans `/available-for-fsec/`.
- Une fois un item choisi, TOUTES les autres colonnes se remplissent automatiquement en read-only à partir des données du catalogue.
- Pas de saisie manuelle dans les colonnes (toute donnée vient du catalogue).

### 9.3 Comportement

- **Ajout d'une ligne** : bouton `+` sous la dernière ligne. Ouvre une nouvelle ligne avec dropdown vide.
- **Suppression** : bouton poubelle en fin de ligne.
- **Réordonnancement** (optionnel v2) : drag & drop sur les lignes, met à jour `sort_order`.
- **Verrouillage** : si la FSEC est au statut "Tirée", le tableau est en lecture seule (inputs désactivés, boutons cachés). Afficher un bandeau "Tableau verrouillé : FSEC tirée".
- **Erreurs** :
  - Si on tente d'ajouter un élément déjà utilisé : toast rouge "Cet élément est déjà utilisé par une autre FSEC".
  - Si la FSEC est verrouillée : toast "Tableau verrouillé, FSEC tirée".

### 9.4 Données à charger

Au montage du composant :
- `GET /api/v1/fsec-assembly-items/fsec/:fsec_uuid/` → items actuels.
- `GET /api/v1/stock/catalog/available-for-fsec/:fsec_uuid/` → options du dropdown.

Sur chaque action : re-fetch les deux listes pour rester synchronisé avec les statuts d'éléments côté serveur.

---

## 10. Tests à écrire

Suivre le pattern de tests existants (s'il y en a — vérifier `backend/tests/` ou équivalent). Minimum attendu :

### 10.1 Tests unitaires services

- `catalog_service.test_create_element_valid`
- `catalog_service.test_create_consumable_valid`
- `catalog_service.test_create_rejects_mismatched_fields` (ex. consumable avec `status`)
- `catalog_service.test_soft_delete_rejects_if_referenced`
- `movement_service.test_create_movement_updates_quantity_atomically`
- `movement_service.test_create_movement_rejects_on_element_item`
- `movement_service.test_delete_recomputes_quantity`
- `fsec_assembly_service.test_add_element_reserves_it`
- `fsec_assembly_service.test_add_element_already_used_conflicts`
- `fsec_assembly_service.test_remove_element_releases_it`
- `fsec_assembly_service.test_modification_locked_when_fsec_tiree`
- `element_lifecycle_service.test_fsec_status_transition_propagates_to_elements`

### 10.2 Tests d'intégration API

- CRUD complet sur `/catalog/` (create, get, patch, delete).
- Création mouvement → vérifier mise à jour stock.
- Ajout d'un élément à une FSEC → vérifier status passe à `reservee`.
- Passage FSEC à "Tirée" → vérifier éléments passent à `tiree`.
- Tentative de modif tableau FSEC tirée → 409.

---

## 11. Points laissés hors scope v1 (à documenter clairement)

Ces points ont été discutés mais sont délibérément reportés :

- **Rétropropagation du statut FSEC "Tirée" → état antérieur** : non géré. Le statut `tiree` est irréversible en v1.
- **Permissions granulaires** : pendant la phase dev, tout le monde (sauf lecteurs, qui ont read-only de toute façon) peut tout faire. Durcir plus tard (ex. catalogue en admin-only, mouvements en opérateur-only).
- **Audit user** sur les mouvements : `auteur_name` en texte libre en v1. Pas de FK vers `User`. À durcir plus tard.
- **Quantités décimales** : `quantite` est `IntegerField`. Si besoin de grammes avec virgule, migrer vers `DecimalField` plus tard.
- **Multi-installations pour consommables** : on ne distingue pas LMJ/OMEGA pour les consommables. Si nécessaire, ajouter `installation` aux consommables.
- **Liens entre mouvements et FsecAssemblyItem** : aucun en v1. L'ajout d'un consommable à une FSEC ne génère PAS de mouvement de sortie. C'est une décision explicite (voir réponses utilisateur Q6).
- **Import/export CSV** du catalogue : pas en v1.
- **Historique d'état des éléments** : en v1, seul `status` courant est stocké. Pas de table `STOCK_ELEMENT_STATUS_HISTORY`. À ajouter si besoin de timeline.

---

## 12. Ordre de livraison recommandé

1. **Migration Django** (`0046_stock_module.py`) + entities.
2. **Beans + interfaces + mappers** (couche domaine, sans logique).
3. **Repositories** (impl des interfaces, CRUD simple).
4. **Services** dans l'ordre :
   a. `catalog_service` (CRUD + validations kind).
   b. `movement_service` (CRUD + update atomique quantité).
   c. `element_lifecycle_service` (reserve/release).
   d. `fsec_assembly_service` (orchestre catalog + element_lifecycle).
   e. Modification de `fsec_service.patch_fsec` pour appeler `sync_element_statuses_for_fsec`.
   f. `alert_service` (queries simples).
5. **Controllers + serializers + URLs**.
6. **Tests backend** (unitaires + intégration sur les cas critiques).
7. **Frontend Catalogue** (onglet 1) — le plus simple.
8. **Frontend Mouvements** (onglet 2).
9. **Frontend Alertes** (onglet 3).
10. **Frontend tableau récap FSEC** dans Assembly (le plus couplé).
11. **Tests end-to-end** sur le flux complet (créer item → ajouter à FSEC → passer FSEC tirée → vérifier verrouillage).

Chaque étape est mergeable indépendamment. Privilégier des PRs courtes.

---

## 13. Check-list finale avant livraison

- [ ] Migration réversible (test `migrate` + `migrate <app> <previous>`).
- [ ] Pas de `#REF!` / erreurs Django (`python manage.py check`).
- [ ] Couverture de tests ≥ 80% sur les services.
- [ ] Tous les endpoints documentés dans un fichier (OpenAPI si déjà en place, sinon README).
- [ ] Seed de données minimal pour dev (facultatif mais pratique).
- [ ] Logs structurés sur actions critiques (création/suppression item, changement d'état élément, mouvement).
- [ ] Pas de quantité négative possible (validation service + contrainte DB optionnelle `CheckConstraint`).
- [ ] Le frontend appelle bien `/available-for-fsec/` (et non `/catalog/` complet) pour les dropdowns du tableau récap, pour éviter d'afficher des éléments déjà utilisés ailleurs.
- [ ] Bandeau de verrouillage visible dès que FSEC Tirée.

---

*Fin du cahier des charges. Toute ambiguïté rencontrée pendant l'implémentation DOIT être résolue en se référant aux patterns existants du projet SPECTRE, ou en posant la question au product owner avant de coder à l'aveugle.*

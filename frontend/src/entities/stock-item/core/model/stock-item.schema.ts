/**
 * Stock Catalog Item — Zod schemas (validation + transformation).
 *
 * - `StockCatalogItemApiSchema` : payload brut backend (snake_case).
 * - `StockCatalogItemSchema`   : transformation → domaine (camelCase).
 * - `StockCatalogItemFormSchemas` : schémas par kind pour les formulaires
 *   de création/édition (champs requis adaptés selon kind).
 *
 * Source de vérité : `backend/app/domain/stock/models/stock_catalog_bean.py`
 * et `serializers.py`.
 */

import { z } from 'zod';

import {
    CATEGORIES_BY_KIND,
    CATEGORY_VALUES,
    ELEMENT_STATUS_VALUES,
    ITEM_KIND,
    ITEM_KIND_VALUES,
    INSTALLATION_VALUES,
    type CategoryCode,
    type ElementStatus,
    type Installation,
    type ItemKind,
} from './stock.constants';

// ─────────────────────────────────────────────────────────────────────────────
// API schema (snake_case → camelCase)
// ─────────────────────────────────────────────────────────────────────────────

export const StockCatalogItemApiSchema = z.object({
    uuid: z.string().uuid(),
    kind: z.enum(ITEM_KIND_VALUES as [ItemKind, ...ItemKind[]]),
    category: z.enum(CATEGORY_VALUES as [CategoryCode, ...CategoryCode[]]),
    name: z.string(),
    reference: z.string().nullable(),
    caracteristique: z.string().nullable(),
    type_de_colle: z.string().nullable(),
    fournisseur: z.string().nullable(),
    remarques: z.string().nullable(),
    unite: z.string().nullable(),
    quantite: z.number().int().nullable(),
    seuil_alerte: z.number().int().nullable(),
    date_peremption: z.string().nullable(),
    type_d_achat: z.string().nullable(),
    installation: z.enum(INSTALLATION_VALUES as [Installation, ...Installation[]]).nullable(),
    status: z.enum(ELEMENT_STATUS_VALUES as [ElementStatus, ...ElementStatus[]]).nullable(),
    materiaux_mat: z.string().nullable(),
    boite: z.string().nullable(),
    emplacement: z.string().nullable(),
    is_active: z.boolean(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export const StockCatalogItemSchema = StockCatalogItemApiSchema.transform((api) => ({
    uuid: api.uuid,
    kind: api.kind,
    category: api.category,
    name: api.name,
    reference: api.reference,
    caracteristique: api.caracteristique,
    typeDeColle: api.type_de_colle,
    fournisseur: api.fournisseur,
    remarques: api.remarques,
    unite: api.unite,
    quantite: api.quantite,
    seuilAlerte: api.seuil_alerte,
    datePeremption: api.date_peremption ? new Date(api.date_peremption) : null,
    typeDAchat: api.type_d_achat,
    installation: api.installation,
    status: api.status,
    materiauxMat: api.materiaux_mat,
    boite: api.boite,
    emplacement: api.emplacement,
    isActive: api.is_active,
    createdAt: api.created_at ? new Date(api.created_at) : null,
    updatedAt: api.updated_at ? new Date(api.updated_at) : null,
}));

export type StockCatalogItem = z.infer<typeof StockCatalogItemSchema>;
export type StockCatalogItemApi = z.input<typeof StockCatalogItemSchema>;

export const StockCatalogItemListSchema = z.array(StockCatalogItemSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Form schemas par kind (validation côté formulaire RHF + zodResolver)
// ─────────────────────────────────────────────────────────────────────────────

const ELEMENT_CATEGORY_VALUES = CATEGORIES_BY_KIND[ITEM_KIND.ELEMENT];
const CONSUMABLE_CATEGORY_VALUES = CATEGORIES_BY_KIND[ITEM_KIND.CONSUMABLE];

/** Schéma du formulaire élément (kind=element). */
export const ElementFormSchema = z.object({
    kind: z.literal(ITEM_KIND.ELEMENT),
    name: z.string().min(1, 'Le nom est requis').max(200),
    reference: z.string().max(200).optional().nullable(),
    category: z.enum(ELEMENT_CATEGORY_VALUES as [CategoryCode, ...CategoryCode[]], {
        required_error: 'La rubrique est requise',
    }),
    installation: z.enum(INSTALLATION_VALUES as [Installation, ...Installation[]], {
        required_error: "L'installation est requise",
    }),
    caracteristique: z.string().max(200).optional().nullable(),
    typeDeColle: z.string().max(100).optional().nullable(),
    materiauxMat: z.string().max(200).optional().nullable(),
    fournisseur: z.string().max(100).optional().nullable(),
    boite: z.string().max(200).optional().nullable(),
    emplacement: z.string().max(200).optional().nullable(),
    remarques: z.string().max(4000).optional().nullable(),
});

export type ElementFormValues = z.infer<typeof ElementFormSchema>;

/** Schéma du formulaire consommable (kind=consumable). */
export const ConsumableFormSchema = z.object({
    kind: z.literal(ITEM_KIND.CONSUMABLE),
    name: z.string().min(1, 'Le nom est requis').max(200),
    reference: z.string().max(200).optional().nullable(),
    category: z.enum(CONSUMABLE_CATEGORY_VALUES as [CategoryCode, ...CategoryCode[]], {
        required_error: 'La rubrique est requise',
    }),
    caracteristique: z.string().max(200).optional().nullable(),
    typeDeColle: z.string().max(100).optional().nullable(),
    quantite: z
        .number({ invalid_type_error: 'La quantité doit être un entier' })
        .int('La quantité doit être un entier')
        .min(0, 'La quantité ne peut pas être négative')
        .max(1_000_000_000),
    unite: z.string().min(1, "L'unité est requise").max(50),
    seuilAlerte: z
        .number()
        .int('Le seuil doit être un entier')
        .min(0, 'Le seuil ne peut pas être négatif')
        .max(1_000_000_000)
        .optional()
        .nullable(),
    typeDAchat: z.string().max(100).optional().nullable(),
    fournisseur: z.string().max(100).optional().nullable(),
    datePeremption: z.date().nullable().optional(),
    boite: z.string().max(200).optional().nullable(),
    emplacement: z.string().max(200).optional().nullable(),
    remarques: z.string().max(4000).optional().nullable(),
});

export type ConsumableFormValues = z.infer<typeof ConsumableFormSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Mappers form → payload API (snake_case)
// ─────────────────────────────────────────────────────────────────────────────

export interface StockCatalogItemPayload {
    kind: ItemKind;
    category: CategoryCode;
    name: string;
    reference?: string | null;
    caracteristique?: string | null;
    type_de_colle?: string | null;
    fournisseur?: string | null;
    remarques?: string | null;
    unite?: string | null;
    quantite?: number | null;
    seuil_alerte?: number | null;
    date_peremption?: string | null;
    type_d_achat?: string | null;
    installation?: Installation | null;
    status?: ElementStatus | null;
    materiaux_mat?: string | null;
    boite?: string | null;
    emplacement?: string | null;
}

const emptyToNull = <T extends string | null | undefined>(v: T): string | null =>
    !v || (typeof v === 'string' && v.trim() === '') ? null : v;

export function elementFormToApi(values: ElementFormValues): StockCatalogItemPayload {
    return {
        kind: ITEM_KIND.ELEMENT,
        category: values.category,
        name: values.name.trim(),
        reference: emptyToNull(values.reference),
        caracteristique: emptyToNull(values.caracteristique),
        type_de_colle: emptyToNull(values.typeDeColle),
        materiaux_mat: emptyToNull(values.materiauxMat),
        fournisseur: emptyToNull(values.fournisseur),
        installation: values.installation,
        boite: emptyToNull(values.boite),
        emplacement: emptyToNull(values.emplacement),
        remarques: emptyToNull(values.remarques),
    };
}

export function consumableFormToApi(values: ConsumableFormValues): StockCatalogItemPayload {
    return {
        kind: ITEM_KIND.CONSUMABLE,
        category: values.category,
        name: values.name.trim(),
        reference: emptyToNull(values.reference),
        caracteristique: emptyToNull(values.caracteristique),
        type_de_colle: emptyToNull(values.typeDeColle),
        unite: values.unite.trim(),
        quantite: values.quantite,
        seuil_alerte: values.seuilAlerte ?? null,
        type_d_achat: emptyToNull(values.typeDAchat),
        fournisseur: emptyToNull(values.fournisseur),
        date_peremption: values.datePeremption ? values.datePeremption.toISOString().slice(0, 10) : null,
        boite: emptyToNull(values.boite),
        emplacement: emptyToNull(values.emplacement),
        remarques: emptyToNull(values.remarques),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reverse mappers : StockCatalogItem → form values (pour pré-remplir l'édition)
// ─────────────────────────────────────────────────────────────────────────────

/** Convertit un item du catalogue (kind=element) vers les valeurs du formulaire. */
export function itemToElementFormValues(item: {
    kind: ItemKind;
    name: string;
    reference: string | null;
    category: CategoryCode;
    installation: Installation | null;
    caracteristique: string | null;
    typeDeColle: string | null;
    materiauxMat: string | null;
    fournisseur: string | null;
    boite: string | null;
    emplacement: string | null;
    remarques: string | null;
}): ElementFormValues {
    return {
        kind: ITEM_KIND.ELEMENT,
        name: item.name,
        reference: item.reference ?? '',
        category: item.category,
        installation: item.installation ?? INSTALLATION_VALUES[0],
        caracteristique: item.caracteristique ?? '',
        typeDeColle: item.typeDeColle ?? '',
        materiauxMat: item.materiauxMat ?? '',
        fournisseur: item.fournisseur ?? '',
        boite: item.boite ?? '',
        emplacement: item.emplacement ?? '',
        remarques: item.remarques ?? '',
    };
}

/** Convertit un item du catalogue (kind=consumable) vers les valeurs du formulaire. */
export function itemToConsumableFormValues(item: {
    kind: ItemKind;
    name: string;
    reference: string | null;
    category: CategoryCode;
    caracteristique: string | null;
    typeDeColle: string | null;
    quantite: number | null;
    unite: string | null;
    seuilAlerte: number | null;
    typeDAchat: string | null;
    fournisseur: string | null;
    datePeremption: Date | null;
    boite: string | null;
    emplacement: string | null;
    remarques: string | null;
}): ConsumableFormValues {
    return {
        kind: ITEM_KIND.CONSUMABLE,
        name: item.name,
        reference: item.reference ?? '',
        category: item.category,
        caracteristique: item.caracteristique ?? '',
        typeDeColle: item.typeDeColle ?? '',
        quantite: item.quantite ?? 0,
        unite: item.unite ?? '',
        seuilAlerte: item.seuilAlerte ?? null,
        typeDAchat: item.typeDAchat ?? '',
        fournisseur: item.fournisseur ?? '',
        datePeremption: item.datePeremption,
        boite: item.boite ?? '',
        emplacement: item.emplacement ?? '',
        remarques: item.remarques ?? '',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Form schemas pour l'édition (PATCH partiel)
// ─────────────────────────────────────────────────────────────────────────────

/** Schéma PATCH partiel — tous les champs optionnels, kind exclu (immuable). */
export const StockCatalogItemPatchSchema = z
    .object({
        category: z.enum(CATEGORY_VALUES as [CategoryCode, ...CategoryCode[]]),
        name: z.string().max(200),
        reference: z.string().max(200).nullable(),
        caracteristique: z.string().max(200).nullable(),
        type_de_colle: z.string().max(100).nullable(),
        fournisseur: z.string().max(100).nullable(),
        remarques: z.string().max(4000).nullable(),
        unite: z.string().max(50).nullable(),
        quantite: z.number().int().min(0).nullable(),
        seuil_alerte: z.number().int().min(0).nullable(),
        date_peremption: z.string().nullable(),
        type_d_achat: z.string().max(100).nullable(),
        installation: z.enum(INSTALLATION_VALUES as [Installation, ...Installation[]]).nullable(),
        status: z.enum(ELEMENT_STATUS_VALUES as [ElementStatus, ...ElementStatus[]]).nullable(),
        materiaux_mat: z.string().max(200).nullable(),
        boite: z.string().max(200).nullable(),
        emplacement: z.string().max(200).nullable(),
        is_active: z.boolean(),
    })
    .partial();

export type StockCatalogItemPatchPayload = z.infer<typeof StockCatalogItemPatchSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Stock alerts (réponse de GET /stock/alerts/)
// ─────────────────────────────────────────────────────────────────────────────

export const StockAlertsApiSchema = z.object({
    low_stock: z.array(StockCatalogItemSchema),
    expired: z.array(StockCatalogItemSchema),
    expiring_soon: z.array(StockCatalogItemSchema),
});

export const StockAlertsSchema = StockAlertsApiSchema.transform((api) => ({
    lowStock: api.low_stock,
    expired: api.expired,
    expiringSoon: api.expiring_soon,
}));

export type StockAlerts = z.infer<typeof StockAlertsSchema>;

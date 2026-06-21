/**
 * Stock — schemas Zod : transformation API → domaine + form mappers.
 */
import { describe, it, expect } from 'vitest';

import {
    ConsumableFormSchema,
    ElementBatchFormSchema,
    ElementFormSchema,
    StockCatalogItemSchema,
    consumableFormToApi,
    elementFormToApi,
    itemToConsumableFormValues,
    itemToElementFormValues,
    structurationBatchFormToApi,
} from './stock-item.schema';
import {
    CATEGORY,
    ELEMENT_STATUS,
    INSTALLATION,
    ITEM_KIND,
    STRUCTURATION_TYPE,
} from './stock.constants';

describe('StockCatalogItemSchema', () => {
    const baseApi = {
        uuid: '11111111-1111-1111-1111-111111111111',
        kind: 'consumable' as const,
        category: 'colles' as const,
        structuration_type: null,
        name: 'Araldite',
        reference: 'AR-100',
        caracteristique: null,
        type_de_colle: null,
        fournisseur: 'Henkel',
        remarques: null,
        unite: 'tubes',
        quantite: 5,
        seuil_alerte: 2,
        date_peremption: '2026-12-31',
        type_d_achat: null,
        fsec_name: null,
        installation: null,
        status: null,
        materiaux_mat: null,
        boite: null,
        emplacement: 'Étagère 3',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
    };

    it('transforme snake_case → camelCase et parse les dates', () => {
        const item = StockCatalogItemSchema.parse(baseApi);

        expect(item.kind).toBe(ITEM_KIND.CONSUMABLE);
        expect(item.seuilAlerte).toBe(2);
        expect(item.datePeremption).toBeInstanceOf(Date);
        expect(item.datePeremption?.toISOString().slice(0, 10)).toBe('2026-12-31');
        expect(item.createdAt).toBeInstanceOf(Date);
    });

    it('accepte date_peremption null', () => {
        const item = StockCatalogItemSchema.parse({ ...baseApi, date_peremption: null });
        expect(item.datePeremption).toBeNull();
    });

    it('rejette une category hors enum', () => {
        expect(() => StockCatalogItemSchema.parse({ ...baseApi, category: 'inconnu' })).toThrow();
    });

    it('rejette un kind invalide', () => {
        expect(() => StockCatalogItemSchema.parse({ ...baseApi, kind: 'autre' })).toThrow();
    });
});

describe('ElementFormSchema', () => {
    const baseValues = {
        kind: ITEM_KIND.ELEMENT,
        name: 'Cible D2',
        category: CATEGORY.PIECES_ELEMENTAIRES,
        installation: INSTALLATION.LMJ,
        reference: 'D2-001',
    };

    it('valide un payload élément minimal', () => {
        const result = ElementFormSchema.safeParse(baseValues);
        expect(result.success).toBe(true);
    });

    it('exige un nom non vide', () => {
        const result = ElementFormSchema.safeParse({ ...baseValues, name: '' });
        expect(result.success).toBe(false);
    });

    it('rejette une rubrique consommable sur un élément', () => {
        const result = ElementFormSchema.safeParse({
            ...baseValues,
            category: CATEGORY.COLLES,
        });
        expect(result.success).toBe(false);
    });

    it('exige le type quand la rubrique est structuration', () => {
        const result = ElementFormSchema.safeParse({
            ...baseValues,
            category: CATEGORY.STRUCTURATION,
        });
        expect(result.success).toBe(false);
    });

    it('accepte structuration avec type + nom (édition)', () => {
        const result = ElementFormSchema.safeParse({
            ...baseValues,
            category: CATEGORY.STRUCTURATION,
            structurationType: STRUCTURATION_TYPE.EC,
        });
        expect(result.success).toBe(true);
    });

    it('accepte la FSEC absente, nulle ou renseignée (optionnelle)', () => {
        expect(ElementFormSchema.safeParse(baseValues).success).toBe(true);
        expect(ElementFormSchema.safeParse({ ...baseValues, fsecName: null }).success).toBe(true);
        expect(
            ElementFormSchema.safeParse({ ...baseValues, fsecName: 'FSEC-2026-001' }).success,
        ).toBe(true);
    });
});

describe('ElementBatchFormSchema (mode paquet)', () => {
    const batchBase = {
        kind: ITEM_KIND.ELEMENT,
        name: '', // auto (numéro de série) en mode paquet
        category: CATEGORY.STRUCTURATION,
        installation: INSTALLATION.LMJ,
        structurationType: STRUCTURATION_TYPE.STANDARD,
        batchQuantity: 5,
    };

    it('accepte un paquet valide sans nom manuel', () => {
        expect(ElementBatchFormSchema.safeParse(batchBase).success).toBe(true);
    });

    it('exige une quantité ≥ 1', () => {
        expect(ElementBatchFormSchema.safeParse({ ...batchBase, batchQuantity: 0 }).success).toBe(false);
        expect(ElementBatchFormSchema.safeParse({ ...batchBase, batchQuantity: null }).success).toBe(false);
    });

    it('exige le type de structuration', () => {
        expect(
            ElementBatchFormSchema.safeParse({ ...batchBase, structurationType: null }).success,
        ).toBe(false);
    });

    it('hors structuration : nom requis, quantité ignorée', () => {
        expect(
            ElementBatchFormSchema.safeParse({
                ...batchBase,
                category: CATEGORY.PIECES_ELEMENTAIRES,
                structurationType: null,
                name: 'Plaque A',
            }).success,
        ).toBe(true);
    });
});

describe('structurationBatchFormToApi', () => {
    it('mappe le formulaire paquet vers le payload batch', () => {
        const payload = structurationBatchFormToApi({
            kind: ITEM_KIND.ELEMENT,
            name: '',
            category: CATEGORY.STRUCTURATION,
            installation: INSTALLATION.LMJ,
            structurationType: STRUCTURATION_TYPE.SPECIALE,
            batchQuantity: 3,
            materiauxMat: 'Cu/Au',
            fournisseur: '  ',
        });
        expect(payload.quantity).toBe(3);
        expect(payload.structuration_type).toBe(STRUCTURATION_TYPE.SPECIALE);
        expect(payload.installation).toBe(INSTALLATION.LMJ);
        expect(payload.materiaux_mat).toBe('Cu/Au');
        expect(payload.fournisseur).toBeNull();
    });
});

describe('ConsumableFormSchema', () => {
    const baseValues = {
        kind: ITEM_KIND.CONSUMABLE,
        name: 'Araldite',
        category: CATEGORY.COLLES,
        quantite: 10,
        unite: 'tubes',
    };

    it('valide un payload consommable minimal', () => {
        const result = ConsumableFormSchema.safeParse(baseValues);
        expect(result.success).toBe(true);
    });

    it('refuse une quantité négative', () => {
        const result = ConsumableFormSchema.safeParse({ ...baseValues, quantite: -1 });
        expect(result.success).toBe(false);
    });

    it('refuse une rubrique élément sur un consommable', () => {
        const result = ConsumableFormSchema.safeParse({
            ...baseValues,
            category: CATEGORY.PIECES_ELEMENTAIRES,
        });
        expect(result.success).toBe(false);
    });
});

describe('elementFormToApi', () => {
    it('mappe en snake_case et trim/null-ifie les chaînes vides', () => {
        const payload = elementFormToApi({
            kind: ITEM_KIND.ELEMENT,
            name: '  Cible D2  ',
            reference: '',
            category: CATEGORY.PIECES_ELEMENTAIRES,
            installation: INSTALLATION.LMJ,
            caracteristique: '   ',
            typeDeColle: 'Stycast',
            materiauxMat: null,
            fournisseur: 'CEA',
            boite: null,
            emplacement: null,
            remarques: null,
        });

        expect(payload.kind).toBe(ITEM_KIND.ELEMENT);
        expect(payload.name).toBe('Cible D2');
        expect(payload.reference).toBeNull();
        expect(payload.caracteristique).toBeNull();
        expect(payload.type_de_colle).toBe('Stycast');
        expect(payload.installation).toBe(INSTALLATION.LMJ);
        // FSEC non renseignée → null dans le payload.
        expect(payload.fsec_name).toBeNull();
    });

    it('envoie le type pour structuration et le nullifie pour les autres rubriques', () => {
        const base = {
            kind: ITEM_KIND.ELEMENT,
            name: 'Structuration X',
            reference: null,
            installation: INSTALLATION.LMJ,
            caracteristique: null,
            typeDeColle: null,
            materiauxMat: null,
            fournisseur: null,
            boite: null,
            emplacement: null,
            remarques: null,
        };

        const structuration = elementFormToApi({
            ...base,
            category: CATEGORY.STRUCTURATION,
            structurationType: STRUCTURATION_TYPE.SPECIALE,
        });
        expect(structuration.structuration_type).toBe(STRUCTURATION_TYPE.SPECIALE);

        // Type résiduel (changement de rubrique) → nullifié dans le payload.
        const pieces = elementFormToApi({
            ...base,
            category: CATEGORY.PIECES_ELEMENTAIRES,
            structurationType: STRUCTURATION_TYPE.SPECIALE,
        });
        expect(pieces.structuration_type).toBeNull();
    });
});

describe('consumableFormToApi', () => {
    it('mappe Date → ISO YYYY-MM-DD', () => {
        const payload = consumableFormToApi({
            kind: ITEM_KIND.CONSUMABLE,
            name: 'Araldite',
            reference: null,
            category: CATEGORY.COLLES,
            caracteristique: null,
            typeDeColle: null,
            quantite: 10,
            unite: 'tubes',
            seuilAlerte: 2,
            typeDAchat: null,
            fournisseur: null,
            datePeremption: new Date(Date.UTC(2026, 11, 31, 12, 0, 0)),
            boite: null,
            emplacement: null,
            remarques: null,
        });

        expect(payload.kind).toBe(ITEM_KIND.CONSUMABLE);
        expect(payload.date_peremption).toBe('2026-12-31');
        expect(payload.quantite).toBe(10);
    });
});

describe('item → form reverse mappers', () => {
    it('itemToElementFormValues convertit un item complet en valeurs RHF', () => {
        const apiItem = StockCatalogItemSchema.parse({
            uuid: '22222222-2222-2222-2222-222222222222',
            kind: 'element' as const,
            category: 'pieces_elementaires' as const,
            structuration_type: null,
            name: 'Cible D2',
            reference: 'D2-001',
            caracteristique: null,
            type_de_colle: null,
            fournisseur: null,
            remarques: null,
            unite: null,
            quantite: null,
            seuil_alerte: null,
            date_peremption: null,
            type_d_achat: null,
            fsec_name: null,
            installation: 'LMJ' as const,
            status: ELEMENT_STATUS.DISPO,
            materiaux_mat: 'Or',
            boite: null,
            emplacement: 'Salle 1',
            is_active: true,
            created_at: null,
            updated_at: null,
        });

        const values = itemToElementFormValues(apiItem);
        expect(values.kind).toBe(ITEM_KIND.ELEMENT);
        expect(values.name).toBe('Cible D2');
        expect(values.installation).toBe(INSTALLATION.LMJ);
        expect(values.materiauxMat).toBe('Or');
    });

    it('itemToConsumableFormValues conserve la date de péremption', () => {
        const apiItem = StockCatalogItemSchema.parse({
            uuid: '33333333-3333-3333-3333-333333333333',
            kind: 'consumable' as const,
            category: 'colles' as const,
            structuration_type: null,
            name: 'Araldite',
            reference: null,
            caracteristique: null,
            type_de_colle: null,
            fournisseur: null,
            remarques: null,
            unite: 'tubes',
            quantite: 4,
            seuil_alerte: 2,
            date_peremption: '2026-06-15',
            type_d_achat: null,
            fsec_name: null,
            installation: null,
            status: null,
            materiaux_mat: null,
            boite: null,
            emplacement: null,
            is_active: true,
            created_at: null,
            updated_at: null,
        });

        const values = itemToConsumableFormValues(apiItem);
        expect(values.kind).toBe(ITEM_KIND.CONSUMABLE);
        expect(values.quantite).toBe(4);
        expect(values.unite).toBe('tubes');
        expect(values.datePeremption).toBeInstanceOf(Date);
    });
});

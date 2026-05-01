/**
 * Stock MSW handlers & mock data factories for tests.
 *
 * Couvre les endpoints du module Stock (cf. CDC §5) :
 *   - GET    /stock/catalog/                    (liste filtrée)
 *   - POST   /stock/catalog/                    (création)
 *   - GET    /stock/catalog/:uuid/              (détail)
 *   - PATCH  /stock/catalog/:uuid/              (mise à jour partielle)
 *   - DELETE /stock/catalog/:uuid/              (soft-delete)
 *   - GET    /stock/alerts/                     (low_stock + expired + expiring_soon)
 */
import { http, HttpResponse } from 'msw';

type StockKind = 'element' | 'consumable';
type StockCategory =
    | 'pieces_elementaires'
    | 'structuration'
    | 'structuration_speciale'
    | 'structuration_ec'
    | 'colles'
    | 'autres';

interface StockItemOverrides {
    uuid?: string;
    kind?: StockKind;
    category?: StockCategory;
    name?: string;
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
    installation?: 'LMJ' | 'OMEGA' | null;
    status?: 'dispo' | 'reservee' | 'affectee' | 'tiree' | null;
    materiaux_mat?: string | null;
    boite?: string | null;
    emplacement?: string | null;
    is_active?: boolean;
}

export const createMockStockCatalogItem = (overrides: StockItemOverrides = {}) => ({
    uuid: crypto.randomUUID(),
    kind: 'consumable' as StockKind,
    category: 'colles' as StockCategory,
    name: 'Item Stock Test',
    reference: 'REF-001',
    caracteristique: null,
    type_de_colle: null,
    fournisseur: null,
    remarques: null,
    unite: 'tubes',
    quantite: 10,
    seuil_alerte: 2,
    date_peremption: null,
    type_d_achat: null,
    installation: null,
    status: null,
    materiaux_mat: null,
    boite: null,
    emplacement: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
});

/** Default stock handlers — listes vides + 404 pour détails inconnus. */
export const stockHandlers = [
    http.get('/api/v1/stock/catalog/', () => HttpResponse.json([])),
    http.get('/api/v1/stock/catalog/:uuid/', () => new HttpResponse(null, { status: 404 })),
    http.post('/api/v1/stock/catalog/', async ({ request }) => {
        const body = (await request.json()) as StockItemOverrides;
        return HttpResponse.json(createMockStockCatalogItem(body), { status: 201 });
    }),
    http.patch('/api/v1/stock/catalog/:uuid/', async ({ params, request }) => {
        const body = (await request.json()) as StockItemOverrides;
        return HttpResponse.json(createMockStockCatalogItem({ uuid: params.uuid as string, ...body }));
    }),
    http.delete('/api/v1/stock/catalog/:uuid/', () => new HttpResponse(null, { status: 204 })),
    http.get('/api/v1/stock/alerts/', () => HttpResponse.json({ low_stock: [], expired: [], expiring_soon: [] })),
];

/** Stock handlers avec données injectées (pour les tests qui veulent un jeu spécifique). */
export function stockHandlersWithData(data: {
    items?: ReturnType<typeof createMockStockCatalogItem>[];
    alerts?: {
        low_stock?: ReturnType<typeof createMockStockCatalogItem>[];
        expired?: ReturnType<typeof createMockStockCatalogItem>[];
        expiring_soon?: ReturnType<typeof createMockStockCatalogItem>[];
    };
}) {
    const items = data.items ?? [];
    return [
        http.get('/api/v1/stock/catalog/', () => HttpResponse.json(items)),
        http.get('/api/v1/stock/catalog/:uuid/', ({ params }) => {
            const item = items.find((i) => i.uuid === params.uuid);
            return item ? HttpResponse.json(item) : new HttpResponse(null, { status: 404 });
        }),
        http.post('/api/v1/stock/catalog/', async ({ request }) => {
            const body = (await request.json()) as StockItemOverrides;
            return HttpResponse.json(createMockStockCatalogItem(body), { status: 201 });
        }),
        http.patch('/api/v1/stock/catalog/:uuid/', async ({ params, request }) => {
            const body = (await request.json()) as StockItemOverrides;
            return HttpResponse.json(createMockStockCatalogItem({ uuid: params.uuid as string, ...body }));
        }),
        http.delete('/api/v1/stock/catalog/:uuid/', () => new HttpResponse(null, { status: 204 })),
        http.get('/api/v1/stock/alerts/', () =>
            HttpResponse.json({
                low_stock: data.alerts?.low_stock ?? [],
                expired: data.alerts?.expired ?? [],
                expiring_soon: data.alerts?.expiring_soon ?? [],
            }),
        ),
    ];
}

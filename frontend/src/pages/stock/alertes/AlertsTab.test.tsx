/**
 * AlertsTab — render selon les 3 catégories d'alertes (CDC §5.4).
 *
 * Utilise MSW pour piloter la réponse de GET /stock/alerts/.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderWithProviders, screen, waitFor } from '@test/test-utils';
import { server } from '@test/mocks/server';

import { createMockStockCatalogItem } from '@test/mocks/stock-handlers';
import { AlertsTab } from './AlertsTab';

describe('AlertsTab', () => {
    beforeEach(() => {
        server.resetHandlers();
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it("affiche le message de succès quand aucune alerte n'est active", async () => {
        server.use(
            http.get('/api/v1/stock/alerts/', () =>
                HttpResponse.json({ low_stock: [], expired: [], expiring_soon: [] }),
            ),
        );

        renderWithProviders(<AlertsTab />);

        await waitFor(() => {
            expect(screen.getByText(/Aucune alerte active/i)).toBeInTheDocument();
        });
    });

    it('affiche les 3 cartes compteurs et les sections quand alertes présentes', async () => {
        const expired = createMockStockCatalogItem({
            name: 'Araldite expirée',
            quantite: 1,
            seuil_alerte: null,
            date_peremption: '2026-01-01',
        });
        const expiringSoon = createMockStockCatalogItem({
            name: 'Stycast bientôt',
            quantite: 5,
            seuil_alerte: null,
            date_peremption: '2026-05-10',
        });
        const lowStock = createMockStockCatalogItem({
            name: 'Tubes test',
            quantite: 1,
            seuil_alerte: 5,
            date_peremption: null,
        });

        server.use(
            http.get('/api/v1/stock/alerts/', () =>
                HttpResponse.json({
                    low_stock: [lowStock],
                    expired: [expired],
                    expiring_soon: [expiringSoon],
                }),
            ),
        );

        renderWithProviders(<AlertsTab />);

        // Carte compteur "Consommables périmés" → unique en haut
        await waitFor(() => {
            expect(screen.getAllByText('Consommables périmés').length).toBeGreaterThan(0);
        });

        // Cartes compteurs spécifiques
        expect(screen.getByText('Péremption < 30 jours')).toBeInTheDocument();
        expect(screen.getByText('Stock bas')).toBeInTheDocument();

        // Sections (titres distincts)
        expect(screen.getByText(/Péremption proche/i)).toBeInTheDocument();
        expect(screen.getByText(/Stock bas \(sous seuil/i)).toBeInTheDocument();

        // Items présents dans la liste
        expect(screen.getByText('Araldite expirée')).toBeInTheDocument();
        expect(screen.getByText('Stycast bientôt')).toBeInTheDocument();
        expect(screen.getByText('Tubes test')).toBeInTheDocument();
    });

    it("affiche un message d'erreur quand l'API échoue", async () => {
        server.use(
            http.get('/api/v1/stock/alerts/', () => HttpResponse.json({ detail: 'Internal Error' }, { status: 500 })),
        );

        renderWithProviders(<AlertsTab />);

        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });
        expect(screen.getByRole('alert')).toHaveTextContent(/Erreur lors du chargement/i);
    });
});

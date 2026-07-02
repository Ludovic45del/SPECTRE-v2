/**
 * Tests ElementFormShell — soumission du formulaire élément, dont le mode
 * « paquet » (création de plusieurs structurations numérotées d'un coup).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { renderWithProviders } from '@test/test-utils';
import { server } from '@test/mocks/server';
import { ElementFormShell } from './ElementFormShell';

describe('ElementFormShell — mode paquet structuration', () => {
    const onBack = vi.fn();
    const onCancel = vi.fn();
    const onSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        server.use(
            http.get('/api/v1/fsecs/', () => HttpResponse.json([])),
            http.get('/api/v1/stock/catalog/next-structuration-number/', () =>
                HttpResponse.json({ next: 4 }),
            ),
        );
    });

    const setup = () => {
        const user = userEvent.setup();
        renderWithProviders(<ElementFormShell onBack={onBack} onCancel={onCancel} onSuccess={onSuccess} />);
        return user;
    };

    const selectRubriqueStructuration = async (user: ReturnType<typeof userEvent.setup>) => {
        await user.click(screen.getByRole('combobox', { name: /rubrique/i }));
        await user.click(await screen.findByRole('option', { name: /structuration/i }));
    };

    it('crée un paquet de plusieurs structurations (quantité > 1)', async () => {
        let capturedBody: Record<string, unknown> | null = null;
        server.use(
            http.post('/api/v1/stock/catalog/batch-structuration/', async ({ request }) => {
                capturedBody = (await request.json()) as Record<string, unknown>;
                const qty = Number(capturedBody.quantity);
                return HttpResponse.json(
                    Array.from({ length: qty }, (_, i) => ({
                        uuid: crypto.randomUUID(),
                        kind: 'element',
                        category: 'structuration',
                        structuration_type: capturedBody!.structuration_type,
                        name: String(4 + i),
                        reference: null,
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
                        installation: 'LMJ',
                        status: 'dispo',
                        materiaux_mat: null,
                        boite: null,
                        emplacement: null,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })),
                    { status: 201 },
                );
            }),
        );

        const user = setup();

        await selectRubriqueStructuration(user);

        // Type de structuration
        await user.click(screen.getByRole('combobox', { name: /^type$/i }));
        await user.click(await screen.findByRole('option', { name: /standard/i }));

        // Quantité = 3
        const qtyInput = screen.getByLabelText(/quantité/i);
        await user.clear(qtyInput);
        await user.type(qtyInput, '3');

        await user.click(screen.getByRole('button', { name: /ajouter au catalogue/i }));

        await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
        expect(capturedBody).toMatchObject({
            structuration_type: 'standard',
            installation: 'LMJ',
            quantity: 3,
        });
    });

    it("affiche l'aperçu de la plage de numéros en mode paquet", async () => {
        const user = setup();

        await selectRubriqueStructuration(user);

        const qtyInput = screen.getByLabelText(/quantité/i);
        await user.clear(qtyInput);
        await user.type(qtyInput, '5');

        // next=4, quantité 5 → n° 4 → n° 8
        expect(await screen.findByText(/n° 4 → n° 8/)).toBeInTheDocument();
    });
});

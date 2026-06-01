/**
 * Tests du widget Sidebar.
 *
 * Cible le comportement « flyout » : quand la sidebar est repliée, cliquer sur
 * une rubrique à sous-items (Équipe et Carte, Indicateurs, Stock) n'effectue
 * plus de navigation directe mais ouvre un menu de choix ; la navigation se
 * fait au clic sur un sous-item. Les rubriques sans sous-item naviguent
 * directement.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { setup, screen, waitFor } from '@test/test-utils';
import { Sidebar } from './Sidebar';
import { useSidebarStore } from './sidebar.store';

// La sidebar consomme useStockAlerts pour le badge « Alertes » ; on le neutralise
// ici afin d'isoler le test du flyout (pas de requête async → pas de warning act).
vi.mock('@entities/stock-item', () => ({
    useStockAlerts: () => ({ data: undefined }),
}));

const ROLE_LABELS = { CHEF_DE_LABO: 'Chef de labo' };

/** Affiche le pathname courant pour vérifier la navigation déclenchée. */
function LocationProbe() {
    const { pathname } = useLocation();
    return <div data-testid="pathname">{pathname}</div>;
}

function renderCollapsedSidebar() {
    return setup(
        <>
            <Sidebar roleLabels={ROLE_LABELS} />
            <LocationProbe />
        </>,
        { initialEntries: ['/'] },
    );
}

describe('Sidebar — flyout en mode replié', () => {
    beforeEach(() => {
        // Force l'état replié (collapsed) avant chaque rendu.
        useSidebarStore.setState({ isOpen: false });
    });

    afterEach(() => {
        useSidebarStore.setState({ isOpen: true });
    });

    it('ouvre un menu de choix au clic sur Stock sans naviguer', async () => {
        const { user } = renderCollapsedSidebar();

        await user.click(screen.getByRole('button', { name: 'Stock' }));

        // Le menu propose les trois sous-rubriques…
        const menu = await screen.findByRole('menu', { name: 'Stock' });
        expect(menu).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Catalogue' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Mouvements' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Alertes/ })).toBeInTheDocument();

        // …et aucune navigation n'a eu lieu (toujours sur l'accueil).
        expect(screen.getByTestId('pathname')).toHaveTextContent('/');
    });

    it('navigue vers le sous-item choisi puis ferme le menu', async () => {
        const { user } = renderCollapsedSidebar();

        await user.click(screen.getByRole('button', { name: 'Équipe et Carte' }));
        await user.click(await screen.findByRole('menuitem', { name: 'Carte' }));

        expect(screen.getByTestId('pathname')).toHaveTextContent('/equipe/carte');
        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    });

    it('navigue directement pour une rubrique sans sous-item', async () => {
        const { user } = renderCollapsedSidebar();

        const campagnes = screen.getByRole('button', { name: 'Campagnes' });
        expect(campagnes).not.toHaveAttribute('aria-haspopup');

        await user.click(campagnes);

        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(screen.getByTestId('pathname')).toHaveTextContent('/campagnes');
    });
});

/**
 * Tests for PlanningToolbar — navigation, filters, edit mode.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, server } from '@test/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { PlanningToolbar } from '../PlanningToolbar';
import { usePlanningStore } from '../../lib/planning.store';

beforeEach(() => {
    server.use(http.get('/api/v1/campaigns/', () => HttpResponse.json([])));
    usePlanningStore.setState({
        editMode: false,
    });
    usePlanningStore.getState().resetFilters();
});

describe('PlanningToolbar', () => {
    describe('Rendering', () => {
        it('should render navigation buttons', () => {
            renderWithProviders(<PlanningToolbar />);
            expect(screen.getByLabelText('Précédent')).toBeInTheDocument();
            expect(screen.getByLabelText('Suivant')).toBeInTheDocument();
            expect(screen.getByLabelText("Aujourd'hui")).toBeInTheDocument();
        });

        it('should render edit mode button', () => {
            renderWithProviders(<PlanningToolbar />);
            expect(screen.getByText('Modifier')).toBeInTheDocument();
        });

        it('should render filter button', () => {
            renderWithProviders(<PlanningToolbar />);
            expect(screen.getByText('Filtres')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should update anchorDate when clicking forward', async () => {
            const user = userEvent.setup();
            const initialDate = usePlanningStore.getState().anchorDate;
            renderWithProviders(<PlanningToolbar />);

            await user.click(screen.getByLabelText('Suivant'));

            expect(usePlanningStore.getState().anchorDate).not.toBe(initialDate);
        });

        it('should update anchorDate when clicking backward', async () => {
            const user = userEvent.setup();
            const initialDate = usePlanningStore.getState().anchorDate;
            renderWithProviders(<PlanningToolbar />);

            await user.click(screen.getByLabelText('Précédent'));

            expect(usePlanningStore.getState().anchorDate).not.toBe(initialDate);
        });
    });

    describe('Edit mode', () => {
        it('should toggle edit mode on click', async () => {
            const user = userEvent.setup();
            renderWithProviders(<PlanningToolbar />);

            expect(usePlanningStore.getState().editMode).toBe(false);
            await user.click(screen.getByText('Modifier'));
            expect(usePlanningStore.getState().editMode).toBe(true);
        });

        it('should show "Modification" when edit mode is active', async () => {
            const user = userEvent.setup();
            renderWithProviders(<PlanningToolbar />);

            await user.click(screen.getByText('Modifier'));
            expect(screen.getByText('Modification')).toBeInTheDocument();
        });
    });

    describe('Filters', () => {
        it('should open filters popover on click', async () => {
            const user = userEvent.setup();
            renderWithProviders(<PlanningToolbar />);

            await user.click(screen.getByText('Filtres'));

            await waitFor(() => {
                expect(screen.getByText('Filtres avancés')).toBeInTheDocument();
            });
        });
    });
});

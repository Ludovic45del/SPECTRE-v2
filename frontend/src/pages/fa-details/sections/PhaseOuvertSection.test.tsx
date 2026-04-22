/**
 * Tests for PhaseOuvertSection Component
 *
 * Tests the Phase 1 (Ouvert) section with view and edit modes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, server } from '@test/test-utils';
import { PhaseOuvertSection } from './PhaseOuvertSection';
import type { Fa } from '@entities/fa';

// Valid UUIDs for Zod validation
const MOCK_FA_UUID = '00000000-0000-0000-0000-000000000001';
const MOCK_FSEC_VERSION_UUID = '00000000-0000-0000-0000-000000000002';

// Mock FA data
const createMockFa = (overrides: Partial<Fa> = {}): Fa => ({
    uuid: MOCK_FA_UUID,
    fsecVersionId: MOCK_FSEC_VERSION_UUID,
    identifier: 'FA-001',
    statusId: 0,
    typeId: null,
    criticalityId: null,
    fsecStepId: 2,
    fsecStepOther: null,
    eventDate: new Date('2025-02-15'),
    discoverer: 'Jean Dupont',
    observation: 'Test observation',
    locationEquipment: 'Salle A',
    quickAnalysis: 'Analyse rapide test',
    immediateMeasures: 'Mesures prises',
    iecValidationOpen: false,
    iecValidationOpenDate: null,
    iecValidationOpenName: null,
    cause: null,
    experienceImpact: null,
    iecValidationProgress: false,
    iecValidationProgressDate: null,
    iecValidationProgressName: null,
    closureValidation: null,
    closureDate: null,
    closureValidatorName: null,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    lastUpdated: new Date('2025-01-15T10:00:00Z'),
    ...overrides,
});

/** Build a full FA API response that passes Zod validation */
const createMockFaApiResponse = (overrides: Record<string, unknown> = {}) => ({
    uuid: MOCK_FA_UUID,
    fsec_version_id: MOCK_FSEC_VERSION_UUID,
    identifier: 'FA-001',
    status_id: 0,
    type_id: null,
    criticality_id: null,
    fsec_step_id: 2,
    fsec_step_other: null,
    discoverer: 'Jean Dupont',
    event_date: '2025-02-15',
    observation: 'Test observation',
    location_equipment: 'Salle A',
    quick_analysis: 'Analyse rapide test',
    immediate_measures: 'Mesures prises',
    iec_validation_open: false,
    iec_validation_open_date: null,
    iec_validation_open_name: null,
    cause: null,
    experience_impact: null,
    iec_validation_progress: false,
    iec_validation_progress_date: null,
    iec_validation_progress_name: null,
    closure_validation: null,
    closure_date: null,
    closure_validator_name: null,
    created_at: '2025-01-15T10:00:00Z',
    last_updated: '2025-01-15T10:00:00Z',
    ...overrides,
});

// Mock notification hook
const mockShowNotification = vi.fn();
vi.mock('@shared/ui', async (importOriginal) => {
    const original = await importOriginal<typeof import('@shared/ui')>();
    return {
        ...original,
        useNotification: () => ({
            showNotification: mockShowNotification,
        }),
    };
});

describe('PhaseOuvertSection', () => {
    beforeEach(() => {
        mockShowNotification.mockClear();

        // useUpdateFa uses api.put (not patch)
        server.use(
            http.put('/api/v1/fas/:uuid/', () => {
                return HttpResponse.json(createMockFaApiResponse());
            }),
        );
    });

    // ============================================================================
    // RENDERING TESTS - VIEW MODE
    // ============================================================================

    describe('View Mode Rendering', () => {
        it('should render Phase 1 title', () => {
            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByText('Phase 1 - Ouvert')).toBeInTheDocument();
        });

        it('should render section with proper aria-label', () => {
            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByRole('region', { name: /Phase 1/i })).toBeInTheDocument();
        });

        it('should display FSEC step', () => {
            const fa = createMockFa({ fsecStepId: 2 });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByText('Étape FSEC')).toBeInTheDocument();
        });

        it('should display custom FSEC step when id is 7', () => {
            const fa = createMockFa({ fsecStepId: 7, fsecStepOther: 'Custom Step' });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByText(/Autre: Custom Step/)).toBeInTheDocument();
        });

        it('should display event date', () => {
            const fa = createMockFa({ eventDate: new Date('2025-02-15') });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByText("Date de l'évènement")).toBeInTheDocument();
        });

        it('should display discoverer', () => {
            const fa = createMockFa({ discoverer: 'Jean Dupont' });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByText('Découvreur')).toBeInTheDocument();
            expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        });

        it('should display observation', () => {
            const fa = createMockFa({ observation: 'Test observation content' });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByText('Constat')).toBeInTheDocument();
            expect(screen.getByText('Test observation content')).toBeInTheDocument();
        });

        it('should display quick analysis', () => {
            const fa = createMockFa({ quickAnalysis: 'Quick analysis content' });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByText('Analyse rapide')).toBeInTheDocument();
            expect(screen.getByText('Quick analysis content')).toBeInTheDocument();
        });

        it('should display location equipment', () => {
            const fa = createMockFa({ locationEquipment: 'Equipment Room A' });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByText('Lieu / Équipement')).toBeInTheDocument();
            expect(screen.getByText('Equipment Room A')).toBeInTheDocument();
        });

        it('should display immediate measures when provided', () => {
            const fa = createMockFa({ immediateMeasures: 'Immediate action taken' });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByText('Mesures immédiates')).toBeInTheDocument();
            expect(screen.getByText('Immediate action taken')).toBeInTheDocument();
        });

        it('should show dash for empty fields', () => {
            const fa = createMockFa({
                discoverer: '',
                observation: '',
                locationEquipment: '',
            });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            // Check that dashes are shown for empty fields
            const dashes = screen.getAllByText('-');
            expect(dashes.length).toBeGreaterThan(0);
        });

        it('should render edit button', () => {
            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(
                screen.getByRole('button', { name: /Modifier les informations de la Phase 1 Ouvert/i }),
            ).toBeInTheDocument();
        });
    });

    // ============================================================================
    // EDIT MODE TESTS
    // ============================================================================

    describe('Edit Mode', () => {
        it('should switch to edit mode when edit button clicked', async () => {
            const user = userEvent.setup();
            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            // Should show form
            expect(screen.getByRole('form', { name: /Formulaire d'édition Phase 1/i })).toBeInTheDocument();
        });

        it('should pre-fill form with existing data', async () => {
            const user = userEvent.setup();
            const fa = createMockFa({
                discoverer: 'Jean Dupont',
                observation: 'Test observation',
            });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            const discovererInput = screen.getByRole('textbox', { name: /Découvreur/i });
            expect(discovererInput).toHaveValue('Jean Dupont');
        });

        it('should render cancel button in edit mode', async () => {
            const user = userEvent.setup();
            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument();
        });

        it('should render save button in edit mode', async () => {
            const user = userEvent.setup();
            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            expect(screen.getByRole('button', { name: /Enregistrer/i })).toBeInTheDocument();
        });

        it('should cancel edit mode when cancel button clicked', async () => {
            const user = userEvent.setup();
            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            // Enter edit mode
            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            // Cancel
            const cancelButton = screen.getByRole('button', { name: /Annuler/i });
            await user.click(cancelButton);

            // Should be back to view mode
            expect(screen.queryByRole('form')).not.toBeInTheDocument();
        });

        it('should show fsecStepOther field when FSEC step is 7 (Autre)', async () => {
            const user = userEvent.setup();
            const fa = createMockFa({ fsecStepId: 7 });
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            expect(screen.getByRole('textbox', { name: /Préciser/i })).toBeInTheDocument();
        });
    });

    // ============================================================================
    // SAVE TESTS
    // ============================================================================

    describe('Save Functionality', () => {
        it('should call API on save', async () => {
            const user = userEvent.setup();
            let apiCalled = false;

            server.use(
                http.put('/api/v1/fas/:uuid/', () => {
                    apiCalled = true;
                    return HttpResponse.json(createMockFaApiResponse());
                }),
            );

            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            // Enter edit mode
            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            // Save
            const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(apiCalled).toBe(true);
            });
        });

        it('should show success notification on save', async () => {
            const user = userEvent.setup();

            server.use(
                http.put('/api/v1/fas/:uuid/', () => {
                    return HttpResponse.json(createMockFaApiResponse());
                }),
            );

            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            // Enter edit mode
            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            // Save
            const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(mockShowNotification).toHaveBeenCalledWith('Phase Ouvert mise à jour', 'success');
            });
        });

        it('should show error notification on API failure', async () => {
            const user = userEvent.setup();

            server.use(
                http.put('/api/v1/fas/:uuid/', () => {
                    return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
                }),
            );

            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            // Enter edit mode
            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            // Save
            const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(mockShowNotification).toHaveBeenCalledWith(expect.any(String), 'error');
            });
        });

        it('should disable save button during pending state', async () => {
            const user = userEvent.setup();

            server.use(
                http.put('/api/v1/fas/:uuid/', async () => {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    return HttpResponse.json(createMockFaApiResponse());
                }),
            );

            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            // Enter edit mode
            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            // Save
            const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(saveButton).toBeDisabled();
            });
        });

        it('should return to view mode after successful save', async () => {
            const user = userEvent.setup();

            server.use(
                http.put('/api/v1/fas/:uuid/', () => {
                    return HttpResponse.json(createMockFaApiResponse());
                }),
            );

            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            // Enter edit mode
            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            // Save
            const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
            await user.click(saveButton);

            // Should return to view mode
            await waitFor(() => {
                expect(screen.queryByRole('form')).not.toBeInTheDocument();
            });
        });
    });

    // ============================================================================
    // ACCESSIBILITY TESTS
    // ============================================================================

    describe('Accessibility', () => {
        it('should have proper section role', () => {
            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            expect(screen.getByRole('region')).toBeInTheDocument();
        });

        it('should indicate busy state during update', async () => {
            const user = userEvent.setup();

            server.use(
                http.put('/api/v1/fas/:uuid/', async () => {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    return HttpResponse.json(createMockFaApiResponse());
                }),
            );

            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            // Enter edit mode
            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            // Save
            const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
            await user.click(saveButton);

            await waitFor(() => {
                const section = screen.getByRole('region');
                expect(section).toHaveAttribute('aria-busy', 'true');
            });
        });

        it('should have proper form role in edit mode', async () => {
            const user = userEvent.setup();
            const fa = createMockFa();
            renderWithProviders(<PhaseOuvertSection fa={fa} />);

            const editButton = screen.getByRole('button', {
                name: /Modifier les informations de la Phase 1 Ouvert/i,
            });
            await user.click(editButton);

            expect(screen.getByRole('form')).toBeInTheDocument();
        });
    });
});

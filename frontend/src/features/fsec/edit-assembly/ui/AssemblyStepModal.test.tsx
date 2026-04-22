/**
 * Tests for AssemblyStepModal Component
 *
 * Tests the Assembly step modal for create, edit, and delete operations.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, server } from '@test/test-utils';
import { useNotificationStore } from '@shared/lib';
import { AssemblyStepModal } from './AssemblyStepModal';

// Mock data - camelCase domain model for component props
const mockAssemblyStep = {
    uuid: '00000000-0000-0000-0000-000000000001',
    fsecVersionId: '00000000-0000-0000-0000-000000000002',
    hydrometricTemperature: 22.5,
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-02-15'),
    comments: 'Test assembly step',
    assemblyBenchIds: [1, 2],
};

// Mock API response - snake_case matching AssemblyStepApiSchema
const mockAssemblyStepApi = {
    uuid: '00000000-0000-0000-0000-000000000001',
    fsec_version_id: '00000000-0000-0000-0000-000000000002',
    hydrometric_temperature: 22.5,
    start_date: '2025-02-01',
    end_date: '2025-02-15',
    comments: 'Test assembly step',
    assembly_bench_ids: [1, 2],
};

const mockAssemblyBenches = [
    { id: 1, name: 'Banc A' },
    { id: 2, name: 'Banc B' },
    { id: 3, name: 'Banc C' },
];

describe('AssemblyStepModal', () => {
    const mockOnClose = vi.fn();
    const fsecVersionId = '00000000-0000-0000-0000-000000000002';

    beforeEach(() => {
        mockOnClose.mockClear();

        // Setup default handlers
        server.use(
            http.get('/api/v1/assembly-benches/', () => {
                return HttpResponse.json(mockAssemblyBenches);
            }),
            http.post('/api/v1/assembly-steps/', () => {
                return HttpResponse.json(mockAssemblyStepApi, { status: 201 });
            }),
            http.put('/api/v1/assembly-steps/:uuid/', () => {
                return HttpResponse.json(mockAssemblyStepApi);
            }),
            http.delete('/api/v1/assembly-steps/:uuid/', () => {
                return new HttpResponse(null, { status: 204 });
            }),
        );
    });

    describe('Rendering', () => {
        it('should render modal when open', () => {
            renderWithProviders(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should not render modal when closed', () => {
            renderWithProviders(<AssemblyStepModal open={false} onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('should render create form when no step provided', () => {
            renderWithProviders(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            // Should show create title ("Nouvel assemblage")
            expect(screen.getByText(/nouvel assemblage/i)).toBeInTheDocument();
        });

        it('should render edit form when step provided', () => {
            renderWithProviders(
                <AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} step={mockAssemblyStep} />,
            );

            // Should show edit title
            expect(screen.getByText(/modifier|éditer/i)).toBeInTheDocument();
        });

        it('should render form fields', () => {
            renderWithProviders(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            // Check for expected form fields
            expect(screen.getByLabelText(/température/i)).toBeInTheDocument();
        });
    });

    describe('Create Mode', () => {
        it('should have empty form in create mode', () => {
            renderWithProviders(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            const tempInput = screen.getByLabelText(/température/i) as HTMLInputElement;
            expect(tempInput.value).toBe('');
        });

        it('should call API on submit', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} step={mockAssemblyStep} />,
            );

            // Modify a field
            const tempInput = screen.getByLabelText(/température/i);
            await user.clear(tempInput);
            await user.type(tempInput, '23.5');

            // Submit
            const submitButton = screen.getByRole('button', { name: /sauvegarder/i });
            await user.click(submitButton);

            // Wait for API call and modal close
            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });

        it('should show loading state during submission', async () => {
            const user = userEvent.setup();

            // Delay API response
            server.use(
                http.put(`/api/v1/assembly-steps/${mockAssemblyStep.uuid}/`, async () => {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    return HttpResponse.json(mockAssemblyStepApi);
                }),
            );

            renderWithProviders(
                <AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} step={mockAssemblyStep} />,
            );

            const submitButton = screen.getByRole('button', { name: /sauvegarder/i });
            await user.click(submitButton);

            // Should show loading indicator
            expect(submitButton).toBeDisabled();
        });
    });

    describe('Edit Mode', () => {
        it('should pre-fill form with step data', () => {
            renderWithProviders(
                <AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} step={mockAssemblyStep} />,
            );

            const tempInput = screen.getByLabelText(/température/i) as HTMLInputElement;
            expect(tempInput.value).toBe('22.5');
        });

        it('should call update API on submit', async () => {
            const user = userEvent.setup();
            let apiCalled = false;

            server.use(
                http.put(`/api/v1/assembly-steps/${mockAssemblyStep.uuid}/`, () => {
                    apiCalled = true;
                    return HttpResponse.json(mockAssemblyStepApi);
                }),
            );

            renderWithProviders(
                <AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} step={mockAssemblyStep} />,
            );

            // Modify a field
            const tempInput = screen.getByLabelText(/température/i);
            await user.clear(tempInput);
            await user.type(tempInput, '25.0');

            // Submit
            const submitButton = screen.getByRole('button', { name: /sauvegarder/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(apiCalled).toBe(true);
            });
        });
    });

    describe('Delete Mode', () => {
        it('should show delete button in edit mode', () => {
            renderWithProviders(
                <AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} step={mockAssemblyStep} />,
            );

            expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument();
        });

        it('should not show delete button in create mode', () => {
            renderWithProviders(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            expect(screen.queryByRole('button', { name: /supprimer/i })).not.toBeInTheDocument();
        });

        it('should show confirmation before delete', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} step={mockAssemblyStep} />,
            );

            const deleteButton = screen.getByRole('button', { name: /supprimer/i });
            await user.click(deleteButton);

            // Should show confirmation dialog or change button state
            await waitFor(() => {
                expect(screen.getByText(/confirmer|êtes-vous sûr/i)).toBeInTheDocument();
            });
        });

        it('should call delete API on confirm', async () => {
            const user = userEvent.setup();
            let deleteCalled = false;

            server.use(
                http.delete(`/api/v1/assembly-steps/${mockAssemblyStep.uuid}/`, () => {
                    deleteCalled = true;
                    return new HttpResponse(null, { status: 204 });
                }),
            );

            renderWithProviders(
                <AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} step={mockAssemblyStep} />,
            );

            // Click delete
            const deleteButton = screen.getByRole('button', { name: /supprimer/i });
            await user.click(deleteButton);

            // Confirm deletion
            const confirmButton = screen.getByRole('button', { name: /confirmer la suppression/i });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(deleteCalled).toBe(true);
            });
        });
    });

    describe('Cancel & Close', () => {
        it('should call onClose when cancel button clicked', async () => {
            const user = userEvent.setup();
            renderWithProviders(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            const cancelButton = screen.getByRole('button', { name: /annuler/i });
            await user.click(cancelButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('should call onClose when clicking outside modal', async () => {
            const user = userEvent.setup();
            renderWithProviders(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            // Click backdrop
            const backdrop = document.querySelector('.MuiBackdrop-root');
            if (backdrop) {
                await user.click(backdrop);
                expect(mockOnClose).toHaveBeenCalled();
            }
        });

        it('should reset form on close', async () => {
            const user = userEvent.setup();
            const { rerender } = renderWithProviders(
                <AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />,
            );

            // Fill form
            const tempInput = screen.getByLabelText(/température/i);
            await user.type(tempInput, '25.0');

            // Close modal
            rerender(<AssemblyStepModal open={false} onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            // Reopen modal
            rerender(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            // Form should be reset
            const newTempInput = screen.getByLabelText(/température/i) as HTMLInputElement;
            expect(newTempInput.value).toBe('');
        });
    });

    describe('Error Handling', () => {
        it('should show error message on API failure', async () => {
            const user = userEvent.setup();
            const showNotificationSpy = vi.spyOn(useNotificationStore.getState(), 'showNotification');

            server.use(
                http.put(`/api/v1/assembly-steps/${mockAssemblyStep.uuid}/`, () => {
                    return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
                }),
            );

            renderWithProviders(
                <AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} step={mockAssemblyStep} />,
            );

            // Submit form
            const submitButton = screen.getByRole('button', { name: /sauvegarder/i });
            await user.click(submitButton);

            // Should show error notification
            await waitFor(() => {
                expect(showNotificationSpy).toHaveBeenCalledWith(expect.stringContaining('Erreur'), 'error');
            });

            showNotificationSpy.mockRestore();
        });

        it('should not close modal on error', async () => {
            const user = userEvent.setup();

            server.use(
                http.post('/api/v1/assembly-steps/', () => {
                    return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
                }),
            );

            renderWithProviders(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            const submitButton = screen.getByRole('button', { name: /sauvegarder/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockOnClose).not.toHaveBeenCalled();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have accessible dialog role', () => {
            renderWithProviders(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        });

        it('should trap focus within modal', async () => {
            const user = userEvent.setup();
            renderWithProviders(<AssemblyStepModal open onClose={mockOnClose} fsecVersionId={fsecVersionId} />);

            // Tab through the modal
            await user.tab();
            await user.tab();
            await user.tab();

            // Focus should still be within the modal
            const dialog = screen.getByRole('dialog');
            expect(dialog.contains(document.activeElement)).toBe(true);
        });
    });
});

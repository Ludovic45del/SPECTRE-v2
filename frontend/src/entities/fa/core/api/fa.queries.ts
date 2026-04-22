/**
 * FA API Service - TanStack Query Hooks
 * @module entities/fa/api
 *
 * Provides React hooks for FA (Fiche d'Anomalie) CRUD operations
 * using TanStack Query for data fetching and cache management.
 *
 * ## Workflow States
 * - **Ouvert (0)**: Initial state, Phase 1 data entry
 * - **En cours (1)**: After IEC validation, Phase 2 data entry
 * - **Clos (2)**: Closed after final validation
 *
 * ## Endpoints
 * - GET /fas/ → list all
 * - GET /fas/{uuid}/ → detail
 * - GET /fas/fsec/{fsec_version_id}/ → get FA by FSEC
 * - POST /fas/ → create
 * - PUT /fas/{uuid}/ → update
 * - DELETE /fas/{uuid}/ → delete
 * - POST /fas/{uuid}/validate-open/ → validate open phase
 * - POST /fas/{uuid}/validate-progress/ → validate progress phase
 * - POST /fas/{uuid}/close/ → close FA
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@shared/api';
import { QUERY_CACHE_CONFIG } from '@shared/lib';

import { type Fa, type FaCreate, type FaUpdate, FaListSchema, FaSchema, faCreateToApi, faUpdateToApi } from '../model';
import { faKeys } from './fa.keys';

/**
 * Hook to fetch all FAs (Fiches d'Anomalie).
 *
 * @returns TanStack Query result with FA array
 *
 * @example
 * ```tsx
 * const { data: fas, isLoading, error } = useFas();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * return <FaList items={fas} />;
 * ```
 */
export function useFas() {
    return useQuery({
        queryKey: faKeys.lists(),
        queryFn: async ({ signal }): Promise<Fa[]> => {
            const data = await api.get('/fas/', undefined, signal);
            return FaListSchema.parse(data);
        },
        ...QUERY_CACHE_CONFIG,
    });
}

/**
 * Hook to fetch a single FA by UUID.
 *
 * @param uuid - The unique identifier of the FA
 * @returns TanStack Query result with FA object
 *
 * @example
 * ```tsx
 * const { uuid } = useParams();
 * const { data: fa, isLoading } = useFa(uuid);
 *
 * if (!fa) return null;
 * return <FaDetails fa={fa} />;
 * ```
 */
export function useFa(uuid: string) {
    return useQuery({
        queryKey: faKeys.detail(uuid),
        queryFn: async ({ signal }): Promise<Fa> => {
            const data = await api.get(`/fas/${uuid}/`, undefined, signal);
            return FaSchema.parse(data);
        },
        enabled: Boolean(uuid),
        ...QUERY_CACHE_CONFIG,
    });
}

/**
 * Hook to fetch a FA associated with a specific FSEC.
 *
 * Returns null if no FA exists for the given FSEC (one-to-one relationship).
 *
 * @param fsecVersionId - The FSEC version UUID
 * @returns TanStack Query result with FA or null
 *
 * @example
 * ```tsx
 * const { data: fa } = useFaByFsec(fsec.versionUuid);
 *
 * if (fa) {
 *   return <Link to={`/fa/${fa.uuid}`}>Voir FA</Link>;
 * }
 * return <Button onClick={openCreateFaModal}>Créer FA</Button>;
 * ```
 */
export function useFaByFsec(fsecVersionId: string) {
    return useQuery({
        queryKey: faKeys.byFsec(fsecVersionId),
        queryFn: async ({ signal }): Promise<Fa | null> => {
            try {
                const data = await api.get(`/fas/fsec/${fsecVersionId}/`, undefined, signal);
                return FaSchema.parse(data);
            } catch (error) {
                // Return null only for 404 (no FA found for this FSEC)
                if (error instanceof ApiError && error.status === 404) {
                    return null;
                }
                throw error;
            }
        },
        enabled: Boolean(fsecVersionId),
        ...QUERY_CACHE_CONFIG,
    });
}

/**
 * Hook to create a new FA.
 *
 * Automatically invalidates FA list and FSEC-specific queries on success.
 * The FA is created with status "Ouvert" (0).
 *
 * @returns TanStack Mutation with create function
 *
 * @example
 * ```tsx
 * const createMutation = useCreateFa();
 *
 * const handleCreate = async (data: FaCreate) => {
 *   try {
 *     const newFa = await createMutation.mutateAsync(data);
 *     navigate(`/fa/${newFa.uuid}`);
 *   } catch (error) {
 *     showNotification('Erreur création', 'error');
 *   }
 * };
 * ```
 */
export function useCreateFa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: FaCreate): Promise<Fa> => {
            const apiData = faCreateToApi(data);
            const response = await api.post('/fas/', apiData);
            return FaSchema.parse(response);
        },
        onSuccess: (newFa) => {
            // Pre-populate detail cache so navigation shows data immediately
            queryClient.setQueryData(faKeys.detail(newFa.uuid), newFa);
            // Invalidate list
            queryClient.invalidateQueries({ queryKey: faKeys.lists() });
            // Invalidate FSEC-specific query
            if (newFa.fsecVersionId) {
                queryClient.invalidateQueries({
                    queryKey: faKeys.byFsec(newFa.fsecVersionId),
                });
            }
        },
    });
}

/**
 * Hook to update an existing FA.
 *
 * Supports partial updates for Phase 1 (Ouvert) and Phase 2 (En cours) fields.
 * Automatically invalidates all related queries on success.
 *
 * @returns TanStack Mutation with update function
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateFa();
 *
 * const handleSave = async () => {
 *   await updateMutation.mutateAsync({
 *     uuid: fa.uuid,
 *     discoverer: form.discoverer,
 *     observation: form.observation,
 *   });
 *   showNotification('Mise à jour réussie', 'success');
 * };
 * ```
 */
export function useUpdateFa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: FaUpdate): Promise<Fa> => {
            const apiData = faUpdateToApi(data);
            const response = await api.put(`/fas/${data.uuid}/`, apiData);
            return FaSchema.parse(response);
        },
        onSuccess: (updatedFa) => {
            queryClient.invalidateQueries({ queryKey: faKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: faKeys.detail(updatedFa.uuid),
            });
            if (updatedFa.fsecVersionId) {
                queryClient.invalidateQueries({
                    queryKey: faKeys.byFsec(updatedFa.fsecVersionId),
                });
            }
        },
    });
}

/**
 * Hook to delete a FA.
 *
 * Removes the FA permanently. Automatically invalidates related queries.
 *
 * @returns TanStack Mutation with delete function
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteFa();
 *
 * const handleDelete = async () => {
 *   if (confirm('Supprimer cette FA ?')) {
 *     await deleteMutation.mutateAsync(fa.uuid);
 *     navigate('/fas');
 *   }
 * };
 * ```
 */
export function useDeleteFa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (uuid: string): Promise<string> => {
            await api.delete(`/fas/${uuid}/`);
            return uuid; // Return uuid for onSuccess
        },
        onSuccess: (deletedUuid) => {
            queryClient.invalidateQueries({ queryKey: faKeys.lists() });
            queryClient.invalidateQueries({ queryKey: faKeys.detail(deletedUuid) });
            // Invalidate all byFsec queries since we don't have the fsecVersionId here
            queryClient.invalidateQueries({ queryKey: [...faKeys.all, 'fsec'] });
        },
    });
}

/**
 * Hook to validate Phase 1 (Ouvert) and transition to Phase 2 (En cours).
 *
 * Requires IEC validation. Updates FA status from 0 (Ouvert) to 1 (En cours).
 *
 * @returns TanStack Mutation with validate function
 *
 * @example
 * ```tsx
 * const validateMutation = useValidateOpenFa();
 *
 * const handleValidate = async () => {
 *   await validateMutation.mutateAsync({
 *     uuid: fa.uuid,
 *     validatorName: 'Jean Dupont (IEC)',
 *     validationDate: new Date(),
 *   });
 *   showNotification('Phase Ouvert validée', 'success');
 * };
 * ```
 */
export function useValidateOpenFa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            uuid,
            validatorName,
            validationDate,
        }: {
            /** FA UUID */
            uuid: string;
            /** Name of the IEC validator */
            validatorName: string;
            /** Optional validation date (defaults to today) */
            validationDate?: Date;
        }): Promise<Fa> => {
            const response = await api.post(`/fas/${uuid}/validate-open/`, {
                validator_name: validatorName,
                validation_date: validationDate?.toISOString().split('T')[0] ?? null,
            });
            return FaSchema.parse(response);
        },
        onSuccess: (updatedFa) => {
            queryClient.invalidateQueries({ queryKey: faKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: faKeys.detail(updatedFa.uuid),
            });
        },
    });
}

/**
 * Hook to validate Phase 2 (En cours) and transition to Phase 3 (Clos).
 *
 * Requires IEC validation. Updates FA status from 1 (En cours) to 2 (Clos).
 *
 * @returns TanStack Mutation with validate function
 *
 * @example
 * ```tsx
 * const validateMutation = useValidateProgressFa();
 *
 * const handleValidate = async () => {
 *   await validateMutation.mutateAsync({
 *     uuid: fa.uuid,
 *     validatorName: 'Marie Martin (IEC)',
 *   });
 * };
 * ```
 */
export function useValidateProgressFa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            uuid,
            validatorName,
            validationDate,
        }: {
            /** FA UUID */
            uuid: string;
            /** Name of the IEC validator */
            validatorName: string;
            /** Optional validation date (defaults to today) */
            validationDate?: Date;
        }): Promise<Fa> => {
            const response = await api.post(`/fas/${uuid}/validate-progress/`, {
                validator_name: validatorName,
                validation_date: validationDate?.toISOString().split('T')[0] ?? null,
            });
            return FaSchema.parse(response);
        },
        onSuccess: (updatedFa) => {
            queryClient.invalidateQueries({ queryKey: faKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: faKeys.detail(updatedFa.uuid),
            });
        },
    });
}

/**
 * Hook to close a FA definitively.
 *
 * Requires Chef Labo + IEC validation. Sets final closure information.
 * Status is set to 2 (Clos).
 *
 * @returns TanStack Mutation with close function
 *
 * @example
 * ```tsx
 * const closeMutation = useCloseFa();
 *
 * const handleClose = async () => {
 *   await closeMutation.mutateAsync({
 *     uuid: fa.uuid,
 *     validatorName: 'Chef Labo + IEC',
 *     closureValidation: 'Anomalie corrigée, vérifications effectuées',
 *     closureDate: new Date(),
 *   });
 *   showNotification('FA clôturée', 'success');
 * };
 * ```
 */
export function useCloseFa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            uuid,
            validatorName,
            closureValidation,
            closureDate,
        }: {
            /** FA UUID */
            uuid: string;
            /** Name of the validators (Chef Labo + IEC) */
            validatorName: string;
            /** Closure validation text explaining resolution */
            closureValidation: string;
            /** Optional closure date (defaults to today) */
            closureDate?: Date;
        }): Promise<Fa> => {
            const response = await api.post(`/fas/${uuid}/close/`, {
                validator_name: validatorName,
                closure_validation: closureValidation,
                closure_date: closureDate?.toISOString().split('T')[0] ?? null,
            });
            return FaSchema.parse(response);
        },
        onSuccess: (updatedFa) => {
            queryClient.invalidateQueries({ queryKey: faKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: faKeys.detail(updatedFa.uuid),
            });
        },
    });
}

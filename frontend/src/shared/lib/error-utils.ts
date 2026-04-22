import { ApiError } from '@shared/api';

/**
 * Extract a user-friendly error message from an API error (EB-3 fix).
 */
export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
    if (error instanceof ApiError) {
        // Try to get detail from backend error response
        const detail = (error.data as Record<string, unknown>)?.detail;
        if (typeof detail === 'string') return detail;

        switch (error.status) {
            case 400:
                return 'Données invalides. Vérifiez les champs du formulaire.';
            case 403:
                return 'Accès non autorisé.';
            case 404:
                return 'Ressource introuvable.';
            case 409:
                return 'Conflit : cette donnée existe déjà.';
            case 422:
                return 'Données invalides.';
            case 500:
                return 'Erreur serveur. Veuillez réessayer.';
            default:
                return fallback;
        }
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
}

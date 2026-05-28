/**
 * Route chunk prefetching.
 * @module app/router/prefetch
 *
 * Chaque page est découpée en chunk via `React.lazy`, donc son JS n'est
 * téléchargé qu'à la première visite de la route. Sur un serveur à latence
 * réseau, ce téléchargement au clic vide l'écran derrière le fallback
 * `<Suspense>` → ça donne l'impression d'un rechargement complet de page.
 *
 * En préchargeant le chunk au survol / focus de l'entrée de menu, il est déjà
 * dans le cache de modules au moment du clic → la transition est instantanée.
 *
 * `pageLoaders` est la source unique partagée avec les `React.lazy` du router :
 * le loader ESM dédoublonne par spécificateur, donc un chunk préchargé est
 * réutilisé (jamais téléchargé deux fois).
 */

export const pageLoaders = {
    login: () => import('@pages/login'),
    setInitialPassword: () => import('@pages/set-initial-password'),
    home: () => import('@pages/home'),
    adminUsers: () => import('@pages/admin/users'),
    changePassword: () => import('@pages/change-password'),
    campaigns: () => import('@pages/campaigns'),
    campaignDetails: () => import('@pages/campaign-details'),
    fsecs: () => import('@pages/fsecs'),
    fsecDetails: () => import('@pages/fsec-details'),
    fas: () => import('@pages/fas'),
    faDetails: () => import('@pages/fa-details'),
    embases: () => import('@pages/embases'),
    embaseDetails: () => import('@pages/embase-details'),
    planning: () => import('@pages/planning'),
    indicateursFa: () => import('@pages/indicateurs/fa'),
    indicateursFsec: () => import('@pages/indicateurs/fsec'),
    stock: () => import('@pages/stock'),
    materiel: () => import('@pages/materiel'),
    materielMachines: () => import('@pages/materiel/MachinesView'),
};

type PageLoader = () => Promise<unknown>;

/**
 * Associe un chemin d'entrée de menu aux chunk(s) rendus quand on visite ce
 * chemin. Un chemin peut tirer plusieurs chunks (`/materiel` rend la coquille
 * de page + sa vue enfant par défaut). Les sections parentes pointent vers ce
 * sur quoi le clic atterrit réellement (`/indicateurs` redirige vers
 * `/indicateurs/fa`, toutes les sous-routes `/stock/*` partagent StockPage).
 */
const ROUTE_CHUNKS: Record<string, readonly PageLoader[]> = {
    '/': [pageLoaders.home],
    '/campagnes': [pageLoaders.campaigns],
    '/fsecs': [pageLoaders.fsecs],
    '/fas': [pageLoaders.fas],
    '/embases': [pageLoaders.embases],
    '/planning': [pageLoaders.planning],
    '/indicateurs': [pageLoaders.indicateursFa],
    '/indicateurs/fa': [pageLoaders.indicateursFa],
    '/indicateurs/fsec': [pageLoaders.indicateursFsec],
    '/materiel': [pageLoaders.materiel, pageLoaders.materielMachines],
    '/stock': [pageLoaders.stock],
    '/stock/catalogue': [pageLoaders.stock],
    '/stock/mouvements': [pageLoaders.stock],
    '/stock/alertes': [pageLoaders.stock],
    '/admin/utilisateurs': [pageLoaders.adminUsers],
};

const prefetched = new Set<string>();

/**
 * Précharge le(s) chunk(s) JS d'un chemin de navigation. Idempotent ; un échec
 * réseau est ignoré (la navigation réelle relancera l'import).
 */
export function prefetchRoute(path: string): void {
    if (prefetched.has(path)) return;
    const loaders = ROUTE_CHUNKS[path];
    if (!loaders) return;
    prefetched.add(path);
    for (const load of loaders) {
        load().catch(() => {
            prefetched.delete(path);
        });
    }
}

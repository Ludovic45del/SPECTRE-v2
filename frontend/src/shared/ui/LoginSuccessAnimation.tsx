/**
 * LoginSuccessAnimation — overlay de confirmation post-login (esthétique Apple).
 * @module shared/ui/LoginSuccessAnimation
 *
 * Joue une séquence orchestrée d'environ 1.9s :
 *   backdrop → card → cercle SVG dessiné → checkmark dessinée → titre + sous-titre
 *   en cascade → fade-out → onComplete().
 *
 * Tout est CSS pur (transform + opacity + stroke-dashoffset) pour rester
 * GPU-accelerated. Aucune dépendance hors MUI/Emotion (déjà présents).
 *
 * Réutilisable hors login : passer `greeting`, `accentColor`, `totalDurationMs`
 * pour adapter à d'autres confirmations (création FA, save campagne, etc.).
 *
 * Personnalisation par CSS custom properties (cf. --lsa-* dans le sx racine).
 * Un parent peut surcharger via `style={{ '--lsa-accent': '#34C759' }}` —
 * pas besoin de prop drilling pour des variantes ponctuelles.
 *
 * Respecte `prefers-reduced-motion` : durées réduites à ~1ms, fade-out conservé
 * pour garder une transition douce vers la suite.
 */

import { useEffect, useRef, type CSSProperties } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';

// ============================================================================
// Keyframes (Emotion `keyframes` génère un nom unique, pas de collision globale)
// ============================================================================

const backdropIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const cardIn = keyframes`
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
`;

// Le draw du cercle utilise stroke-dashoffset (animable en CSS).
// La valeur initiale = la circonférence (≈ 226 pour r=36) ; la valeur finale = 0.
const circleDraw = keyframes`
    from { stroke-dashoffset: 226; }
    to   { stroke-dashoffset: 0; }
`;

// Idem pour la checkmark : on init dashoffset = longueur du path (mesurée au mount).
// CSS variable pour pouvoir injecter la longueur réelle du path via inline style.
const checkDraw = keyframes`
    from { stroke-dashoffset: var(--lsa-check-length, 50); }
    to   { stroke-dashoffset: 0; }
`;

const textRise = keyframes`
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
    from { opacity: 1; }
    to   { opacity: 0; }
`;

// Nom utilisé pour filtrer l'event onAnimationEnd. Emotion génère un nom unique
// pour `fadeOut` qu'on lit via `.name` (présent sur le retour de keyframes).
const FADE_OUT_NAME = fadeOut.name;

// ============================================================================
// Props
// ============================================================================

export interface LoginSuccessAnimationProps {
    /** Sous-titre "Bonjour, {firstName}". Si absent, le sous-titre est masqué. */
    firstName?: string;
    /** Titre principal. Défaut: "Bienvenue". */
    greeting?: string;
    /** Couleur d'accent (cercle + checkmark). Défaut: brand SPECTRE. */
    accentColor?: string;
    /**
     * Durée totale visible avant le fade-out (ms). Défaut 1500.
     * Le fade-out (400ms) s'ajoute par-dessus → durée totale ≈ +400ms.
     * Le filet de sécurité onComplete se déclenche à totalDurationMs + 600ms.
     */
    totalDurationMs?: number;
    /** Appelé une fois le fade-out terminé. */
    onComplete: () => void;
}

// ============================================================================
// Constantes de séquencement (en ms). Calées sur le brief Apple-like.
// ============================================================================

const D_BACKDROP = 200;
const D_CARD = 300;
const D_CIRCLE = 400;
const D_CHECK = 300;
const D_TEXT = 300;
const D_EXIT = 400;

const DELAY_CARD = 100;
const DELAY_CIRCLE = 200;
const DELAY_CHECK = 600; // démarre 100ms avant la fin du cercle pour fluidité
const DELAY_GREETING = 900;
const DELAY_SUBTITLE = 1000; // stagger 100ms après le greeting

// ============================================================================
// Composant
// ============================================================================

export function LoginSuccessAnimation({
    firstName,
    greeting = 'Bienvenue',
    accentColor = '#E31837',
    totalDurationMs = 1500,
    onComplete,
}: LoginSuccessAnimationProps) {
    const checkRef = useRef<SVGPathElement | null>(null);
    const completedRef = useRef(false);

    // Mesure la longueur réelle du path checkmark pour avoir un draw parfait.
    // Sans cette mesure, on tombe sur ~50 (estimation), ce qui marche mais peut
    // laisser un sliver visible en fin de tracé selon l'arrondi du subpixel.
    useEffect(() => {
        if (!checkRef.current) return;
        const length = checkRef.current.getTotalLength();
        // Injection via CSS variable : le keyframe `checkDraw` la lit en var().
        checkRef.current.style.setProperty('--lsa-check-length', String(length));
        checkRef.current.style.strokeDasharray = String(length);
        checkRef.current.style.strokeDashoffset = String(length);
    }, []);

    // Filet de sécurité : si l'event animationend ne fire pas (tab background
    // agressif, prefers-reduced-motion, etc.), on déclenche onComplete par
    // setTimeout. Le ref completedRef garantit one-shot.
    useEffect(() => {
        const safetyDelay = totalDurationMs + D_EXIT + 200;
        const id = window.setTimeout(() => {
            if (!completedRef.current) {
                completedRef.current = true;
                onComplete();
            }
        }, safetyDelay);
        return () => window.clearTimeout(id);
    }, [totalDurationMs, onComplete]);

    const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
        if (e.animationName !== FADE_OUT_NAME) return;
        if (completedRef.current) return;
        completedRef.current = true;
        onComplete();
    };

    return (
        <Box
            role="status"
            aria-live="polite"
            onAnimationEnd={handleAnimationEnd}
            // CSS custom properties exposées sur la racine — un parent peut les
            // surcharger via inline style sans prop drilling. Voir docstring.
            style={
                {
                    '--lsa-accent': accentColor,
                    '--lsa-d-exit': `${D_EXIT}ms`,
                    '--lsa-delay-exit': `${totalDurationMs}ms`,
                } as CSSProperties
            }
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: (theme) => theme.zIndex.modal + 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // Backdrop glassmorphism dark (style Face ID / Apple Pay).
                background: 'rgba(10, 10, 12, 0.78)',
                backdropFilter: 'blur(28px) saturate(180%)',
                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                // Fade-in du backdrop puis fade-out déclenché en delay.
                animation: `
                    ${backdropIn} ${D_BACKDROP}ms cubic-bezier(0.22, 1, 0.36, 1) both,
                    ${fadeOut} var(--lsa-d-exit) cubic-bezier(0.22, 1, 0.36, 1) var(--lsa-delay-exit) both
                `,
                // Toute la sous-arborescence respecte prefers-reduced-motion.
                '@media (prefers-reduced-motion: reduce)': {
                    animation: `
                        ${backdropIn} 1ms linear both,
                        ${fadeOut} 200ms linear var(--lsa-delay-exit) both
                    `,
                    '& *': {
                        animationDuration: '1ms !important',
                        animationDelay: '0ms !important',
                    },
                },
            }}
        >
            {/* Card glass : conteneur central, légère élévation visuelle. */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2.5,
                    px: { xs: 4, sm: 6 },
                    py: { xs: 4, sm: 5 },
                    minWidth: { xs: 'auto', sm: 320 },
                    maxWidth: '90vw',
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.45)',
                    animation: `${cardIn} ${D_CARD}ms cubic-bezier(0.22, 1, 0.36, 1) ${DELAY_CARD}ms both`,
                    transformOrigin: 'center center',
                    willChange: 'transform, opacity',
                }}
            >
                {/* SVG cercle + checkmark — purement décoratif, masqué aux lecteurs d'écran. */}
                <Box
                    component="svg"
                    aria-hidden="true"
                    viewBox="0 0 80 80"
                    sx={{
                        width: 88,
                        height: 88,
                        overflow: 'visible',
                    }}
                >
                    {/* Cercle : tracé dans le sens horaire depuis 12h grâce à rotate(-90). */}
                    <Box
                        component="circle"
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        sx={{
                            stroke: 'var(--lsa-accent)',
                            strokeWidth: 3,
                            strokeLinecap: 'round',
                            strokeDasharray: 226,
                            strokeDashoffset: 226,
                            transform: 'rotate(-90deg)',
                            transformOrigin: '40px 40px',
                            animation: `${circleDraw} ${D_CIRCLE}ms cubic-bezier(0.22, 1, 0.36, 1) ${DELAY_CIRCLE}ms both`,
                            willChange: 'stroke-dashoffset',
                        }}
                    />
                    {/* Checkmark : la longueur réelle est mesurée en useEffect. */}
                    <Box
                        component="path"
                        ref={checkRef}
                        d="M25 41 L36 52 L56 30"
                        fill="none"
                        sx={{
                            stroke: 'var(--lsa-accent)',
                            strokeWidth: 3,
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            // strokeDasharray + strokeDashoffset injectés en JS au mount.
                            animation: `${checkDraw} ${D_CHECK}ms cubic-bezier(0.22, 1, 0.36, 1) ${DELAY_CHECK}ms both`,
                            willChange: 'stroke-dashoffset',
                        }}
                    />
                </Box>

                <Typography
                    component="div"
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '1.75rem' },
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                        color: 'rgba(255, 255, 255, 0.96)',
                        opacity: 0,
                        animation: `${textRise} ${D_TEXT}ms cubic-bezier(0.22, 1, 0.36, 1) ${DELAY_GREETING}ms both`,
                        willChange: 'transform, opacity',
                    }}
                >
                    {greeting}
                </Typography>

                {firstName && (
                    <Typography
                        component="div"
                        sx={{
                            fontSize: { xs: '0.95rem', sm: '1rem' },
                            fontWeight: 400,
                            color: 'rgba(255, 255, 255, 0.64)',
                            opacity: 0,
                            mt: -1,
                            animation: `${textRise} ${D_TEXT}ms cubic-bezier(0.22, 1, 0.36, 1) ${DELAY_SUBTITLE}ms both`,
                            willChange: 'transform, opacity',
                        }}
                    >
                        Bonjour, {firstName}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

/**
 * LoginSuccessAnimation — séquence d'accueil post-login « Prisme spectral ».
 * @module shared/ui/LoginSuccessAnimation
 *
 * Concept (hybride retenu après panel créatif) :
 *   Dans une chambre noire optique vivante (mesh-gradient sombre qui dérive +
 *   grain film statique), un rayon de lumière frappe un prisme de verre et se
 *   décompose en spectre. Ce spectre « écrit » le wordmark SPECTRE lettre par
 *   lettre : chaque glyphe s'allume dans une teinte spectrale puis refroidit
 *   instantanément vers le rouge de marque. Le tout est cadré par de fins
 *   corner-brackets (viseur), souligné d'une waveform/spectrogramme, signé d'un
 *   badge « Accès autorisé » et personnalisé par le prénom — avant de se
 *   condenser et fondre vers l'application.
 *
 * Direction : froid → chaud, dispersé → condensé, lumière → identité. Le rouge
 * de marque n'est jamais noyé : l'arc-en-ciel n'est qu'un transitoire qui
 * « accouche » du rouge final.
 *
 * Technique : 100% CSS/SVG/Emotion, GPU-only (transform / opacity / filter /
 * stroke-dashoffset / color). Zéro dépendance hors MUI/Emotion (déjà présents),
 * zéro animation de layout, zéro canvas/RAF. Tous les tracés SVG utilisent
 * `pathLength={1}` : le draw est parfait quelle que soit la longueur réelle, ce
 * qui évite tout `getTotalLength` et tout sliver de fin de tracé.
 *
 * Contrat de props et mécanique de fin INCHANGÉS (drop-in pour la page login) :
 *   onAnimationEnd filtré sur `fadeOut.name` + verrou `completedRef` + filet de
 *   sécurité `setTimeout` → `onComplete()` est garanti one-shot.
 *
 * Personnalisation par CSS custom properties (cf. --lsa-* dans le sx racine).
 * Respecte `prefers-reduced-motion` : on saute toute la chorégraphie et on
 * présente directement l'état final (wordmark rouge uni), fade-out conservé.
 */

import { useEffect, useRef, type CSSProperties } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { keyframes } from '@emotion/react';
import CEALogo from '@shared/assets/images/CEALogo.png';

// ============================================================================
// Identité du wordmark
// ============================================================================

const WORDMARK = 'SPECTRE';

// Spectre dans l'ordre physique de dispersion (violet → rouge). La dernière
// teinte est le rouge de marque : c'est le stop le plus saturé et l'état final
// de TOUTES les lettres. Une couleur de départ par glyphe → l'écriture du mot
// forme un dégradé qui balaie de gauche à droite puis se condense en rouge.
const SPECTRAL = ['#7C3AED', '#3B82F6', '#1FB6C9', '#22C55E', '#EAB308', '#FB923C', '#E31837'] as const;

// ============================================================================
// Keyframes (Emotion → noms uniques, aucune collision globale)
// ============================================================================

const backdropIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const fadeOut = keyframes`
    from { opacity: 1; }
    to   { opacity: 0; }
`;

// Léger zoom de sortie : la scène « part vers l'app » pendant le fondu.
const exitZoom = keyframes`
    from { transform: scale(1); }
    to   { transform: scale(1.02); }
`;

// Tracé progressif (rayon, raies de dispersion, brackets, arête prisme, waveform).
const drawStroke = keyframes`
    from { stroke-dashoffset: 1; }
    to   { stroke-dashoffset: 0; }
`;

// Flash bref du prisme à l'impact du rayon.
const prismFlash = keyframes`
    0%   { opacity: 0; }
    40%  { opacity: 0.9; }
    100% { opacity: 0; }
`;

// Apparition du prisme.
const prismIn = keyframes`
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 0.85; transform: scale(1); }
`;

// Cœur du concept : l'ignition d'une lettre. Démarre dans sa teinte spectrale
// (var --spc), pic de brillance blanc à mi-course, se résout en rouge de marque
// (var --lsa-accent). L'interpolation entre deux couleurs via custom properties
// est native.
const igniteLetter = keyframes`
    0% {
        opacity: 0;
        transform: translateY(14px) scale(0.94);
        filter: blur(8px);
        color: var(--spc);
        text-shadow: 0 0 0 transparent;
    }
    55% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.75);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
        color: var(--lsa-accent);
        text-shadow: none;
    }
`;

// Lueur de marque qui respire, une fois le mot écrit.
const breatheGlow = keyframes`
    0%, 100% { filter: drop-shadow(0 0 10px rgba(227, 24, 55, 0.35)); }
    50%      { filter: drop-shadow(0 0 24px rgba(227, 24, 55, 0.65)); }
`;

// Entrée par le bas (badge, séparateur de texte, prénom, logo).
const riseIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
`;

// Révélation horizontale par scaleX (séparateur) — pas d'animation de width.
const sweepX = keyframes`
    from { opacity: 0; transform: scaleX(0); }
    to   { opacity: 1; transform: scaleX(1); }
`;

// Entrée du logo CEA (accroche) : léger overshoot spring.
const logoIn = keyframes`
    from { opacity: 0; transform: scale(0.82) translateY(6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
`;

// Halo rouge respirant autour du logo, une fois posé.
const logoGlow = keyframes`
    0%, 100% { filter: drop-shadow(0 0 16px rgba(227, 24, 55, 0.45)); }
    50%      { filter: drop-shadow(0 0 36px rgba(227, 24, 55, 0.75)); }
`;

// Nom du fade-out de sortie : sert à filtrer l'event onAnimationEnd.
const FADE_OUT_NAME = fadeOut.name;

// ============================================================================
// Props (contrat inchangé)
// ============================================================================

export interface LoginSuccessAnimationProps {
    /** Personnalise la ligne d'accueil : "Bonjour, {firstName}". */
    firstName?: string;
    /** Texte d'accueil de repli si `firstName` absent. Défaut: "Bienvenue". */
    greeting?: string;
    /** Couleur de marque (état final du wordmark, badge, brackets, glow). */
    accentColor?: string;
    /**
     * Durée visible avant le fade-out (ms). Défaut 2600.
     * Le fade-out (~480ms) s'ajoute par-dessus → durée totale ≈ +480ms.
     * Le filet de sécurité onComplete se déclenche à totalDurationMs + 680ms.
     */
    totalDurationMs?: number;
    /** Appelé une fois le fade-out terminé. */
    onComplete: () => void;
}

// ============================================================================
// Séquencement (ms) — calé sur la timeline de la spec
// ============================================================================

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // = motionEasing.apple
const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // overshoot doux

const D_EXIT = 480;

const DELAY_LOGO = 120;
const D_LOGO = 560;
const DELAY_LOGO_GLOW = 720;

const DELAY_RAY = 200;
const D_RAY = 340;
const DELAY_PRISM = 180;
const D_PRISM = 320;
const DELAY_FLASH = 500;
const D_FLASH = 180;
const DELAY_FAN = 580;
const D_FAN = 380;
const FAN_STAGGER = 34;
const DELAY_BRACKETS = 640;
const D_BRACKETS = 520;

const DELAY_LETTERS = 760;
const D_LETTER = 560;
const LETTER_STAGGER = 90;

const DELAY_SEP = 1140;
const D_SEP = 420;
const DELAY_WAVE = 1140;
const D_WAVE = 660;
const D_RISE = 380;
const DELAY_NAME = 1820;
const DELAY_GLOW = 1980;

// ============================================================================
// Sous-composant : crochet d'angle (viseur HUD)
// ============================================================================

/** L-shape SVG tracé par stroke-dashoffset. `flip` miroir selon le coin. */
function CornerBracket({
    flipX,
    flipY,
    delay,
    ...pos
}: {
    flipX?: boolean;
    flipY?: boolean;
    delay: number;
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
}) {
    return (
        <Box
            component="svg"
            aria-hidden="true"
            viewBox="0 0 24 24"
            sx={{
                position: 'absolute',
                width: 22,
                height: 22,
                overflow: 'visible',
                transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
                ...pos,
            }}
        >
            <Box
                component="path"
                d="M1 13 L1 1 L13 1"
                fill="none"
                pathLength={1}
                sx={{
                    stroke: 'var(--lsa-accent)',
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    opacity: 0.55,
                    strokeDasharray: 1,
                    strokeDashoffset: 1,
                    animation: `${drawStroke} ${D_BRACKETS}ms ${EASE} ${delay}ms both`,
                    willChange: 'stroke-dashoffset',
                }}
            />
        </Box>
    );
}

// ============================================================================
// Composant principal
// ============================================================================

export function LoginSuccessAnimation({
    firstName,
    greeting = 'Bienvenue',
    accentColor = '#E31837',
    totalDurationMs = 2600,
    onComplete,
}: LoginSuccessAnimationProps) {
    const completedRef = useRef(false);

    // Filet de sécurité : si l'event animationend ne fire pas (onglet en arrière-
    // plan, reduced-motion, etc.), on déclenche onComplete par setTimeout.
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

    const welcomeLine = firstName ? `Bonjour, ${firstName}` : greeting;

    // Fond et couleur « encre » dérivés du thème courant (clair / sombre / crème)
    // → le décor neutre (rayon, prisme, prénom) reste lisible quel que soit le mode.
    const theme = useTheme();
    const bg = theme.palette.background.default;
    const ink = theme.palette.text.primary;

    return (
        <Box
            role="status"
            aria-live="polite"
            aria-label={`Connexion réussie. ${welcomeLine}.`}
            onAnimationEnd={handleAnimationEnd}
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
                display: 'grid',
                // Une seule cellule 1fr/1fr : tous les enfants se superposent en
                // grid-area 1/1, centrés et plein écran (pas de position:absolute).
                gridTemplateColumns: '1fr',
                gridTemplateRows: '1fr',
                placeItems: 'center',
                isolation: 'isolate',
                overflow: 'hidden',
                // Fond simple, uni, à la couleur du thème courant (opaque → l'app
                // derrière n'apparaît qu'au fondu de sortie).
                background: bg,
                animation: `
                    ${backdropIn} 220ms ${EASE} both,
                    ${fadeOut} var(--lsa-d-exit) ${EASE} var(--lsa-delay-exit) both
                `,
                // Reduced motion : on coupe la chorégraphie, on garde un fondu doux.
                '@media (prefers-reduced-motion: reduce)': {
                    animation: `
                        ${backdropIn} 1ms linear both,
                        ${fadeOut} 200ms linear var(--lsa-delay-exit) both
                    `,
                    '& *': {
                        animationDuration: '1ms !important',
                        animationDelay: '0ms !important',
                        animationIterationCount: '1 !important',
                    },
                },
            }}
        >
            {/* Colonne centrale (léger zoom de sortie). */}
            <Box
                sx={{
                    gridArea: '1 / 1',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    px: 4,
                    animation: `${exitZoom} ${D_EXIT}ms ${EASE} var(--lsa-delay-exit) both`,
                    willChange: 'transform',
                }}
            >
                {/* Logo CEA — accroche institutionnelle, affiché en grand. */}
                <Box
                    component="img"
                    src={CEALogo}
                    alt="CEA"
                    sx={{
                        width: { xs: 104, sm: 136 },
                        height: 'auto',
                        borderRadius: 2.5,
                        opacity: 0,
                        animation: `${logoIn} ${D_LOGO}ms ${EASE_SPRING} ${DELAY_LOGO}ms both, ${logoGlow} 3.4s ease-in-out ${DELAY_LOGO_GLOW}ms infinite`,
                        willChange: 'transform, opacity, filter',
                    }}
                />

                {/* L3+L4 — Scène optique : rayon → prisme → dispersion spectrale. */}
                <Box
                    component="svg"
                    aria-hidden="true"
                    viewBox="0 0 280 116"
                    sx={{ width: { xs: 220, sm: 280 }, height: 'auto', overflow: 'visible' }}
                >
                    <defs>
                        <linearGradient id="lsa-spectral-h" x1="0" y1="0" x2="1" y2="0">
                            {SPECTRAL.map((c, i) => (
                                <stop key={c} offset={`${(i / (SPECTRAL.length - 1)) * 100}%`} stopColor={c} />
                            ))}
                        </linearGradient>
                    </defs>

                    {/* Rayon incident (gauche → sommet du prisme). */}
                    <Box
                        component="line"
                        x1="6"
                        y1="30"
                        x2="128"
                        y2="44"
                        pathLength={1}
                        sx={{
                            stroke: ink,
                            strokeWidth: 2,
                            strokeLinecap: 'round',
                            strokeDasharray: 1,
                            strokeDashoffset: 1,
                            filter: `drop-shadow(0 0 6px ${alpha(ink, 0.45)})`,
                            animation: `${drawStroke} ${D_RAY}ms ${EASE} ${DELAY_RAY}ms both`,
                            willChange: 'stroke-dashoffset',
                        }}
                    />

                    {/* Prisme (triangle de verre). */}
                    <Box
                        component="polygon"
                        points="140,12 164,52 116,52"
                        sx={{
                            fill: alpha(ink, 0.05),
                            stroke: alpha(ink, 0.5),
                            strokeWidth: 1,
                            strokeLinejoin: 'round',
                            opacity: 0,
                            transformBox: 'fill-box',
                            transformOrigin: 'center',
                            animation: `${prismIn} ${D_PRISM}ms ${EASE} ${DELAY_PRISM}ms both`,
                        }}
                    />
                    {/* Flash d'impact (bref, une seule fois). */}
                    <Box
                        component="polygon"
                        points="140,12 164,52 116,52"
                        sx={{
                            fill: 'none',
                            stroke: ink,
                            strokeWidth: 2,
                            strokeLinejoin: 'round',
                            opacity: 0,
                            filter: `drop-shadow(0 0 8px ${alpha(ink, 0.7)})`,
                            animation: `${prismFlash} ${D_FLASH}ms ease-out ${DELAY_FLASH}ms both`,
                        }}
                    />

                    {/* Dispersion : éventail de raies spectrales (sommet → bas). */}
                    {SPECTRAL.map((c, i) => {
                        const mid = (SPECTRAL.length - 1) / 2;
                        const angle = (i - mid) * 8; // éventail ±24°
                        const apexX = 140;
                        const apexY = 52;
                        const len = 56;
                        const rad = ((angle + 90) * Math.PI) / 180; // 90° = vers le bas
                        const x2 = apexX + len * Math.cos(rad);
                        const y2 = apexY + len * Math.sin(rad);
                        return (
                            <Box
                                key={c}
                                component="line"
                                x1={apexX}
                                y1={apexY}
                                x2={x2}
                                y2={y2}
                                pathLength={1}
                                sx={{
                                    stroke: c,
                                    strokeWidth: 2.5,
                                    strokeLinecap: 'round',
                                    strokeDasharray: 1,
                                    strokeDashoffset: 1,
                                    opacity: 0.85,
                                    filter: `drop-shadow(0 0 5px ${c})`,
                                    animation: `${drawStroke} ${D_FAN}ms ${EASE} ${DELAY_FAN + i * FAN_STAGGER}ms both`,
                                    willChange: 'stroke-dashoffset',
                                }}
                            />
                        );
                    })}
                </Box>

                {/* L5+L6 — Wordmark SPECTRE + corner-brackets de cadrage. */}
                <Box sx={{ position: 'relative', px: 3, py: 1 }}>
                    <CornerBracket top={-2} left={-2} delay={DELAY_BRACKETS} />
                    <CornerBracket top={-2} right={-2} flipX delay={DELAY_BRACKETS + 60} />
                    <CornerBracket bottom={-2} left={-2} flipY delay={DELAY_BRACKETS + 120} />
                    <CornerBracket bottom={-2} right={-2} flipX flipY delay={DELAY_BRACKETS + 180} />

                    <Box
                        aria-label={WORDMARK}
                        role="img"
                        sx={{
                            display: 'flex',
                            // Lueur de marque qui respire après l'écriture.
                            animation: `${breatheGlow} 3.4s ease-in-out ${DELAY_GLOW}ms infinite`,
                            willChange: 'filter',
                        }}
                    >
                        {WORDMARK.split('').map((ch, i) => (
                            <Box
                                key={`${ch}-${i}`}
                                component="span"
                                aria-hidden="true"
                                style={
                                    {
                                        '--spc': SPECTRAL[i] ?? accentColor,
                                        '--lsa-delay': `${DELAY_LETTERS + i * LETTER_STAGGER}ms`,
                                    } as CSSProperties
                                }
                                sx={{
                                    display: 'inline-block',
                                    fontSize: { xs: '2.4rem', sm: '3.25rem' },
                                    fontWeight: 800,
                                    lineHeight: 1,
                                    letterSpacing: '0.15em',
                                    // décale le letter-spacing du dernier glyphe
                                    '&:last-of-type': { marginRight: '-0.15em' },
                                    color: 'var(--lsa-accent)',
                                    opacity: 0,
                                    animation: `${igniteLetter} ${D_LETTER}ms ${EASE} var(--lsa-delay) both`,
                                    willChange: 'transform, opacity, filter, color',
                                }}
                            >
                                {ch}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Séparateur dégradé (scaleX). */}
                <Box
                    aria-hidden="true"
                    sx={{
                        width: 180,
                        height: '1px',
                        background: `linear-gradient(90deg, transparent, ${accentColor}99, transparent)`,
                        transformOrigin: 'center',
                        opacity: 0,
                        animation: `${sweepX} ${D_SEP}ms ${EASE} ${DELAY_SEP}ms both`,
                    }}
                />

                {/* Waveform / spectrogramme (tracé spectral). */}
                <Box
                    component="svg"
                    aria-hidden="true"
                    viewBox="0 0 200 24"
                    sx={{ width: 200, height: 24, overflow: 'visible' }}
                >
                    <Box
                        component="path"
                        d="M0 12 L20 12 L28 4 L36 20 L44 8 L52 16 L60 12 L96 12 L104 6 L112 18 L120 12 L160 12 L168 9 L176 15 L184 12 L200 12"
                        fill="none"
                        pathLength={1}
                        sx={{
                            stroke: 'url(#lsa-spectral-h)',
                            strokeWidth: 1.6,
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeDasharray: 1,
                            strokeDashoffset: 1,
                            opacity: 0.85,
                            animation: `${drawStroke} ${D_WAVE}ms ${EASE} ${DELAY_WAVE}ms both`,
                            willChange: 'stroke-dashoffset',
                        }}
                    />
                </Box>

                {/* L7 — Ligne d'accueil personnalisée. */}
                <Typography
                    component="div"
                    sx={{
                        fontSize: { xs: '1rem', sm: '1.15rem' },
                        fontWeight: 400,
                        color: ink,
                        opacity: 0,
                        mt: 0.5,
                        animation: `${riseIn} ${D_RISE}ms ${EASE} ${DELAY_NAME}ms both`,
                    }}
                >
                    {welcomeLine}
                </Typography>
            </Box>
        </Box>
    );
}

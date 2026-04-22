/**
 * Splash Screen - Premium letter-by-letter SPECTRE reveal (~2s)
 * @module shared/ui
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { Box, keyframes } from '@mui/material';
import CEALogo from '@shared/assets/images/CEALogo.png';

const LETTERS = ['S', 'P', 'E', 'C', 'T', 'R', 'E'];
const BRAND_COLOR = '#E31837';

// ============================================================================
// Timeline (~2s total before fade-out)
// ============================================================================

const LOGO_ENTRANCE = 400; // CEA logo fades in
const LETTER_START = 500; // first letter appears at 500ms
const LETTER_STAGGER = 100; // gap between each letter
const LETTER_DURATION = 350; // each letter animation length
const LINE_DELAY = LETTER_START + LETTERS.length * LETTER_STAGGER + 50;
const HOLD = 300; // pause once everything is visible
const TOTAL_VISIBLE = LINE_DELAY + 300 + HOLD; // ~2s
const FADEOUT = 350;

// ============================================================================
// Keyframes
// ============================================================================

const logoEntrance = keyframes`
    0%   { opacity: 0; transform: scale(0.7); filter: blur(8px); }
    60%  { opacity: 1; transform: scale(1.03); filter: blur(0); }
    100% { opacity: 1; transform: scale(1);    filter: blur(0); }
`;

const letterIn = keyframes`
    0%   { opacity: 0; transform: translateY(24px) scale(0.4); filter: blur(6px); }
    40%  { opacity: 0.8; transform: translateY(-2px) scale(1.08); filter: blur(0); }
    70%  { transform: translateY(1px) scale(0.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
`;

const shimmer = keyframes`
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
`;

const lineGrow = keyframes`
    0%   { transform: scaleX(0); opacity: 0; }
    50%  { opacity: 1; }
    100% { transform: scaleX(1); opacity: 1; }
`;

const fadeOut = keyframes`
    0%   { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.04); }
`;

// ============================================================================
// Component
// ============================================================================

interface SplashScreenProps {
    onComplete: () => void;
}

export const SplashScreen = memo(function SplashScreen({ onComplete }: SplashScreenProps) {
    const [isFadingOut, setIsFadingOut] = useState(false);

    const handleComplete = useCallback(() => onComplete(), [onComplete]);

    useEffect(() => {
        const t1 = setTimeout(() => setIsFadingOut(true), TOTAL_VISIBLE);
        const t2 = setTimeout(handleComplete, TOTAL_VISIBLE + FADEOUT);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [handleComplete]);

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                animation: isFadingOut ? `${fadeOut} ${FADEOUT}ms ease-in forwards` : undefined,
            }}
        >
            {/* CEA Logo */}
            <Box
                component="img"
                src={CEALogo}
                alt="CEA"
                sx={{
                    width: 72,
                    height: 'auto',
                    borderRadius: 1,
                    mb: 3,
                    opacity: 0,
                    animation: `${logoEntrance} ${LOGO_ENTRANCE}ms` + ' cubic-bezier(0.22, 1, 0.36, 1) 200ms forwards',
                }}
            />

            {/* SPECTRE - letter by letter with shimmer */}
            <Box sx={{ display: 'flex', gap: '3px', mb: 2 }}>
                {LETTERS.map((letter, i) => (
                    <Box
                        key={i}
                        component="span"
                        sx={{
                            fontSize: '2.8rem',
                            fontWeight: 800,
                            letterSpacing: '0.15em',
                            lineHeight: 1,
                            // Shimmer gradient on the brand color
                            background: `linear-gradient(
                                90deg,
                                ${BRAND_COLOR} 0%,
                                ${BRAND_COLOR} 35%,
                                #ff4d5e 50%,
                                ${BRAND_COLOR} 65%,
                                ${BRAND_COLOR} 100%
                            )`,
                            backgroundSize: '200% 100%',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            opacity: 0,
                            animation:
                                [
                                    `${letterIn} ${LETTER_DURATION}ms`,
                                    `cubic-bezier(0.22, 1, 0.36, 1)`,
                                    `${LETTER_START + i * LETTER_STAGGER}ms forwards`,
                                ].join(' ') +
                                ', ' +
                                [
                                    `${shimmer} 2s ease-in-out`,
                                    `${LETTER_START + i * LETTER_STAGGER + LETTER_DURATION}ms 1`,
                                ].join(' '),
                        }}
                    >
                        {letter}
                    </Box>
                ))}
            </Box>

            {/* Accent line */}
            <Box
                sx={{
                    width: 180,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${BRAND_COLOR}, transparent)`,
                    borderRadius: 1,
                    transformOrigin: 'center',
                    transform: 'scaleX(0)',
                    opacity: 0,
                    animation: `${lineGrow} 500ms cubic-bezier(0.22, 1, 0.36, 1) ${LINE_DELAY}ms forwards`,
                }}
            />
        </Box>
    );
});

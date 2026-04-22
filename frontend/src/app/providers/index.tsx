/**
 * App Providers - Query Client, Theme, Router
 * @module app/providers
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme, OfflineBanner } from '@shared/ui';
import { useThemeStore } from '@shared/lib/theme.store';
import { queryClient } from '@shared/lib/query-client';
import { initApiClient } from '@shared/api';
import { useAuthStore } from '@features/auth';
import { ReactNode, useMemo } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/fr';

// Initialize API client with auth token provider (FSD-1 fix)
initApiClient({
    getAccessToken: () => useAuthStore.getState().getAccessToken(),
    refreshToken: () => useAuthStore.getState().refreshToken(),
    logout: () => useAuthStore.getState().logout(),
});

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const { mode } = useThemeStore();
    const theme = useMemo(() => createAppTheme(mode), [mode]);

    return (
        <QueryClientProvider client={queryClient}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <OfflineBanner />
                    {children}
                </ThemeProvider>
            </LocalizationProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

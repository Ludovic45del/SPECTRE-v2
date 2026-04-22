import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/fr';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';

dayjs.extend(isoWeek);
dayjs.locale('fr');

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

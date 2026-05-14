/**
 * MonthlyLineChart - line chart générique pour une série mensuelle.
 * @module pages/indicateurs/components
 */

import { memo, useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface MonthlyLineChartProps {
    title: string;
    /** Clés "YYYY-MM" → count. */
    series: Record<string, number>;
    color?: string;
    valueLabel?: string;
    height?: number;
}

const MONTH_LABELS_FR = [
    'Janv.',
    'Févr.',
    'Mars',
    'Avr.',
    'Mai',
    'Juin',
    'Juil.',
    'Août',
    'Sept.',
    'Oct.',
    'Nov.',
    'Déc.',
];

const MonthlyLineChart = memo(function MonthlyLineChart({
    title,
    series,
    color = '#5856D6',
    valueLabel = 'Valeur',
    height = 260,
}: MonthlyLineChartProps) {
    const data = useMemo(() => {
        const sortedKeys = Object.keys(series).sort();
        return sortedKeys.map((key) => {
            const [, month] = key.split('-');
            const monthIdx = Number(month) - 1;
            return {
                month: MONTH_LABELS_FR[monthIdx] ?? key,
                count: series[key] ?? 0,
            };
        });
    }, [series]);

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {title}
            </Typography>
            <Box sx={{ width: '100%', height }}>
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={11} />
                        <YAxis fontSize={11} allowDecimals={false} />
                        <Tooltip
                            formatter={(value) => [`${value}`, valueLabel]}
                            labelStyle={{ fontSize: 12 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
});

export default MonthlyLineChart;

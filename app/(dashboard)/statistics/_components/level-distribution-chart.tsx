'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts";

interface LevelDistributionChartProps {
    data: { level: string; count: number; correct: number }[];
}

// Kolory dla poziomów CEFR
const LEVEL_COLORS: Record<string, string> = {
    'A1': 'var(--level-a1)',
    'A2': 'var(--level-a2)',
    'B1': 'var(--level-b1)',
    'B2': 'var(--level-b2)',
    'C1': 'var(--level-c1)',
};

// Nazwy poziomów CEFR
const LEVEL_LABELS: Record<string, string> = {
    'A1': 'A1 - Początkujący',
    'A2': 'A2 - Podstawowy',
    'B1': 'B1 - Średniozaawansowany',
    'B2': 'B2 - Wyższyzaawansowany',
    'C1': 'C1 - Zaawansowany',
};

// Interfejs dla danych tooltipa Recharts
interface TooltipPayload {
    level: string;
    count: number;
    correct: number;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: TooltipPayload }>;
}

// Komponent tooltipa z lepszym pozycjonowaniem
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const accuracy = data.count > 0
        ? ((data.correct / data.count) * 100).toFixed(1)
        : 0;

    return (
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
                <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: LEVEL_COLORS[data.level] }}
                />
                <span className="font-semibold text-foreground">
                    {LEVEL_LABELS[data.level] || data.level}
                </span>
            </div>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Odpowiedzi:</span>
                    <span className="font-medium text-foreground">{data.count}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Poprawne:</span>
                    <span className="font-medium text-success">{data.correct}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Skuteczność:</span>
                    <span className="font-medium text-foreground">{accuracy}%</span>
                </div>
            </div>
        </div>
    );
};

export function LevelDistributionChart({ data }: LevelDistributionChartProps) {
    const hasData = data.some(d => d.count > 0);
    const totalCount = data.reduce((sum, d) => sum + d.count, 0);

    if (!hasData) {
        return (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                Brak danych w wybranym okresie
            </div>
        );
    }

    // Przygotuj dane z procentami
    const dataWithPercent = data.map(d => ({
        ...d,
        percent: totalCount > 0 ? ((d.count / totalCount) * 100).toFixed(1) : 0,
        accuracy: d.count > 0 ? ((d.correct / d.count) * 100).toFixed(0) : 0,
    }));

    return (
        <div className="space-y-4">
            <ResponsiveContainer width="100%" height={280}>
                <BarChart
                    data={dataWithPercent}
                    layout="vertical"
                    margin={{ top: 0, right: 80, bottom: 0, left: 0 }}
                >
                    <XAxis
                        type="number"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="level"
                        stroke="var(--muted-foreground)"
                        fontSize={14}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        tick={(props) => {
                            const { x, y, payload } = props;
                            return (
                                <g transform={`translate(${x},${y})`}>
                                    <text
                                        x={-8}
                                        y={0}
                                        dy={4}
                                        textAnchor="end"
                                        fill={LEVEL_COLORS[payload.value] || 'var(--muted-foreground)'}
                                        fontSize={14}
                                        fontWeight={600}
                                    >
                                        {payload.value}
                                    </text>
                                </g>
                            );
                        }}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'oklch(0.5 0.02 270 / 0.1)' }}
                        wrapperStyle={{ zIndex: 1000 }}
                    />
                    <Bar
                        dataKey="count"
                        radius={[0, 8, 8, 0]}
                        barSize={36}
                    >
                        {dataWithPercent.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={LEVEL_COLORS[entry.level] || '#888888'}
                            />
                        ))}
                        <LabelList
                            dataKey="count"
                            position="right"
                            fill="var(--foreground)"
                            fontSize={13}
                            fontWeight={500}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => Number(value) > 0 ? `${value}` : ''}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Legenda z dodatkowymi informacjami */}
            <div className="flex flex-wrap gap-3 justify-center border-t pt-4">
                {dataWithPercent.map((item) => (
                    <div
                        key={item.level}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50"
                    >
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: LEVEL_COLORS[item.level] }}
                        />
                        <span className="text-sm font-medium">{item.level}</span>
                        <span className="text-xs text-muted-foreground">
                            {item.count} ({item.percent}%)
                        </span>
                        {Number(item.accuracy) > 0 && (
                            <span className="text-xs text-success font-medium">
                                {item.accuracy}% ✓
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}


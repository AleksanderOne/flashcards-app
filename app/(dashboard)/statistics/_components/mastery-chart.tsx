'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface MasteryChartProps {
    data: { name: string; value: number; fill: string }[];
}

// Ikony dla każdego statusu
const STATUS_ICONS: Record<string, string> = {
    'Nowe': '✨',
    'W trakcie': '📚',
    'Opanowane': '🏆',
};

// Interfejs dla danych tooltipa Recharts
interface TooltipPayload {
    name: string;
    value: number;
    fill: string;
    percent: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: TooltipPayload }>;
}

// Komponent tooltipa
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 min-w-[160px]">
            <div className="flex items-center gap-2 mb-2">
                <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: data.fill }}
                />
                <span className="font-semibold text-foreground">
                    {STATUS_ICONS[data.name]} {data.name}
                </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
                {data.value} <span className="text-sm font-normal text-muted-foreground">słówek</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
                {data.percent}% całości
            </div>
        </div>
    );
};

export function MasteryChart({ data }: MasteryChartProps) {
    // Filter out zero values to avoid ugly empty charts or labels
    const activeData = data.filter(d => d.value > 0);
    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (activeData.length === 0) {
        return (
            <div className="flex h-[320px] items-center justify-center text-muted-foreground">
                Brak danych
            </div>
        )
    }

    // Dodaj procenty do danych
    const dataWithPercent = activeData.map(d => ({
        ...d,
        percent: total > 0 ? ((d.value / total) * 100).toFixed(1) : '0',
    }));

    return (
        <div className="space-y-4">
            <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={dataWithPercent}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="var(--background)"
                            strokeWidth={3}
                        >
                            {dataWithPercent.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={<CustomTooltip />}
                            wrapperStyle={{ zIndex: 1000 }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Środkowa etykieta */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-3xl font-bold">{total}</div>
                        <div className="text-xs text-muted-foreground">słówek</div>
                    </div>
                </div>
            </div>

            {/* Legenda */}
            <div className="flex flex-col gap-2 pt-2 border-t">
                {data.map((item) => (
                    <div
                        key={item.name}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-sm">
                                {STATUS_ICONS[item.name]} {item.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.value}</span>
                            {total > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    ({((item.value / total) * 100).toFixed(0)}%)
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface LearningModeChartProps {
    data: { mode: string; label: string; count: number; accuracy: number }[];
}

const MODE_COLORS = {
    'pl_to_en_text': 'var(--accent-violet)',
    'en_to_pl_text': 'var(--accent-fuchsia)',
    'pl_to_en_quiz': 'var(--accent-sky)',
    'en_to_pl_quiz': 'var(--accent-emerald)',
};

// Ikony dla trybów
const MODE_ICONS: Record<string, string> = {
    'pl_to_en_text': '🇵🇱→🇬🇧',
    'en_to_pl_text': '🇬🇧→🇵🇱',
    'pl_to_en_quiz': '🇵🇱→🇬🇧',
    'en_to_pl_quiz': '🇬🇧→🇵🇱',
};

// Komponent tooltipa
const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
                <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: MODE_COLORS[data.mode as keyof typeof MODE_COLORS] }}
                />
                <span className="font-semibold text-foreground text-sm">
                    {data.label}
                </span>
            </div>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Sesje:</span>
                    <span className="font-medium text-foreground">{data.count}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Skuteczność:</span>
                    <span className="font-medium text-success">{data.accuracy.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
};

export function LearningModeChart({ data }: LearningModeChartProps) {
    const activeData = data.filter(d => d.count > 0);
    const total = data.reduce((sum, d) => sum + d.count, 0);

    if (activeData.length === 0) {
        return (
            <div className="flex h-[320px] items-center justify-center text-muted-foreground">
                Brak danych w wybranym okresie
            </div>
        );
    }

    // Dodaj procenty
    const dataWithPercent = activeData.map(d => ({
        ...d,
        percent: total > 0 ? ((d.count / total) * 100).toFixed(1) : '0',
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
                            dataKey="count"
                            nameKey="label"
                            stroke="var(--background)"
                            strokeWidth={3}
                        >
                            {dataWithPercent.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={MODE_COLORS[entry.mode as keyof typeof MODE_COLORS] || 'var(--muted-foreground)'} 
                                />
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
                        <div className="text-xs text-muted-foreground">sesji</div>
                    </div>
                </div>
            </div>
            
            {/* Legenda */}
            <div className="flex flex-col gap-2 pt-2 border-t">
                {data.map((item) => {
                    const isQuiz = item.mode.includes('quiz');
                    return (
                        <div 
                            key={item.mode}
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: MODE_COLORS[item.mode as keyof typeof MODE_COLORS] }}
                                />
                                <span className="text-sm">
                                    {MODE_ICONS[item.mode]} {isQuiz ? 'Quiz' : 'Tekst'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-semibold">{item.count}</span>
                                {item.count > 0 && (
                                    <span className="text-xs text-success font-medium">
                                        {item.accuracy.toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


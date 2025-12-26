'use client';

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface AccuracyChartProps {
    data: { date: string; accuracy: number; total: number }[];
}

export function AccuracyChart({ data }: AccuracyChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Brak danych w wybranym okresie
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                />
                <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                />
                <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        borderColor: 'var(--border)', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        color: 'var(--foreground)'
                    }}
                    labelStyle={{ color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(1)}% (${props.payload.total} odpowiedzi)`,
                        'Skuteczność'
                    ]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                />
                <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--success)"
                    strokeWidth={2}
                    fill="url(#accuracyGradient)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}


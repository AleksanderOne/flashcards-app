'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ActivityChartProps {
    data: { date: string; count: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    if (data.length === 0 || data.every(d => d.count === 0)) {
        return (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Brak danych w wybranym okresie
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pl-PL', { weekday: 'short' })}
                />
                <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'oklch(0.5 0.02 270 / 0.2)' }}
                    contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        color: 'var(--foreground)'
                    }}
                    labelStyle={{ color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    formatter={(value: number | undefined) => [`${value ?? 0} odpowiedzi`, 'Aktywność']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                />
                <Bar
                    dataKey="count"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

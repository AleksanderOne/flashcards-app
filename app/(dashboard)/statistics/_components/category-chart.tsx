'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface CategoryChartProps {
    data: { category: string; count: number; accuracy: number }[];
}

// Paleta kolorów dla kategorii
const CATEGORY_COLORS = [
    'var(--accent-violet)',
    'var(--accent-fuchsia)',
    'var(--accent-pink)',
    'var(--accent-sky)',
    'var(--accent-emerald)',
    'var(--accent-amber)',
    'var(--accent-orange)',
    'var(--primary)',
];

export function CategoryChart({ data }: CategoryChartProps) {
    if (data.length === 0 || data.every(d => d.count === 0)) {
        return (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Brak danych w wybranym okresie
            </div>
        );
    }

    // Sortuj po liczbie i weź top 8
    const sortedData = [...data]
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sortedData} layout="vertical">
                <XAxis
                    type="number"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    type="category"
                    dataKey="category"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
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
                    formatter={(value: number, name: string, props: any) => [
                        `${value} odpowiedzi (${props.payload.accuracy.toFixed(1)}% poprawnych)`,
                        props.payload.category
                    ]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {sortedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}


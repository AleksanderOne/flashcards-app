'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface MasteryChartProps {
    data: { name: string; value: number; fill: string }[];
}

export function MasteryChart({ data }: MasteryChartProps) {
    // Filter out zero values to avoid ugly empty charts or labels
    const activeData = data.filter(d => d.value > 0);

    if (activeData.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Brak danych
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={activeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {activeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

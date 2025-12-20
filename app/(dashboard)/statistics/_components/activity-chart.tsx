'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface ActivityChartProps {
    data: { date: string; count: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pl-PL', { weekday: 'short' })}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar
                    dataKey="count"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

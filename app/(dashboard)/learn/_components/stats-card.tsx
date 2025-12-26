import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
    label: string;
    value: number | string;
    icon: string;
    subtext: string;
}

export function StatsCard({ label, value, icon, subtext }: StatsCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                        {label}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {value}
                        </h3>
                        <span className="text-sm text-muted-foreground">{subtext}</span>
                    </div>
                </div>
                <div className="text-4xl">{icon}</div>
            </CardContent>
        </Card>
    );
}

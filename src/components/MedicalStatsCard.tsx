import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalStatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color?: "blue" | "green" | "orange" | "purple";
    trend?: "up" | "down" | "neutral";
}

const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    green: "bg-green-500/10 text-green-600 border-green-500/20",
    orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export function MedicalStatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "blue",
    trend = "neutral"
}: MedicalStatsCardProps) {
    return (
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
                    <h3 className="text-3xl font-bold mb-1">{value}</h3>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
                <div className={cn(
                    "p-3 rounded-xl border",
                    colorClasses[color]
                )}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </Card>
    );
}

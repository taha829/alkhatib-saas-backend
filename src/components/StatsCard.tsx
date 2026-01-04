import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down";
}

export const StatsCard = ({ title, value, change, icon: Icon, trend }: StatsCardProps) => {
  return (
    <Card className="p-6 gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-elevated animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <span className={`text-sm font-medium ${trend === "up" ? "text-success" : "text-destructive"}`}>
          {change}
        </span>
      </div>
      <h3 className="text-muted-foreground text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold font-display">{value}</p>
    </Card>
  );
};

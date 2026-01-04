import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Eye, Settings } from "lucide-react";

interface GroupCardProps {
  name: string;
  platform: string;
  members: string;
  newPosts: number;
  status: "active" | "paused";
}

export const GroupCard = ({ name, platform, members, newPosts, status }: GroupCardProps) => {
  return (
    <Card className="p-6 gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-elevated">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl gradient-primary">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">{name}</h3>
            <p className="text-sm text-muted-foreground">{platform}</p>
          </div>
        </div>
        <Badge variant={status === "active" ? "default" : "secondary"} className="capitalize">
          {status === "active" ? "نشط" : "متوقف"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{members} عضو</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="text-sm text-success">{newPosts} منشور جديد</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="default" className="flex-1" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          عرض المنشورات
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Clock, ExternalLink } from "lucide-react";

interface PostCardProps {
  groupName: string;
  content: string;
  timeAgo: string;
  comments: number;
  extractedContacts: number;
  platform: string;
}

export const PostCard = ({ groupName, content, timeAgo, comments, extractedContacts, platform }: PostCardProps) => {
  return (
    <Card className="p-6 gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 shadow-card animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {platform}
            </Badge>
            <span className="text-sm font-medium">{groupName}</span>
          </div>
          <p className="text-foreground/90 line-clamp-2">{content}</p>
        </div>
        <Button variant="ghost" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{timeAgo}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          <span>{comments} تعليق</span>
        </div>
        {extractedContacts > 0 && (
          <div className="flex items-center gap-1 text-success">
            <Users className="h-4 w-4" />
            <span>{extractedContacts} جهة اتصال</span>
          </div>
        )}
      </div>

      <Button className="w-full gradient-primary" size="sm">
        عرض التفاصيل واستخراج البيانات
      </Button>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContacts } from "@/hooks/useContacts";
import { 
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Send,
  MessageCircle,
  Camera,
  Globe
} from "lucide-react";

const platformConfig: Record<string, { icon: any; name: string; color: string; bg: string }> = {
  facebook: { icon: Facebook, name: 'فيسبوك', color: 'text-blue-600', bg: 'bg-blue-600/10' },
  instagram: { icon: Instagram, name: 'انستغرام', color: 'text-pink-600', bg: 'bg-pink-600/10' },
  twitter: { icon: Twitter, name: 'تويتر', color: 'text-sky-500', bg: 'bg-sky-500/10' },
  linkedin: { icon: Linkedin, name: 'لينكد إن', color: 'text-blue-700', bg: 'bg-blue-700/10' },
  tiktok: { icon: Camera, name: 'تيك توك', color: 'text-foreground', bg: 'bg-foreground/10' },
  youtube: { icon: Youtube, name: 'يوتيوب', color: 'text-red-600', bg: 'bg-red-600/10' },
  telegram: { icon: Send, name: 'تيليجرام', color: 'text-sky-500', bg: 'bg-sky-500/10' },
  whatsapp: { icon: MessageCircle, name: 'واتساب', color: 'text-green-600', bg: 'bg-green-600/10' },
};

const PlatformStats = () => {
  const { contacts } = useContacts();

  // Count contacts by platform
  const platformCounts = contacts.reduce((acc, contact) => {
    const platform = contact.platform || 'other';
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedPlatforms = Object.entries(platformCounts)
    .sort(([, a], [, b]) => b - a);

  if (sortedPlatforms.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">إحصائيات المنصات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedPlatforms.map(([platform, count]) => {
            const config = platformConfig[platform] || {
              icon: Globe,
              name: platform,
              color: 'text-muted-foreground',
              bg: 'bg-muted',
            };
            const Icon = config.icon;
            const percentage = Math.round((count / contacts.length) * 100);

            return (
              <div key={platform} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{config.name}</span>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${config.bg.replace('/10', '')} opacity-50`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformStats;

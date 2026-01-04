import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, User, MessageCircle, Copy, CheckCircle, Clock, Star, Trash2, MoreHorizontal, ExternalLink, Facebook, Users } from "lucide-react";
import { toastWithSound } from '@/lib/toast-with-sound';
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTemplates } from "@/hooks/useTemplates";

interface ContactCardProps {
  id: string;
  name: string;
  phone?: string;
  source: string;
  platform: string;
  extractedFrom: string;
  status?: string;
  email?: string;
  job_title?: string;
  location?: string;
  profile_url?: string;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onOpenChat?: (phone: string, name?: string) => void;
}

export const ContactCard = ({ id, name, phone, source, platform, extractedFrom, status = 'new', email, job_title, location, profile_url, onDelete, onUpdateStatus, onOpenChat }: ContactCardProps) => {
  const { templates } = useTemplates();
  const hasPhone = phone && phone.length > 3;

  const copyToClipboard = () => {
    if (hasPhone) {
      navigator.clipboard.writeText(phone);
      toastWithSound.success("تم نسخ رقم الهاتف");
    }
  };

  const statusConfig: any = {
    new: { label: 'جديد', color: 'bg-blue-500/10 text-blue-500', icon: Clock },
    contacted: { label: 'تم التواصل', color: 'bg-amber-500/10 text-amber-500', icon: MessageCircle },
    interested: { label: 'مهتم جداً', color: 'bg-green-500/10 text-green-500', icon: Star },
  };

  return (
    <Card className={cn(
      "p-5 border-border/50 transition-all duration-300 shadow-card hover:shadow-elevated relative overflow-hidden group flex flex-col min-h-[320px]",
      status === 'interested' ? "border-green-500/30 bg-green-500/5" : "bg-card"
    )}>
      {/* Platform background accent */}
      <div className={cn(
        "absolute top-0 right-0 w-1 h-full",
        platform?.toLowerCase() === 'facebook' ? 'bg-blue-600' :
          platform?.toLowerCase() === 'whatsapp' ? 'bg-green-600' : 'bg-primary'
      )} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-foreground leading-none mb-1">{name || 'عميل محتمل'}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/20 text-primary">
                {platform}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-muted/20 border border-border/50">
        <Phone className="h-4 w-4 text-success" />
        {hasPhone ? (
          <>
            <span className="font-mono font-bold flex-1 text-center text-sm" dir="ltr">{phone}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" onClick={copyToClipboard}>
              <Copy className="h-3.5 w-3.5 text-primary" />
            </Button>
          </>
        ) : (
          <span className="flex-1 text-center text-sm text-muted-foreground">لا يوجد رقم هاتف</span>
        )}
      </div>

      {/* CRM Status Toggle */}
      <div className="flex bg-muted/30 p-1 rounded-lg gap-1 mb-4">
        {Object.keys(statusConfig).map((s) => (
          <button
            key={s}
            onClick={() => onUpdateStatus(id, s)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-all",
              status === s
                ? "bg-card text-foreground shadow-sm scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            {s === 'new' && <Clock className="h-3 w-3" />}
            {s === 'contacted' && <MessageCircle className="h-3 w-3" />}
            {s === 'interested' && <Star className="h-3 w-3" />}
            {statusConfig[s].label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        {hasPhone && (
          <div className="flex flex-1 gap-0.5">
            <Button
              className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm h-9 rounded-l-none"
              size="sm"
              onClick={() => {
                if (onOpenChat) {
                  onOpenChat(phone, name);
                } else {
                  window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                }
              }}
            >
              <MessageCircle className="h-4 w-4" />
              واتساب
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="w-8 shrink-0 bg-[#25D366] hover:bg-[#20ba59] text-white h-9 p-0 rounded-r-none border-l border-white/20" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 bg-card border-border shadow-elevated" align="end">
                <p className="text-xs font-semibold px-2 mb-2 text-muted-foreground text-right">اختر رسالة جاهزة</p>
                <div className="space-y-1">
                  {templates.map(t => (
                    <Button key={t.id} variant="ghost" size="sm" className="w-full justify-start text-right font-normal h-auto py-2" onClick={() => {
                      const text = encodeURIComponent(t.response);
                      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`, '_blank')
                    }}>
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="font-bold text-primary text-xs">{t.trigger}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-2 w-full text-right">{t.response}</span>
                      </div>
                    </Button>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-[10px] text-center text-muted-foreground py-2">لا توجد قوالب محفوظة</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
        {hasPhone && (
          <Button
            variant="outline"
            className="flex-1 gap-2 border-primary/20 hover:bg-primary/5 h-9"
            size="sm"
            onClick={() => window.location.href = `tel:${phone}`}
          >
            <Phone className="h-4 w-4 text-primary" />
            اتصال
          </Button>
        )}
        {profile_url && (
          <Button
            variant="outline"
            className={cn(
              "gap-2 border-blue-500/20 hover:bg-blue-500/5 h-9",
              hasPhone ? "flex-1" : "w-full"
            )}
            size="sm"
            onClick={() => window.open(profile_url, '_blank')}
            title="افتح البروفايل وأرسل رسالة من هناك"
          >
            <Facebook className="h-4 w-4 text-blue-600 fill-blue-600/10" />
            {hasPhone ? "" : "فتح الفيسبوك للمراسلة"}
          </Button>
        )}
      </div>

      {/* Enriched Data Section */}
      {(email || job_title || location) && (
        <div className="mb-4 pt-3 border-t border-border/50 space-y-2">
          {email && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="font-semibold w-12">البريد:</span>
              <span className="truncate">{email}</span>
            </div>
          )}
          {job_title && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="font-semibold w-12">الوظيفة:</span>
              <span className="truncate">{job_title}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="font-semibold w-12">الموقع:</span>
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      )}

      <div className="text-[10px] text-muted-foreground flex justify-between items-center opacity-80 italic border-t border-border/30 pt-2 mt-auto">
        <span>مستخرج من: <span className="text-primary not-italic font-bold">{source}</span> {extractedFrom && `— ${extractedFrom}`}</span>
      </div>
    </Card>
  );
};

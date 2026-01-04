import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, Briefcase, MessageSquare, Trash2, User, ChevronRight, ChevronLeft, Clock, Target, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toastWithSound } from '@/lib/toast-with-sound';

interface CRMCardProps {
    contact: any;
    onDelete?: (id: string) => void;
    onUpdateStatus?: (id: string, newStatus: string) => void;
    onOpenChat?: (phone: string, name?: string) => void;
}

const STATUS_OPTS = [
    { id: 'new', label: 'جديد', color: '#3b82f6', icon: Clock },
    { id: 'interested', label: 'مهتم', color: '#eab308', icon: Target },
    { id: 'customer', label: 'زبون', color: '#22c55e', icon: CheckCircle },
    { id: 'junk', label: 'مهمل', color: '#ef4444', icon: XCircle },
];

export function CRMCard({ contact, onDelete, onUpdateStatus, onOpenChat }: CRMCardProps) {
    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onOpenChat) {
            onOpenChat(contact.phone, contact.name);
        } else {
            let phone = contact.phone.replace(/\D/g, '');
            if (phone.startsWith('0')) phone = '962' + phone.substring(1);
            if (!phone.startsWith('962') && phone.length === 9) phone = '962' + phone;
            window.open(`https://wa.me/${phone}`, '_blank');
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete(contact.id.toString());
    };

    return (
        <div className="group relative">
            <Card
                className={cn(
                    "p-3 mb-3 transition-all duration-300 border-r-4 hover:shadow-xl group-hover:translate-y-[-2px]",
                    "bg-card/40 backdrop-blur-md border border-border/40 shadow-sm",
                )}
                style={{ borderRightColor: getStatusColor(contact.status) }}
            >
                {/* Platform Badge */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <h4 className="font-bold text-sm text-foreground/90 group-hover:text-primary transition-colors truncate max-w-[140px]">
                            {(!contact.name || contact.name.toLowerCase() === 'unknown' || contact.name === 'غير معروف') ? 'عميل جديد' : contact.name}
                        </h4>
                    </div>
                    {contact.platform && contact.platform.toLowerCase() !== 'unknown' && contact.platform.toLowerCase() !== 'manual import' && (
                        <Badge
                            className={cn(
                                "text-[9px] px-1.5 py-0 h-4 border-none font-bold uppercase",
                                getPlatformColor(contact.platform)
                            )}
                        >
                            {contact.platform}
                        </Badge>
                    )}
                </div>

                {/* Details Section */}
                <div className="space-y-2">
                    <div
                        className="flex items-center justify-between bg-primary/5 p-2 rounded-lg border border-primary/10 group/phone cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(contact.phone);
                            toastWithSound.success("تم نسخ الرقم بنجاح");
                        }}
                        title="اضغط لنسخ الرقم"
                    >
                        <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            <span dir="ltr" className="font-bold text-sm tracking-tight text-foreground/90">{contact.phone}</span>
                        </div>
                        <Badge variant="outline" className="h-4 px-1 text-[8px] opacity-0 group-hover/phone:opacity-100 transition-opacity">نسخ</Badge>
                    </div>

                    {contact.job_title && (
                        <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                            <Briefcase className="h-3 w-3 opacity-70" />
                            <span className="truncate">{contact.job_title}</span>
                        </div>
                    )}

                    {contact.location && (
                        <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3 opacity-70" />
                            <span className="truncate">{contact.location}</span>
                        </div>
                    )}
                </div>

                {/* Status Switcher - Showing all with highlight */}
                <div className="mt-3 pt-3 border-t border-border/20">
                    <p className="text-[9px] font-bold text-muted-foreground mb-2 text-right">الحالة الحالية وتحويلها:</p>
                    <div className="flex flex-wrap gap-1">
                        {STATUS_OPTS.map(s => (
                            <Button
                                key={s.id}
                                variant={contact.status === s.id ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                    "h-7 px-2 flex-1 min-w-[60px] text-[9px] gap-1 transition-all duration-300",
                                    contact.status === s.id ? "shadow-md scale-[1.05]" : "hover:bg-muted border-dashed opacity-70"
                                )}
                                onClick={() => onUpdateStatus?.(contact.id.toString(), s.id)}
                            >
                                <s.icon className={cn("h-3 w-3", contact.status === s.id ? "text-white" : "")} style={contact.status !== s.id ? { color: s.color } : {}} />
                                {s.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons - Always Visible */}
                <div className="mt-3 pt-3 border-t border-border/10 flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white shadow-sm border border-green-500/20"
                            onClick={handleWhatsApp}
                            title="مراسلة عبر واتساب"
                        >
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white shadow-sm border border-red-500/20"
                            onClick={handleDelete}
                            title="حذف العميل"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-muted-foreground opacity-60">تاريخ الإضافة</span>
                        <span className="text-[9px] italic font-medium">
                            {contact.created_at ? new Date(contact.created_at).toLocaleDateString('ar-EG') : ''}
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'new': return '#3b82f6';
        case 'interested': return '#eab308';
        case 'customer': return '#22c55e';
        case 'junk': return '#ef4444';
        default: return '#9ca3af';
    }
}

function getPlatformColor(platform: string = '') {
    const p = platform.toLowerCase();
    if (p.includes('facebook')) return 'bg-blue-600 text-white shadow-blue-500/20';
    if (p.includes('whatsapp')) return 'bg-green-600 text-white shadow-green-500/20';
    if (p.includes('google')) return 'bg-emerald-600 text-white shadow-emerald-500/20';
    if (p.includes('instagram')) return 'bg-pink-600 text-white shadow-pink-500/20';
    return 'bg-secondary text-secondary-foreground';
}

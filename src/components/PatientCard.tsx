import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, User, MessageCircle, Copy, Calendar, FileText, Trash2, Activity, Droplet, AlertTriangle } from "lucide-react";
import { toastWithSound } from '@/lib/toast-with-sound';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PatientCardProps {
    id: string;
    name: string;
    phone?: string;
    status?: string;
    last_visit?: string;
    medical_notes?: string;
    blood_type?: string;
    allergies?: string;
    chronic_diseases?: string;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: string) => void;
    onOpenChat?: (phone: string, name?: string) => void;
    onBookAppointment?: (phone: string, name: string) => void;
    total_appointments?: number;
    last_diagnosis?: string;
}

export const PatientCard = ({
    id, name, phone, status = 'new',
    last_visit, medical_notes, blood_type, allergies, chronic_diseases,
    total_appointments, last_diagnosis,
    onDelete, onUpdateStatus, onOpenChat, onBookAppointment
}: PatientCardProps) => {
    const hasPhone = phone && phone.length > 3;

    const copyToClipboard = () => {
        if (hasPhone) {
            navigator.clipboard.writeText(phone);
            toastWithSound.success("تم نسخ رقم الهاتف");
        }
    };

    const statusConfig: any = {
        new: { label: 'جديد', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        active: { label: 'نشط', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
        inactive: { label: 'غير نشط', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
    };

    return (
        <Card className={cn(
            "p-5 border-border/50 transition-all duration-300 shadow-card hover:shadow-elevated relative overflow-hidden group flex flex-col",
            status === 'active' ? "border-green-500/30 bg-green-500/5" : "bg-card"
        )}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground leading-none mb-1">{name || 'مريض'}</h4>
                        <Badge variant="outline" className={cn("text-[10px] py-0 h-5", statusConfig[status]?.color)}>
                            {statusConfig[status]?.label}
                        </Badge>
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

            {/* Phone */}
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

            {/* Medical Info */}
            <div className="space-y-2 mb-4">
                {last_visit && (
                    <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/20">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">آخر زيارة:</span>
                        <span className="font-medium">{format(new Date(last_visit), 'dd/MM/yyyy', { locale: ar })}</span>
                    </div>
                )}

                {blood_type && (
                    <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                        <Droplet className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-muted-foreground">فصيلة الدم:</span>
                        <span className="font-bold text-red-600">{blood_type}</span>
                    </div>
                )}

                {allergies && (
                    <div className="flex items-start gap-2 text-xs p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                            <span className="text-muted-foreground">حساسية:</span>
                            <p className="font-medium text-orange-700 mt-0.5">{allergies}</p>
                        </div>
                    </div>
                )}

                {chronic_diseases && (
                    <div className="flex items-start gap-2 text-xs p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <Activity className="h-3.5 w-3.5 text-purple-500 mt-0.5" />
                        <div className="flex-1">
                            <span className="text-muted-foreground">أمراض مزمنة:</span>
                            <p className="font-medium text-purple-700 mt-0.5">{chronic_diseases}</p>
                        </div>
                    </div>
                )}

                {medical_notes && (
                    <div className="flex items-start gap-2 text-xs p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <FileText className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                            <span className="text-muted-foreground">ملاحظات طبية:</span>
                            <p className="font-medium text-blue-700 mt-0.5 line-clamp-2">{medical_notes}</p>
                        </div>
                    </div>
                )}

                {last_diagnosis && (
                    <div className="flex items-start gap-2 text-xs p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                        <Activity className="h-3.5 w-3.5 text-indigo-500 mt-0.5" />
                        <div className="flex-1">
                            <span className="text-muted-foreground">آخر تشخيص:</span>
                            <p className="font-medium text-indigo-700 mt-0.5 line-clamp-1">{last_diagnosis}</p>
                        </div>
                    </div>
                )}

                {total_appointments !== undefined && total_appointments > 0 && (
                    <div className="flex items-center justify-between text-[10px] px-2 py-1 bg-primary/5 rounded-full border border-primary/10">
                        <span className="text-muted-foreground">عدد الزيارات:</span>
                        <span className="font-black text-primary">{total_appointments}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto pt-3 border-t border-border/50">
                {hasPhone && (
                    <Button
                        className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm h-9"
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
                        محادثة
                    </Button>
                )}
                {hasPhone && onBookAppointment && (
                    <Button
                        variant="outline"
                        className="flex-1 gap-2 border-primary/20 hover:bg-primary/5 h-9"
                        size="sm"
                        onClick={() => onBookAppointment(phone, name)}
                    >
                        <Calendar className="h-4 w-4 text-primary" />
                        حجز موعد
                    </Button>
                )}
            </div>

            {/* Status Toggle */}
            <div className="flex bg-muted/30 p-1 rounded-lg gap-1 mt-3">
                {Object.keys(statusConfig).map((s) => (
                    <button
                        key={s}
                        onClick={() => onUpdateStatus(id, s)}
                        className={cn(
                            "flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all",
                            status === s
                                ? "bg-card text-foreground shadow-sm scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                        )}
                    >
                        {statusConfig[s].label}
                    </button>
                ))}
            </div>
        </Card>
    );
};

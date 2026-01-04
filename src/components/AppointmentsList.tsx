
import { useState, useEffect } from 'react';
import { appointmentsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    User,
    MessageSquare,
    Trash2,
    MoreVertical,
    CheckCircle,
    Loader2,
    CalendarCheck
} from 'lucide-react';
import { toastWithSound } from '@/lib/toast-with-sound';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CompleteAppointmentDialog from './CompleteAppointmentDialog';

interface AppointmentsListProps {
    onOpenChat: (phone: string) => void;
}

export default function AppointmentsList({ onOpenChat }: AppointmentsListProps) {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [selectedApt, setSelectedApt] = useState<any>(null);
    const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

    const fetchAppointments = async () => {
        try {
            const data = await appointmentsApi.getAll();
            setAppointments(data);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            toastWithSound.error('فشل تحميل المواعيد');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;

        setActionLoading(id);
        try {
            await appointmentsApi.delete(id);
            toastWithSound.success('تم حذف الموعد بنجاح');
            setAppointments(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            toastWithSound.error('فشل في حذف الموعد');
        } finally {
            setActionLoading(null);
        }
    };

    const handleStatusUpdate = async (id: number, status: string, appointment?: any) => {
        if (status === 'completed') {
            setSelectedApt(appointment);
            setIsCompleteDialogOpen(true);
            return;
        }

        setActionLoading(id);
        try {
            await appointmentsApi.update(id, { status });
            toastWithSound.success('تم تحديث حالة الموعد');
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        } catch (error) {
            toastWithSound.error('فشل في تحديث الحالة');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 px-3 py-1 font-bold">مؤكد</Badge>;
            case 'completed':
                return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 px-3 py-1 font-bold">منجز</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 px-3 py-1 font-bold">ملغى</Badge>;
            default:
                return <Badge variant="outline" className="px-3 py-1">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                <p className="text-muted-foreground font-medium">جاري تحميل جدول المواعيد...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-display font-black tracking-tight flex items-center gap-3">
                        جدول المواعيد
                        <CalendarCheck className="h-8 w-8 text-primary" />
                    </h2>
                    <p className="text-muted-foreground text-lg">إدارة الحجوزات التي تم تأكيدها عبر المساعد الذكي.</p>
                </div>
                <div className="bg-card/50 backdrop-blur-md border border-border/50 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3 animate-slide-in-right">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">إجمالي الحجوزات</p>
                        <p className="text-xl font-black text-foreground leading-none">{appointments.length} موعد مسجل</p>
                    </div>
                </div>
            </div>

            {/* List/Table Container */}
            <Card className="border-none shadow-2xl bg-muted/20 overflow-hidden rounded-3xl">
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full text-right" dir="rtl">
                            <thead>
                                <tr className="bg-card/80 backdrop-blur-md border-b border-border/50">
                                    <th className="px-6 py-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">العميل</th>
                                    <th className="px-6 py-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">رقم الهاتف</th>
                                    <th className="px-6 py-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">التاريخ والوقت</th>
                                    <th className="px-6 py-5 font-bold text-muted-foreground text-sm uppercase tracking-wider text-center">الحالة</th>
                                    <th className="px-6 py-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">ملاحظات</th>
                                    <th className="px-6 py-5 font-bold text-muted-foreground text-sm uppercase tracking-wider text-left">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-24 text-center">
                                            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                                    <Calendar className="h-24 w-24 text-primary relative z-10 opacity-80" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-2xl font-black text-foreground">لا توجد مواعيد حالياً</p>
                                                    <p className="text-muted-foreground max-w-sm mx-auto">سيظهر هنا المواعيد التي يتم تأكيدها آلياً عبر المساعد الذكي أو التي تضيفها يدوياً.</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="rounded-full px-8 border-primary/20 hover:bg-primary/5 font-bold"
                                                    onClick={() => fetchAppointments()}
                                                >
                                                    تحديث البيانات
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((apt) => (
                                        <tr key={apt.id} className="group hover:bg-card/40 transition-all duration-300">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                        <User className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-foreground">
                                                            {apt.chat_name || apt.customer_name || 'عميل الخطيب'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 group-hover:text-primary transition-colors font-display text-sm tracking-wide" dir="ltr">
                                                    {(apt.chat_phone || apt.phone || '').split('@')[0]}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 font-bold text-sm">
                                                        <Calendar className="h-4 w-4 text-primary opacity-70" />
                                                        {(() => {
                                                            try {
                                                                const d = new Date(apt.appointment_date);
                                                                return isNaN(d.getTime()) ? 'No Date' : format(d, 'EEEE dd MMMM yyyy', { locale: ar });
                                                            } catch (e) { return 'No Date'; }
                                                        })()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {(() => {
                                                            try {
                                                                const d = new Date(apt.appointment_date);
                                                                return isNaN(d.getTime()) ? '--:--' : format(d, 'hh:mm a');
                                                            } catch (e) { return '--:--'; }
                                                        })()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {getStatusBadge(apt.status)}
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px] line-clamp-2 italic">
                                                    {apt.notes || 'تم الحجز تلقائياً عبر المساعد الذكي'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl hover:bg-green-500/10 hover:text-green-500 text-muted-foreground transition-all active:scale-90"
                                                        onClick={() => onOpenChat(apt.phone)}
                                                        title="رد سريع واتساب"
                                                    >
                                                        <MessageSquare className="h-5 w-5" />
                                                    </Button>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
                                                                disabled={actionLoading === apt.id}
                                                            >
                                                                {actionLoading === apt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-5 w-5" />}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start" className="w-40 rounded-xl border-border/50">
                                                            <DropdownMenuItem className="gap-2 focus:bg-green-500/10 focus:text-green-600 font-bold" onClick={() => handleStatusUpdate(apt.id, 'confirmed')}>
                                                                <CheckCircle className="h-4 w-4" /> تأكيد الموعد
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 focus:bg-blue-500/10 focus:text-blue-600 font-bold" onClick={() => handleStatusUpdate(apt.id, 'completed', apt)}>
                                                                <CheckCircle2 className="h-4 w-4" /> تم الإنجاز
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 focus:bg-red-500/10 focus:text-red-600 font-bold" onClick={() => handleStatusUpdate(apt.id, 'cancelled')}>
                                                                <XCircle className="h-4 w-4" /> إلغاء الموعد
                                                            </DropdownMenuItem>
                                                            <div className="h-px bg-border my-1" />
                                                            <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive font-bold" onClick={() => handleDelete(apt.id)}>
                                                                <Trash2 className="h-4 w-4" /> حذف الحجز
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <CompleteAppointmentDialog
                isOpen={isCompleteDialogOpen}
                onClose={() => {
                    setIsCompleteDialogOpen(false);
                    setSelectedApt(null);
                }}
                appointment={selectedApt}
                onSuccess={() => {
                    fetchAppointments();
                }}
            />
        </div>
    );
}


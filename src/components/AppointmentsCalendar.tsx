import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, FileText, Plus, Filter, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toastWithSound } from '@/lib/toast-with-sound';
import { appointmentsApi, dataApi } from '@/lib/api';
import AddAppointmentDialog from './AddAppointmentDialog';
import CompleteAppointmentDialog from './CompleteAppointmentDialog';

interface Appointment {
    id: number;
    patient_name: string;
    customer_name?: string;
    phone: string;
    appointment_date: string;
    duration: number;
    appointment_type: string;
    status: string;
    notes: string;
    doctor_name?: string;
}

const statusConfig = {
    scheduled: { label: 'محجوز', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    confirmed: { label: 'مؤكد', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
    completed: { label: 'مكتمل', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
    cancelled: { label: 'ملغي', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    'no-show': { label: 'لم يحضر', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
};

const typeConfig = {
    consultation: 'استشارة',
    checkup: 'فحص دوري',
    followup: 'متابعة',
    emergency: 'طارئ',
};

export default function AppointmentsCalendar() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'today' | 'week'>('today');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedApt, setSelectedApt] = useState<any>(null);
    const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

    useEffect(() => {
        loadAppointments();
    }, [filter]);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            let data;

            if (filter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                data = await dataApi.get(`/appointments?date_from=${today}&date_to=${today}`);
            } else if (filter === 'week') {
                const today = new Date();
                const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                data = await dataApi.get(`/appointments?date_from=${today.toISOString()}&date_to=${weekLater.toISOString()}`);
            } else {
                data = await appointmentsApi.getAll();
            }

            setAppointments(data);
        } catch (error) {
            console.error('Error loading appointments:', error);
            toastWithSound.error('فشل تحميل المواعيد');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: number, newStatus: string, appointment?: any) => {
        if (newStatus === 'completed') {
            setSelectedApt(appointment);
            setIsCompleteDialogOpen(true);
            return;
        }

        try {
            await appointmentsApi.update(id, { status: newStatus });
            toastWithSound.success('تم تحديث حالة الموعد');
            loadAppointments();
        } catch (error) {
            console.error('Error updating status:', error);
            toastWithSound.error('فشل تحديث الحالة');
        }
    };

    const filteredAppointments = statusFilter === 'all'
        ? appointments
        : appointments.filter(apt => apt.status === statusFilter);

    const groupedByDate = filteredAppointments.reduce((acc, apt) => {
        const date = new Date(apt.appointment_date).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(apt);
        return acc;
    }, {} as Record<string, Appointment[]>);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold">المواعيد</h2>
                    <p className="text-sm text-muted-foreground">إدارة مواعيد المرضى</p>
                </div>
                <Button
                    className="gap-2 gradient-primary"
                    onClick={() => setIsAddDialogOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    موعد جديد
                </Button>
            </div>

            <AddAppointmentDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={loadAppointments}
            />

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">الفترة:</span>
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'today' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('today')}
                            >
                                اليوم
                            </Button>
                            <Button
                                variant={filter === 'week' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('week')}
                            >
                                هذا الأسبوع
                            </Button>
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                            >
                                الكل
                            </Button>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">الحالة:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-sm border rounded-md px-3 py-1.5 bg-background"
                        >
                            <option value="all">الكل</option>
                            <option value="scheduled">محجوز</option>
                            <option value="confirmed">مؤكد</option>
                            <option value="completed">مكتمل</option>
                            <option value="cancelled">ملغي</option>
                            <option value="no-show">لم يحضر</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Appointments List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">جاري التحميل...</p>
                </div>
            ) : Object.keys(groupedByDate).length === 0 ? (
                <Card className="p-12 text-center">
                    <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-bold mb-2">لا توجد مواعيد</h3>
                    <p className="text-sm text-muted-foreground">لم يتم العثور على مواعيد في الفترة المحددة</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedByDate).map(([date, dayAppointments]) => (
                        <div key={date}>
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-bold">
                                    {format(new Date(date), 'EEEE، d MMMM yyyy', { locale: ar })}
                                </h3>
                                <Badge variant="outline" className="mr-auto">
                                    {dayAppointments.length} موعد
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dayAppointments.map((appointment) => (
                                    <Card
                                        key={appointment.id}
                                        className="p-5 hover:shadow-xl transition-all border-border/50 bg-card/50 backdrop-blur-sm relative group overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="space-y-4">
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-full bg-primary/10 ring-4 ring-primary/5">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-base leading-tight">
                                                            {appointment.patient_name || 'بدون اسم'}
                                                        </h4>
                                                        <a
                                                            href={`tel:${appointment.phone.split('@')[0]}`}
                                                            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-1 font-medium"
                                                        >
                                                            <Phone className="h-3 w-3" />
                                                            {appointment.phone.split('@')[0]}
                                                        </a>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`${statusConfig[appointment.status as keyof typeof statusConfig]?.color} px-2.5 py-0.5 font-medium`}
                                                >
                                                    {statusConfig[appointment.status as keyof typeof statusConfig]?.label}
                                                </Badge>
                                            </div>

                                            {/* Time & Type & Messaging */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                                        <Clock className="h-3.5 w-3.5 text-primary/70" />
                                                        <span className="font-medium">
                                                            {format(new Date(appointment.appointment_date), 'hh:mm a', { locale: ar })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                                        <Calendar className="h-3.5 w-3.5 text-primary/70" />
                                                        <span className="font-medium text-xs">
                                                            {format(new Date(appointment.appointment_date), 'd MMMM', { locale: ar })}
                                                        </span>
                                                    </div>
                                                    <div className="text-muted-foreground text-xs font-semibold px-2 py-1 bg-primary/5 rounded-md border border-primary/10">
                                                        {typeConfig[appointment.appointment_type as keyof typeof typeConfig] || appointment.appointment_type}
                                                    </div>
                                                </div>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50 bg-green-50/50 border border-green-100/50"
                                                    onClick={() => {
                                                        const cleanPhone = appointment.phone.split('@')[0].replace(/\D/g, '');
                                                        if (cleanPhone.length > 5) {
                                                            window.open(`https://wa.me/${cleanPhone}`, '_blank');
                                                        } else {
                                                            toastWithSound.error('رقم الهاتف غير صالح للمراسلة');
                                                        }
                                                    }}
                                                    title="مراسلة عبر واتساب"
                                                >
                                                    <MessageCircle className="h-4.5 w-4.5" />
                                                </Button>
                                            </div>

                                            {/* Notes */}
                                            {appointment.notes && (
                                                <div className="p-3 rounded-xl bg-orange-50/30 border border-orange-100/50 text-xs">
                                                    <div className="flex items-start gap-2">
                                                        <FileText className="h-3.5 w-3.5 text-orange-400 mt-0.5" />
                                                        <p className="text-muted-foreground leading-relaxed line-clamp-2 italic">
                                                            {appointment.notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="pt-2">
                                                {appointment.status === 'scheduled' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 text-xs hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors"
                                                            onClick={() => updateStatus(appointment.id, 'confirmed')}
                                                        >
                                                            تأكيد
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                                            onClick={() => updateStatus(appointment.id, 'cancelled')}
                                                        >
                                                            إلغاء
                                                        </Button>
                                                    </div>
                                                )}
                                                {appointment.status === 'confirmed' && (
                                                    <Button
                                                        size="sm"
                                                        className="w-full text-xs gradient-primary shadow-sm hover:shadow-md transition-all py-5"
                                                        onClick={() => updateStatus(appointment.id, 'completed', appointment)}
                                                    >
                                                        ✅ تسجيل الحضور وإتمام الكشف
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CompleteAppointmentDialog
                isOpen={isCompleteDialogOpen}
                onClose={() => {
                    setIsCompleteDialogOpen(false);
                    setSelectedApt(null);
                }}
                appointment={selectedApt}
                onSuccess={() => {
                    loadAppointments();
                }}
            />
        </div>
    );
}

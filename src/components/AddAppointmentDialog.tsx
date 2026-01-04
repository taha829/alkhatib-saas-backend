
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { appointmentsApi } from '@/lib/api';
import { toastWithSound } from '@/lib/toast-with-sound';
import { Calendar as CalendarIcon, Clock, User, Phone, FileText } from 'lucide-react';
import { appointmentSchema } from "@/lib/validations";

interface AddAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function AddAppointmentDialog({ open, onOpenChange, onSuccess }: AddAppointmentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customer_name: '',
        phone: '',
        appointment_date: '',
        appointment_time: '',
        appointment_type: 'consultation',
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate with Zod
        const validation = appointmentSchema.safeParse({
            name: formData.customer_name,
            phone: formData.phone,
            appointment_date: formData.appointment_date,
            appointment_time: formData.appointment_time,
            notes: formData.notes
        });

        if (!validation.success) {
            toastWithSound.error(validation.error.errors[0].message);
            return;
        }

        setLoading(true);
        try {
            // Combine date and time
            const fullDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;

            await appointmentsApi.create({
                customer_name: formData.customer_name,
                phone: formData.phone,
                appointment_date: fullDateTime,
                appointment_type: formData.appointment_type,
                notes: formData.notes,
                status: 'scheduled'
            });

            toastWithSound.success('تم إضافة الموعد بنجاح');
            onSuccess();
            onOpenChange(false);
            setFormData({
                customer_name: '',
                phone: '',
                appointment_date: '',
                appointment_time: '',
                appointment_type: 'consultation',
                notes: '',
            });
        } catch (error: any) {
            console.error('Error creating appointment:', error);
            toastWithSound.error(error.message || 'فشل في إضافة الموعد');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl overflow-hidden bg-card/95 backdrop-blur-xl">
                <DialogHeader className="bg-primary/5 p-6 border-b border-primary/10">
                    <DialogTitle className="text-2xl font-display font-black flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/20 text-primary">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        إضافة موعد جديد
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        قم بإدخال بيانات المريض وتفاصيل الحجز يدوياً.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                اسم المريض
                            </Label>
                            <Input
                                placeholder="مثلاً: محمد أحمد"
                                value={formData.customer_name}
                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                className="bg-background/50 border-border/50 h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                رقم الهاتف
                            </Label>
                            <Input
                                placeholder="9627XXXXXXXX"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-background/50 border-border/50 h-11"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-primary" />
                                تاريخ الموعد
                            </Label>
                            <Input
                                type="date"
                                value={formData.appointment_date}
                                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                                className="bg-background/50 border-border/50 h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                وقت الموعد
                            </Label>
                            <Input
                                type="time"
                                value={formData.appointment_time}
                                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                                className="bg-background/50 border-border/50 h-11"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold">نوع الموعد</Label>
                        <Select
                            value={formData.appointment_type}
                            onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                        >
                            <SelectTrigger className="bg-background/50 border-border/50 h-11">
                                <SelectValue placeholder="اختر نوع الموعد" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/50">
                                <SelectItem value="consultation">استشارة مطولة</SelectItem>
                                <SelectItem value="checkup">فحص دوري</SelectItem>
                                <SelectItem value="followup">مراجعة نتيحة</SelectItem>
                                <SelectItem value="emergency">حظر طارئ</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            ملاحظات إضافية
                        </Label>
                        <Textarea
                            placeholder="أي تفاصيل أخرى حول حالة المريض..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="bg-background/50 border-border/50 min-h-[100px] resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-4 gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-12 flex-1 font-bold rounded-2xl"
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-12 flex-[2] font-bold rounded-2xl gradient-primary shadow-glow"
                        >
                            {loading ? "جاري الحفظ..." : "تأكيد وحفظ الموعد"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

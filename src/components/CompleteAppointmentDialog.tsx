
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    FileDown,
    Send,
    CheckCircle2,
    AlertCircle,
    Stethoscope,
    Receipt,
    User,
    FileText,
    Pill,
    Save,
    X
} from 'lucide-react';
import { appointmentsApi, whatsappApi, BASE_URL } from '@/lib/api';
import { toastWithSound } from '@/lib/toast-with-sound';

interface CompleteAppointmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: any;
    onSuccess: () => void;
}

export default function CompleteAppointmentDialog({ isOpen, onClose, appointment, onSuccess }: CompleteAppointmentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [branding, setBranding] = useState({
        name: 'عيادتي',
        logo: '/logo.png'
    });
    const [formData, setFormData] = useState({
        diagnosis: '',
        treatment: '',
        fee_amount: '',
        fee_details: 'كشفية طبية'
    });
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [sendingPdf, setSendingPdf] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const loadBranding = async () => {
            try {
                const settings = await whatsappApi.getSettings();
                if (settings.clinic_name || settings.clinic_logo) {
                    const logoUrl = settings.clinic_logo ? (settings.clinic_logo.startsWith('http') ? settings.clinic_logo : `${BASE_URL}${settings.clinic_logo}`) : '/logo.png';
                    setBranding({
                        name: settings.clinic_name || 'عيادتي',
                        logo: logoUrl
                    });
                }
            } catch (error) {
                console.error('Error loading branding:', error);
            }
        };

        if (isOpen) {
            loadBranding();
            setIsSaved(false);
            setPdfUrl(null);
            if (appointment) {
                setFormData({
                    diagnosis: '',
                    treatment: '',
                    fee_amount: '',
                    fee_details: 'كشفية طبية'
                });
            }
        }
    }, [isOpen, appointment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appointment) return;

        setLoading(true);
        try {
            await appointmentsApi.saveMedicalRecord(appointment.id, {
                patient_id: appointment.patient_id,
                diagnosis: formData.diagnosis,
                treatment: formData.treatment,
                fee_amount: parseFloat(formData.fee_amount) || 0,
                fee_details: formData.fee_details
            });
            setIsSaved(true);
            toastWithSound.success('تم أرشفة الزيارة بنجاح. يمكنك الآن تصدير الوصفة.');
        } catch (error: any) {
            console.error('Failed to save medical record:', error);
            toastWithSound.error('فشل في حفظ البيانات: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async () => {
        if (!appointment) return;
        setGeneratingPdf(true);
        try {
            const result = await appointmentsApi.generatePrescription(appointment.id);
            setPdfUrl(result.url);
            toastWithSound.success('تم إنشاء الوصفة الطبية بنجاح');

            // Auto open in new tab
            window.open(result.url, '_blank');
        } catch (error: any) {
            console.error('PDF Generation failed:', error);
            toastWithSound.error('فشل في إنشاء ملف PDF');
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!appointment || !pdfUrl) return;
        setSendingPdf(true);
        try {
            await appointmentsApi.sendPrescription(appointment.id, {
                url: pdfUrl,
                phone: appointment.phone
            });
            toastWithSound.success('تم إرسال الوصفة عبر الواتساب بنجاح');
        } catch (error: any) {
            console.error('WhatsApp sending failed:', error);
            toastWithSound.error('فشل في إرسال الوصفة عبر الواتساب');
        } finally {
            setSendingPdf(false);
        }
    };

    if (!appointment) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl shadow-2xl rounded-3xl" dir="rtl">
                <DialogHeader className="p-8 bg-gradient-to-r from-primary/10 via-background to-background border-b border-border/50">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className="p-1.5 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-border/50">
                                <img
                                    src={branding.logo}
                                    alt="Logo"
                                    className="h-12 w-12 rounded-xl object-cover shadow-glow"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                                />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">{branding.name}</DialogTitle>
                                <p className="text-muted-foreground text-sm font-medium">إتمام الزيارة والتوثيق الطبي</p>
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col items-end opacity-50">
                            <Stethoscope className="h-8 w-8 text-primary/50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Medical Record</span>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Medical Section */}
                        <div className="space-y-6 animate-slide-in-right">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                <FileText className="h-5 w-5 text-primary" />
                                <h3 className="font-bold text-lg">التوثيق الطبي (الوصفة)</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-bold">
                                        <User className="h-4 w-4" />
                                        <span>بيانات المريض الحالي:</span>
                                    </div>
                                    <div className="text-sm font-black pr-6">
                                        {appointment.patient_name || appointment.customer_name || 'عميل مجهول'}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground pr-6 uppercase tracking-widest font-bold">
                                        رقم الموعد: #{appointment.id}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold pr-1">التشخيص الطبي</Label>
                                    <Textarea
                                        placeholder="اكتب التشخيص هنا..."
                                        className="min-h-[100px] rounded-2xl bg-muted/20 border-border/50 focus:border-primary/50 transition-all text-sm leading-relaxed"
                                        value={formData.diagnosis}
                                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold pr-1 flex items-center gap-2 text-amber-600">
                                        <Pill className="h-4 w-4" />
                                        العلاج المقترح (الأدوية)
                                    </Label>
                                    <Textarea
                                        placeholder="اكتب الأدوية والتعليمات هنا..."
                                        className="min-h-[120px] rounded-2xl bg-muted/20 border-border/50 focus:border-amber-500/50 transition-all text-sm leading-relaxed"
                                        value={formData.treatment}
                                        onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Financial Section */}
                        <div className="space-y-6 animate-slide-in-left">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                <Receipt className="h-5 w-5 text-green-600" />
                                <h3 className="font-bold text-lg">المحاسبة والفوترة</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-green-500/5 rounded-3xl border border-green-500/10 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="font-bold pr-1 text-green-700">قيمة الكشفية / الخدمة</Label>
                                        <div className="relative group">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                className="h-14 rounded-2xl pl-16 text-left font-display font-black text-xl bg-background border-green-500/20 focus:border-green-600/50 ring-offset-0 transition-all group-hover:bg-green-50/10"
                                                value={formData.fee_amount}
                                                onChange={(e) => setFormData({ ...formData, fee_amount: e.target.value })}
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-green-600/50 group-focus-within:text-green-600 transition-colors">
                                                دينار
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-bold pr-1 text-green-700">توصيف الدفعة</Label>
                                        <Input
                                            placeholder="مثال: كشفية عامة، فحص أشعة..."
                                            className="h-12 rounded-xl bg-background border-green-500/20 focus:border-green-600/50 transition-all"
                                            value={formData.fee_details}
                                            onChange={(e) => setFormData({ ...formData, fee_details: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-[11px] text-amber-800 font-medium leading-relaxed">
                                    عند حفظ البيانات، سيتم تفعيل خيار "تصدير الوصفة" بشكل تلقائي لإرسالها للمريض أو طباعتها.
                                </div>

                                {isSaved && (
                                    <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <Button
                                            type="button"
                                            onClick={handleGeneratePdf}
                                            disabled={generatingPdf}
                                            className="h-14 rounded-2xl bg-slate-900 border-none hover:bg-slate-800 text-white shadow-lg flex items-center justify-between px-6"
                                        >
                                            <div className="flex items-center gap-3">
                                                {generatingPdf ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
                                                <span className="font-bold">توليد الوصفة الطبية (PDF)</span>
                                            </div>
                                            {pdfUrl && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={handleSendWhatsApp}
                                            disabled={sendingPdf || !pdfUrl}
                                            className={`h-14 rounded-2xl border-none shadow-lg flex items-center justify-between px-6 transition-all ${!pdfUrl ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#25D366] hover:bg-[#128C7E] text-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {sendingPdf ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                                <span className="font-bold">إرسال عبر واتساب المريض</span>
                                            </div>
                                            {!pdfUrl && <AlertCircle className="h-5 w-5 opacity-50" />}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-8 border-t border-border/50 gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="h-12 px-8 rounded-xl font-bold hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                            <X className="h-4 w-4 ml-2" />
                            تجاهل التوثيق
                        </Button>
                        <Button
                            type="submit"
                            className={`h-12 px-8 rounded-xl font-black shadow-glow transition-all active:scale-95 ${isSaved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-primary hover:bg-primary/90 text-white'
                                }`}
                            disabled={loading || isSaved}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : isSaved ? (
                                <>
                                    <CheckCircle2 className="h-5 w-5 ml-2" />
                                    تم التوثيق بنجاح
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 ml-2" />
                                    حفظ التوثيق وإكمال الحجز
                                </>
                            )}
                        </Button>
                        {isSaved && (
                            <Button
                                type="button"
                                onClick={() => { onSuccess(); onClose(); }}
                                className="h-12 px-8 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                إغلاق ونافذة المواعيد
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

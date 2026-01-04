import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Phone, MapPin, Clock, MessageCircle, Calendar, Save, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toastWithSound } from '@/lib/toast-with-sound';
import { whatsappApi, BASE_URL } from '@/lib/api';

interface ClinicSettings {
    clinic_name: string;
    clinic_description: string;
    clinic_logo: string;
    doctor_name: string;
    phone: string;
    emergency_phone: string;
    address: string;
    working_hours_start: string;
    working_hours_end: string;
    appointment_duration: number;
    auto_reply_enabled: boolean;
    reminder_enabled: boolean;
    reminder_time: number;
}

export default function ClinicSettings() {
    const [settings, setSettings] = useState<ClinicSettings>({
        clinic_name: 'عيادتي',
        clinic_description: 'نظام إدارة العيادات',
        clinic_logo: '/logo.png',
        doctor_name: 'د. محمد',
        phone: '',
        emergency_phone: '',
        address: '',
        working_hours_start: '09:00',
        working_hours_end: '17:00',
        appointment_duration: 30,
        auto_reply_enabled: true,
        reminder_enabled: true,
        reminder_time: 60,
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await whatsappApi.getSettings();
            if (data) {
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    // Ensure booleans and numbers are correctly typed from string values
                    auto_reply_enabled: data.ai_enabled === '1' || data.auto_reply_enabled === true,
                    reminder_enabled: data.reminder_enabled === '1' || data.reminder_enabled === true,
                    appointment_duration: parseInt(data.appointment_duration) || 30,
                    reminder_time: parseInt(data.reminder_time) || 60,
                }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toastWithSound.error('فشل تحميل الإعدادات');
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const dataToSave = {
                ...settings,
                ai_enabled: settings.auto_reply_enabled ? '1' : '0',
                reminder_enabled: settings.reminder_enabled ? '1' : '0',
            };
            await whatsappApi.updateSettings(dataToSave);
            toastWithSound.success('تم حفظ الإعدادات بنجاح');
            // Refresh the page or broadcast change to sidebar/header if needed
            window.location.reload(); // Simple way to refresh UI components using these settings
        } catch (error) {
            console.error('Error saving settings:', error);
            toastWithSound.error('فشل حفظ الإعدادات');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const data = await whatsappApi.upload(formData);
            if (data.url) {
                updateSetting('clinic_logo', data.url);
                toastWithSound.success('تم رفع الشعار بنجاح');
            }
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            toastWithSound.error(error.message || 'فشل رفع الشعار');
        } finally {
            setUploading(false);
        }
    };

    const updateSetting = (key: keyof ClinicSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold">الإعدادات</h2>
                    <p className="text-sm text-muted-foreground">إعدادات العيادة والهوية البصرية</p>
                </div>
                <Button onClick={handleSave} disabled={loading} className="gap-2 gradient-primary">
                    <Save className="h-4 w-4" />
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
            </div>

            {/* Visual Branding Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <ImageIcon className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold">الهوية البصرية</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="clinic_name">اسم العيادة</Label>
                                <Input
                                    id="clinic_name"
                                    value={settings.clinic_name}
                                    onChange={(e) => updateSetting('clinic_name', e.target.value)}
                                    placeholder="مثلاً: عيادة الأمل"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clinic_description">وصف العيادة (المجال)</Label>
                                <Input
                                    id="clinic_description"
                                    value={settings.clinic_description}
                                    onChange={(e) => updateSetting('clinic_description', e.target.value)}
                                    placeholder="مثلاً: طب الأسنان وصحة الفم"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                            <Label className="block mb-2">شعار العيادة</Label>
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden relative group">
                                    {settings.clinic_logo ? (
                                        <img src={settings.clinic_logo.startsWith('http') ? settings.clinic_logo : `${BASE_URL}${settings.clinic_logo}`} alt="Logo Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <Building2 className="h-10 w-10 text-muted-foreground/30" />
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        <Upload className="h-4 w-4" />
                                        رفع شعار جديد
                                    </Button>
                                    <p className="text-xs text-muted-foreground">يفضل أن يكون الشعار بصيغة PNG وبخلفية شفافة</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
                    <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        نصيحة احترافية
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        تخصيص اسم وشعار عيادتك يعزز من ثقة المرضى ويجعل النظام يبدو كجزء متكامل من علامتك التجارية. سيتغير هذا الشعار في القائمة الجانبية وفي كافة التقارير الصادرة عن النظام.
                    </p>
                </Card>
            </div>

            {/* Clinic Information */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold">معلومات التواصل</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="doctor_name">اسم الطبيب المسئول</Label>
                        <Input
                            id="doctor_name"
                            value={settings.doctor_name}
                            onChange={(e) => updateSetting('doctor_name', e.target.value)}
                            placeholder="د. محمد أحمد"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">رقم الهاتف الرسمي</Label>
                        <Input
                            id="phone"
                            value={settings.phone}
                            onChange={(e) => updateSetting('phone', e.target.value)}
                            placeholder="0791234567"
                            dir="ltr"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="emergency_phone">رقم للطوارئ (اختياري)</Label>
                        <Input
                            id="emergency_phone"
                            value={settings.emergency_phone}
                            onChange={(e) => updateSetting('emergency_phone', e.target.value)}
                            placeholder="0791234567"
                            dir="ltr"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">العنوان الفعلي</Label>
                        <Input
                            id="address"
                            value={settings.address}
                            onChange={(e) => updateSetting('address', e.target.value)}
                            placeholder="عمان، شارع المدينة المنورة..."
                        />
                    </div>
                </div>
            </Card>

            {/* Working Hours & Appointments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Clock className="h-5 w-5 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold">ساعات العمل</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="working_hours_start">بداية الدوام</Label>
                            <Input
                                id="working_hours_start"
                                type="time"
                                value={settings.working_hours_start}
                                onChange={(e) => updateSetting('working_hours_start', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="working_hours_end">نهاية الدوام</Label>
                            <Input
                                id="working_hours_end"
                                type="time"
                                value={settings.working_hours_end}
                                onChange={(e) => updateSetting('working_hours_end', e.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <Calendar className="h-5 w-5 text-green-500" />
                        </div>
                        <h3 className="text-lg font-bold">إعدادات المواعيد</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="appointment_duration">مدة الموعد (دقيقة)</Label>
                            <Input
                                id="appointment_duration"
                                type="number"
                                value={settings.appointment_duration}
                                onChange={(e) => updateSetting('appointment_duration', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <Label htmlFor="reminder_enabled">تفعيل التذكير (WhatsApp)</Label>
                            <Switch
                                id="reminder_enabled"
                                checked={settings.reminder_enabled}
                                onCheckedChange={(checked) => updateSetting('reminder_enabled', checked)}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Auto-Reply Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                        <MessageCircle className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold">المساعد الذكي (AI)</h3>
                        <p className="text-sm text-muted-foreground">تفعيل الرد الآلي وحجز المواعيد عبر واتساب</p>
                    </div>
                    <Switch
                        id="auto_reply_enabled"
                        checked={settings.auto_reply_enabled}
                        onCheckedChange={(checked) => updateSetting('auto_reply_enabled', checked)}
                        className="data-[state=checked]:bg-purple-500"
                    />
                </div>
            </Card>

            {/* Save Button (Bottom) */}
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={loading} size="lg" className="gap-2 gradient-primary px-8">
                    <Save className="h-5 w-5" />
                    {loading ? 'جاري الحفظ...' : 'حفظ كافة الإعدادات'}
                </Button>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Power, PowerOff, Loader2, Info } from 'lucide-react';
import { toastWithSound } from '@/lib/toast-with-sound';

export default function TelegramBot() {
    const [status, setStatus] = useState<{ isRunning: boolean; username: string }>({ isRunning: false, username: '' });
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkStatus();
        fetchSettings();
    }, []);

    const checkStatus = async () => {
        try {
            const authToken = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:3001/api/telegram/status', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await res.json();
            setStatus(data);
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const fetchSettings = async () => {
        try {
            const authToken = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:3001/api/whatsapp/settings', { // Reusing settings endpoint
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await res.json();
            if (data.telegram_bot_token) {
                setToken(data.telegram_bot_token);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleStart = async () => {
        if (!token) {
            toastWithSound.error('يرجى إدخال التوكن أولاً');
            return;
        }

        setLoading(true);
        try {
            const authToken = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:3001/api/telegram/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ token })
            });

            const data = await res.json();
            if (data.success) {
                toastWithSound.success('تم تشغيل البوت بنجاح!');
                checkStatus();
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toastWithSound.error(error.message || 'فشل تشغيل البوت');
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        setLoading(true);
        try {
            const authToken = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:3001/api/telegram/stop', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            const data = await res.json();
            if (data.success) {
                toastWithSound.success('تم إيقاف البوت');
                setStatus({ isRunning: false, username: '' });
            }
        } catch (error: any) {
            toastWithSound.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-display font-bold text-blue-500 flex items-center gap-2">
                        <Send className="h-6 w-6" />
                        بوت تيلجرام
                    </h2>
                    <p className="text-sm text-muted-foreground">ربط وإدارة بوت تيلجرام الذكي</p>
                </div>

                {status.isRunning ? (
                    <Button onClick={handleStop} variant="destructive" className="gap-2" disabled={loading}>
                        <PowerOff className="h-4 w-4" />
                        إيقاف البوت
                    </Button>
                ) : (
                    <Button onClick={handleStart} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                        {loading ? 'جاري التشغيل...' : 'تشغيل البوت'}
                    </Button>
                )}
            </div>

            {/* Status Card */}
            <Card className="p-6 border-blue-100 bg-blue-50/20">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${status.isRunning ? 'bg-blue-500/10' : 'bg-gray-500/10'}`}>
                        <Send className={`h-6 w-6 ${status.isRunning ? 'text-blue-500' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold">حالة الاتصال</h3>
                        <p className="text-sm text-muted-foreground">
                            {status.isRunning
                                ? `✅ متصل باسم @${status.username}`
                                : '❌ غير متصل'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Token Configuration */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Info className="h-5 w-5" />
                        <h3 className="font-bold">إعدادات الاتصال</h3>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground mb-4">
                        <p className="font-bold mb-2">كيف تحصل على التوكن؟</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>افتح تطبيق تيلجرام وابحث عن <b>@BotFather</b></li>
                            <li>أرسل الأمر <code>/newbot</code> لإنشاء بوت جديد</li>
                            <li>اتبع التعليمات لاختيار الاسم واسم المستخدم</li>
                            <li>سيعطيك BotFather رمزاً طويلاً (Token)، انسخه والصقه هنا 👇</li>
                        </ol>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="token">Bot Token</Label>
                        <Input
                            id="token"
                            type="password"
                            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="font-mono text-sm"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}

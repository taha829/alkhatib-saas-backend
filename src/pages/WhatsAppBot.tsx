import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, QrCode, Power, PowerOff, Loader2 } from 'lucide-react';
import { toastWithSound } from '@/lib/toast-with-sound';
import WhatsAppChat from '@/components/WhatsAppChat';
import { whatsappApi } from '@/lib/api';

interface WhatsAppBotProps {
    initialPhone?: string | null;
    initialName?: string | null;
    onBackCleanup?: () => void;
}

export default function WhatsAppBot({ initialPhone, initialName, onBackCleanup }: WhatsAppBotProps) {
    const [status, setStatus] = useState<{ connected: boolean; qrCode: string | null }>({ connected: false, qrCode: null });
    const [loading, setLoading] = useState(false);
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any | null>(null);

    useEffect(() => {
        if (initialPhone) {
            // Normalize the initial phone for matching
            const cleanInitial = initialPhone.replace(/\D/g, '').replace(/^0+/, '');

            // Try to find exact or loose match
            const chat = chats.find(c => {
                if (!c.phone) return false;
                const cleanChatPhone = c.phone.replace(/\D/g, '').replace(/^0+/, '');

                // Critical check: Ensure valid lengths to avoid empty string matching
                if (cleanChatPhone.length < 5 || cleanInitial.length < 5) return false;

                // Check if one ends with the other (most robust for phone numbers with/without country codes)
                return cleanChatPhone.endsWith(cleanInitial) || cleanInitial.endsWith(cleanChatPhone);
            });

            if (chat) {
                // If found existing chat, update name if we have a better one
                if (initialName && chat.name !== initialName) {
                    // Just locally for now
                }
                setSelectedChat(chat);
            } else {
                // If no chat exists, create a temporary one to start conversation
                // Assume it's a new conversation
                // Normalize phone to international format (Jordan preference)
                let normalizedPhone = initialPhone.replace(/\D/g, '');
                if (normalizedPhone.startsWith('0')) normalizedPhone = '962' + normalizedPhone.substring(1);
                if (!normalizedPhone.startsWith('962') && normalizedPhone.length === 9) normalizedPhone = '962' + normalizedPhone;

                const tempChat = {
                    id: Date.now(), // Temporary ID
                    phone: normalizedPhone, // Use normalized phone for sending
                    name: initialName || initialPhone, // Use passed name or phone
                    unread_count: 0,
                    last_message: '',
                    last_message_time: new Date().toISOString(),
                    isTemp: true // Flag to indicate it's not from DB
                };
                setSelectedChat(tempChat);
            }
        }
    }, [initialPhone, chats]);

    useEffect(() => {
        checkStatus();
        loadChats();
        const interval = setInterval(() => {
            checkStatus();
            loadChats();
        }, 5000); // Poll every 5 seconds for status and chats
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        try {
            const data = await whatsappApi.getStatus();
            // console.log('[WhatsApp] Current Status:', data);
            setStatus(data);
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const loadChats = async () => {
        try {
            const data = await whatsappApi.getChats();
            setChats(data);
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        try {
            await whatsappApi.connect();
            toastWithSound.success('جاري بدء الاتصال... يرجى الانتظار');

            // The polling interval in useEffect will pick up the status change
            // But we keep the local loading state true until we see a change
            let attempts = 0;
            const checkInterval = setInterval(async () => {
                try {
                    const refreshedStatus = await whatsappApi.getStatus();
                    setStatus(refreshedStatus);
                    attempts++;

                    if (refreshedStatus.connected) {
                        clearInterval(checkInterval);
                        setLoading(false);
                        toastWithSound.success('تم الاتصال بنجاح!');
                    } else if (refreshedStatus.qrCode || attempts > 20) {
                        // Stop the local loading spinner once we have a QR or timeout
                        clearInterval(checkInterval);
                        setLoading(false);
                    }
                } catch (err) {
                    console.error('[WhatsApp] Status check failed during connect:', err);
                    attempts++;
                    if (attempts > 20) {
                        clearInterval(checkInterval);
                        setLoading(false);
                        toastWithSound.error('فشل التحقق من حالة الاتصال');
                    }
                }
            }, 2000);
        } catch (error: any) {
            toastWithSound.error(error.message);
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await whatsappApi.disconnect();
            setStatus({ connected: false, qrCode: null });
            setSelectedChat(null);
            toastWithSound.success('تم قطع الاتصال');
        } catch (error: any) {
            toastWithSound.error(error.message);
        }
    };

    if (selectedChat) {
        return (
            <WhatsAppChat
                chat={selectedChat}
                onBack={() => {
                    setSelectedChat(null);
                    if (onBackCleanup) onBackCleanup();
                    loadChats();
                }}
            />
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-display font-bold">واتساب بوت</h2>
                    <p className="text-sm text-muted-foreground">إدارة الردود التلقائية والمحادثات</p>
                </div>

                {status.connected ? (
                    <Button onClick={handleDisconnect} variant="destructive" className="gap-2">
                        <PowerOff className="h-4 w-4" />
                        قطع الاتصال
                    </Button>
                ) : (
                    <Button onClick={handleConnect} disabled={loading} className="gap-2 gradient-primary">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                        {loading ? 'جاري الاتصال...' : 'بدء الاتصال'}
                    </Button>
                )}
            </div>

            {/* Connection Status Card */}
            <Card className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${status.connected ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                        <MessageCircle className={`h-6 w-6 ${status.connected ? 'text-green-500' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold">حالة الاتصال</h3>
                        <p className="text-sm text-muted-foreground">
                            {status.connected ? '✅ متصل' : '❌ غير متصل'}
                        </p>
                    </div>
                </div>

                {!status.connected && (
                    <div className="mt-6 p-6 bg-muted/20 rounded-xl text-center min-h-[300px] flex flex-col justify-center items-center">
                        {status.qrCode ? (
                            <>
                                <QrCode className="h-8 w-8 mx-auto mb-4 text-primary" />
                                <p className="text-sm font-bold mb-2">امسح هذا الكود من تطبيق واتساب</p>
                                <p className="text-xs text-muted-foreground mb-4">
                                    افتح واتساب → الإعدادات → الأجهزة المرتبطة → ربط جهاز
                                </p>
                                <div className="bg-white p-4 rounded-lg inline-block shadow-md">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(status.qrCode)}`}
                                        alt="QR Code"
                                        className="w-48 h-48"
                                    />
                                </div>
                            </>
                        ) : loading ? (
                            <div className="space-y-4">
                                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                                <p className="text-sm font-medium">جاري إنتاج الكود... يرجى الانتظار 30 ثانية</p>
                                <p className="text-xs text-muted-foreground">تأكد أن هاتفك متصل بالإنترنت</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <QrCode className="h-10 w-10 mx-auto text-muted-foreground opacity-20" />
                                <p className="text-sm text-muted-foreground">اضغط على زر "بدء الاتصال" بالأعلى لمسح الكود</p>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Chats List */}
            {status.connected && (
                <div>
                    <h3 className="text-lg font-bold mb-4">المحادثات ({chats.length})</h3>
                    {chats.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-muted-foreground">لا توجد محادثات بعد</p>
                            <p className="text-sm text-muted-foreground">ابدأ بإرسال رسالة من هاتفك</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {chats.map((chat) => (
                                <Card
                                    key={chat.id}
                                    className="p-4 hover:shadow-lg transition-all cursor-pointer border-border/50 hover:border-primary/50"
                                    onClick={() => setSelectedChat(chat)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-full bg-green-500/10">
                                            <MessageCircle className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate">{chat.name || chat.phone}</h4>
                                            <p className="text-xs text-muted-foreground truncate">{chat.last_message}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {new Date(chat.last_message_time).toLocaleString('ar-JO')}
                                            </p>
                                        </div>
                                        {chat.unread_count > 0 && (
                                            <span className="bg-green-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                {chat.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

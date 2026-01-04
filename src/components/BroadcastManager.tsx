import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Megaphone, Users, MessageSquare, Play, Pause, Loader2, Search, CheckCircle2, History, RefreshCcw, AlertCircle, Clock } from 'lucide-react';
import { toastWithSound } from '@/lib/toast-with-sound';

export default function BroadcastManager() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [allTags, setAllTags] = useState<any[]>([]);
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Campaign Status State
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);

    useEffect(() => {
        fetchContacts();
        fetchTags();
        fetchCampaigns();

        // Polling for campaign status
        const interval = setInterval(fetchCampaigns, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchCampaigns = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:3001/api/campaigns', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCampaigns(data);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
    };

    // CRM Statuses acting as Tags
    const CRM_TAGS = [
        { id: 'status_new', name: 'عملاء جدد', color: '#3b82f6', isStatus: true, statusId: 'new' },
        { id: 'status_interested', name: 'مهتمون', color: '#eab308', isStatus: true, statusId: 'interested' },
        { id: 'status_customer', name: 'تم البيع', color: '#22c55e', isStatus: true, statusId: 'customer' },
        { id: 'status_junk', name: 'غير مهتم', color: '#ef4444', isStatus: true, statusId: 'junk' },
    ];

    const fetchTags = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/whatsapp/tags', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAllTags([...CRM_TAGS, ...data]);
        } catch (error) {
            console.error('Error fetching tags:', error);
            setAllTags(CRM_TAGS);
        }
    };

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/contacts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setContacts(data.filter((c: any) => c.phone));
        } catch (error) {
            toastWithSound.error('فشل تحميل جهات الاتصال');
        }
    };

    const toggleContact = (id: number) => {
        if (selectedContacts.includes(id)) {
            setSelectedContacts(selectedContacts.filter(cId => cId !== id));
        } else {
            setSelectedContacts([...selectedContacts, id]);
        }
    };

    const selectAll = () => {
        if (selectedContacts.length === filteredContacts.length) {
            setSelectedContacts([]);
        } else {
            setSelectedContacts(filteredContacts.map(c => c.id));
        }
    };

    const filteredContacts = contacts.filter(c => {
        const name = c.name || '';
        const phone = c.phone || '';
        const matchesSearch = (name.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm));

        // Tag & Status Logic
        let matchesTag = false;
        if (selectedTag === 'all') {
            matchesTag = true;
        } else {
            // Check if selected tag is a CRM status
            const crmTag = CRM_TAGS.find(t => t.name === selectedTag);
            if (crmTag) {
                // Match by status
                matchesTag = c.status === crmTag.statusId;
            } else {
                // Match by regular tags
                matchesTag = c.tags && c.tags.split(',').includes(selectedTag);
            }
        }

        return matchesSearch && matchesTag;
    });

    const startBroadcast = async () => {
        if (selectedContacts.length === 0) return toastWithSound.error('يرجى اختيار جهة اتصال واحدة على الأقل');
        if (!message) return toastWithSound.error('يرجى كتابة نص الرسالة');

        setSending(true);

        const contactsToSend = contacts.filter(c => selectedContacts.includes(c.id));

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:3001/api/campaigns', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: `حملة ${new Date().toLocaleString('ar-EG')}`,
                    message: message,
                    platform: 'whatsapp',
                    recipients: contactsToSend
                })
            });

            const data = await res.json();

            if (data.success) {
                toastWithSound.success('تم إنشاء الحملة بنجاح! جاري الإرسال الآن.');
                setSelectedContacts([]);
                setMessage('');
                fetchCampaigns();
            } else {
                toastWithSound.error(data.error || 'فشل البدء بالحملة');
            }

        } catch (error) {
            console.error('Failed to create campaign:', error);
            toastWithSound.error('حدث خطأ أثناء الاتصال بالخادم');
        } finally {
            setSending(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-bold">مكتملة</span>;
            case 'running': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-bold animate-pulse">جاري الإرسال</span>;
            case 'paused': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-bold">متوقفة</span>;
            case 'failed': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-bold">فشلت</span>;
            default: return <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-600 font-bold">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold">نظام الإرسال الجماعي</h2>
                    <p className="text-sm text-muted-foreground">أرسل رسائلك الترويجية بأمان عبر السيرفر</p>
                </div>
                <Megaphone className="h-8 w-8 text-primary opacity-20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Selection */}
                <Card className="lg:col-span-1 flex flex-col h-[700px]">
                    <CardHeader className="p-4 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            المستلمين ({selectedContacts.length})
                        </CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث..."
                                className="pl-8 text-xs"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar border-t border-dashed">
                            <span className="text-[10px] font-bold self-center ml-2 shrink-0">الوسوم:</span>
                            <Button
                                variant={selectedTag === 'all' ? 'default' : 'outline'}
                                size="sm"
                                className="h-6 text-[10px]"
                                onClick={() => setSelectedTag('all')}
                            >
                                الكل
                            </Button>
                            {allTags.map(tag => (
                                <Button
                                    key={tag.id}
                                    variant={selectedTag === tag.name ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-6 text-[10px] whitespace-nowrap"
                                    style={selectedTag === tag.name ? { backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color } : {}}
                                    onClick={() => setSelectedTag(tag.name)}
                                >
                                    {tag.name}
                                </Button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="select-all"
                                checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                                onCheckedChange={selectAll}
                            />
                            <label htmlFor="select-all" className="text-[10px] cursor-pointer">اختيار الكل</label>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                        {filteredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                className={`flex items-center gap-3 p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${selectedContacts.includes(contact.id) ? 'bg-primary/5' : ''}`}
                                onClick={() => toggleContact(contact.id)}
                            >
                                <Checkbox checked={selectedContacts.includes(contact.id)} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{contact.name || 'مستخرج'}</p>
                                    <p className="text-[10px] text-muted-foreground">{contact.phone}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Message & Stats View */}
                <div className="lg:col-span-1 space-y-6 h-[700px] overflow-y-auto pr-1 no-scrollbar">
                    <Card>
                        <CardHeader className="pb-3 border-b mb-4">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                تجهيز المحتوى
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">نص الرسالة</label>
                                <Textarea
                                    placeholder="اكتب رسالتك هنا... استخدم {name} لاسم العميل."
                                    className="min-h-[150px] bg-muted/20"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 space-y-1">
                                    <p className="text-xs font-bold text-green-700">🔒 أمان الإرسال:</p>
                                    <p className="text-[10px] text-green-600/80">فواصل زمنية (10-30 ثانية) لتجنب الحظر.</p>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1">
                                    <p className="text-xs font-bold text-blue-700">⚙️ المعالجة:</p>
                                    <p className="text-[10px] text-blue-600/80">تعمل الحملة في الخلفية حتى لو أغلق النافذة.</p>
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 text-lg gradient-primary"
                                onClick={startBroadcast}
                                disabled={sending || selectedContacts.length === 0 || !message}
                            >
                                {sending ? <><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جاري التجهيز... </> : <><Play className="ml-2 h-5 w-5" /> بدء الحملة الإعلانبة </>}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Active/Recent Campaigns */}
                    <Card className="flex-1">
                        <CardHeader className="pb-3 border-b mb-4 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                الحملات الأخيرة
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={fetchCampaigns} disabled={loadingCampaigns}>
                                <RefreshCcw className={`h-4 w-4 ${loadingCampaigns ? 'animate-spin' : ''}`} />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {campaigns.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                                    <Clock className="h-8 w-8 opacity-20" />
                                    <p className="text-sm">لا توجد حملات مسجلة حالياً</p>
                                </div>
                            ) : (
                                campaigns.map(camp => {
                                    const progress = camp.total_recipients > 0
                                        ? Math.round(((camp.sent_count + camp.failed_count) / camp.total_recipients) * 100)
                                        : 0;

                                    return (
                                        <div key={camp.id} className="p-4 rounded-xl border bg-muted/5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${camp.status === 'completed' ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                                                        <Megaphone className={`h-4 w-4 ${camp.status === 'completed' ? 'text-green-600' : 'text-primary'}`} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold">{camp.name}</h4>
                                                        <p className="text-[10px] text-muted-foreground">{new Date(camp.created_at).toLocaleString('ar-EG')}</p>
                                                    </div>
                                                </div>
                                                {getStatusBadge(camp.status)}
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-muted-foreground">نسبة الإرسال</span>
                                                    <span className="font-bold">{progress}%</span>
                                                </div>
                                                <Progress value={progress} className="h-1.5" />
                                                <div className="flex justify-between items-center text-[10px] pt-1">
                                                    <div className="flex gap-3">
                                                        <span className="flex items-center gap-1 text-green-600">
                                                            <CheckCircle2 className="h-3 w-3" /> {camp.sent_count} تم بنجاح
                                                        </span>
                                                        <span className="flex items-center gap-1 text-red-500">
                                                            <AlertCircle className="h-3 w-3" /> {camp.failed_count} فشل
                                                        </span>
                                                    </div>
                                                    <span className="text-muted-foreground">الإجمالي: {camp.total_recipients}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

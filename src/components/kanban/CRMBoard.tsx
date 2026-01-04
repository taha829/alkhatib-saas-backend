import { useState, useEffect } from 'react';
import { CRMColumn } from './CRMColumn';
import { BASE_URL } from '@/lib/api';
import { Loader2, Search, Users, Target, CheckCircle, TrendingUp } from 'lucide-react';
import { toastWithSound } from '@/lib/toast-with-sound';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const COLUMNS = [
    { id: 'new', title: 'عملاء جدد', color: '#3b82f6', icon: Users },
    { id: 'interested', title: 'مهتمون', color: '#eab308', icon: Target },
    { id: 'customer', title: 'تم البيع', color: '#22c55e', icon: CheckCircle },
    { id: 'junk', title: 'غير مهتم', color: '#ef4444', icon: TrendingUp },
];

export default function CRMBoard({ onOpenChat }: { onOpenChat?: (phone: string, name?: string) => void }) {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/contacts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setContacts(data);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            toastWithSound.error('فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteContact = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${BASE_URL}/api/contacts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setContacts(contacts.filter(c => c.id.toString() !== id));
            toastWithSound.success('تم حذف العميل بنجاح');
        } catch (error) {
            toastWithSound.error('فشل حذف العميل');
        }
    };

    const handleUpdateStatus = async (contactId: string, newStatus: string) => {
        // Optimistic Update
        const previousContacts = [...contacts];
        setContacts(contacts.map(c =>
            c.id.toString() === contactId ? { ...c, status: newStatus } : c
        ));

        try {
            const token = localStorage.getItem('token');
            await fetch(`${BASE_URL}/api/contacts/${contactId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            toastWithSound.success('تم تحديث حالة العميل');
        } catch (error) {
            setContacts(previousContacts); // Rollback
            toastWithSound.error('فشل تحديث الحالة');
        }
    };

    const filteredContacts = contacts.filter(c =>
        (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || "").includes(searchQuery)
    );

    if (loading) return (
        <div className="flex flex-col h-64 items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">جاري تحميل لوحة التحكم...</p>
        </div>
    );

    if (!COLUMNS.length) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <TrendingUp className="h-24 w-24 text-primary relative z-10 opacity-80" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-foreground">لا توجد مسارات بيع حالياً</h3>
                <p className="text-muted-foreground max-w-md mx-auto">ابدأ بإنشاء مسار جديد لتتبع حالة المرضى والصفقات من خلال القائمة أعلاه.</p>
            </div>
            <div className="flex gap-4">
                <div className="h-1 w-12 bg-primary rounded-full" />
                <div className="h-1 w-12 bg-primary/40 rounded-full" />
                <div className="h-1 w-12 bg-primary/20 rounded-full" />
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col animate-fade-in space-y-6">
            {/* Header with Stats & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-1">
                {/* Stats Section */}
                <div className="lg:col-span-3 flex flex-wrap gap-4">
                    {COLUMNS.map(col => (
                        <Card key={col.id} className="flex-1 min-w-[120px] p-3 bg-card/40 backdrop-blur-md border border-border/40 shadow-sm flex items-center gap-3">
                            <div className="p-2 rounded-lg text-white" style={{ backgroundColor: col.color }}>
                                <col.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold">{col.title}</p>
                                <p className="text-lg font-black">{contacts.filter(c => (c.status || 'new') === col.id).length}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="flex items-center relative">
                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن عميل..."
                        className="pl-10 bg-card/40 backdrop-blur-md border-border/40 h-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Kanban Board Container */}
            <div className="flex-1 min-h-0">
                <div className="flex flex-wrap gap-4 pb-6 px-1">
                    {COLUMNS.map((col) => (
                        <CRMColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            contacts={filteredContacts.filter(c => (c.status || 'new') === col.id)}
                            color={col.color}
                            onDeleteContact={handleDeleteContact}
                            onUpdateStatus={handleUpdateStatus}
                            onOpenChat={onOpenChat}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

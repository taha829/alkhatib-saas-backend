import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserX, UserCheck, Calendar, Shield } from "lucide-react";
import { toastWithSound } from '@/lib/toast-with-sound';
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const Admin = () => {
    const { user, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                navigate("/");
                return;
            }
            fetchUsers();
        }
    }, [user, authLoading]);

    const fetchUsers = async () => {
        try {
            const data = await adminApi.getUsers();
            setUsers(data);
        } catch (err: any) {
            toastWithSound.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId: number, newStatus: string) => {
        try {
            await adminApi.updateUser(userId, { status: newStatus });
            toastWithSound.success("تم تحديث حالة المستخدم");
            fetchUsers();
        } catch (err: any) {
            toastWithSound.error(err.message);
        }
    };

    const handleExtendExpiry = async (userId: number, currentExpiry: string) => {
        const newDate = new Date(currentExpiry || new Date());
        newDate.setMonth(newDate.getMonth() + 1);

        try {
            await adminApi.updateUser(userId, { expiry_date: newDate.toISOString() });
            toastWithSound.success("تم تمديد العضوية لمدة شهر");
            fetchUsers();
        } catch (err: any) {
            toastWithSound.error(err.message);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col" dir="rtl">
            <Header />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Shield className="h-8 w-8 text-primary" />
                                لوحة تحكم المدير
                            </h1>
                            <p className="text-muted-foreground mt-2">إدارة المستخدمين، الاشتراكات، وحظر الحسابات</p>
                        </div>
                        <Button variant="outline" onClick={() => navigate("/")}>العودة للرئيسية</Button>
                    </div>

                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>قائمة المشتركين ({users.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="p-4 text-right">البريد الإلكتروني</th>
                                                <th className="p-4 text-right">الحالة</th>
                                                <th className="p-4 text-right">تاريخ الانتهاء</th>
                                                <th className="p-4 text-right">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {users.map((u) => (
                                                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-4 font-medium">{u.email}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${u.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                            }`}>
                                                            {u.status === 'active' ? 'نشط' : 'محظور'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground">
                                                        {u.expiry_date ? new Date(u.expiry_date).toLocaleDateString('ar-EG') : 'غير محدد'}
                                                    </td>
                                                    <td className="p-4 flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-2"
                                                            onClick={() => handleExtendExpiry(u.id, u.expiry_date)}
                                                        >
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            تمديد شهر
                                                        </Button>
                                                        {u.status === 'active' ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => handleStatusChange(u.id, 'blocked')}
                                                            >
                                                                <UserX className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
                                                                onClick={() => handleStatusChange(u.id, 'active')}
                                                            >
                                                                <UserCheck className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Admin;

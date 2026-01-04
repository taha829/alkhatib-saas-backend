import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toastWithSound } from '@/lib/toast-with-sound';
import { Loader2, Upload, Save, User, ArrowRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BASE_URL } from "@/lib/api";
import Footer from "@/components/Footer";

interface UserProfile {
    id: number;
    name: string;
    email: string;
    avatar: string;
    role: string;
    expiry_date: string;
}

const Profile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setName(data.name || "");
                setEmail(data.email || "");
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, ...(password ? { password } : {}) }),
            });

            if (res.ok) {
                toastWithSound.success("Profile updated successfully");
                fetchProfile();
                setPassword("");
            } else {
                const err = await res.json();
                toastWithSound.error(err.error || "Failed to update profile");
            }
        } catch (error) {
            toastWithSound.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);

        const formData = new FormData();
        formData.append("avatar", e.target.files[0]);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/auth/profile/avatar`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                toastWithSound.success("Avatar updated!");

                // Update local storage and dispatch event to sync Header
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...storedUser, avatar: data.avatar };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('user-updated'));

                fetchProfile();
            } else {
                toastWithSound.error("Failed to upload avatar");
            }
        } catch (error) {
            toastWithSound.error("Upload error");
        } finally {
            setUploading(false);
        }
    };

    const navigate = useNavigate();
    const { signOut } = useAuth();

    // ... existing hooks

    const handleSignOut = async () => {
        await signOut();
        navigate("/auth");
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-background" dir="rtl">
            {/* Header */}
            <header className="border-b border-border/40 bg-card/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-primary/10">
                            <ArrowRight className="h-5 w-5" />
                        </Button>

                        <div className="flex items-center gap-3">
                            <img src="./logo.png" alt="Logo" className="h-10 w-10 rounded-xl shadow-sm object-cover border border-border/50" />
                            <div>
                                <h1 className="text-xl font-display font-black leading-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                    AL-Khatib
                                </h1>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Marketing & Software</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="text-muted-foreground hover:text-destructive gap-2" onClick={handleSignOut}>
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">تسجيل الخروج</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">إعدادات الحساب</h1>
                    <p className="text-muted-foreground mt-2">قم بإدارة ملفك الشخصي وتفضيلات الحساب</p>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Profile Card */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>الصورة الشخصية</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer">
                                <Avatar className="w-32 h-32 border-4 border-primary/10">
                                    <AvatarImage src={profile?.avatar?.startsWith('http') ? profile.avatar : `${BASE_URL}${profile?.avatar}`} />
                                    <AvatarFallback className="text-4xl">{profile?.name?.charAt(0) || <User />}</AvatarFallback>
                                </Avatar>
                                <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                    <Upload className="w-8 h-8" />
                                </label>
                                <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                            </div>
                            <div className="text-center">
                                <h3 className="font-semibold text-lg">{profile?.name || "مستخدم"}</h3>
                                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    {profile?.role}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details Edit */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>تعديل المعلومات</CardTitle>
                            <CardDescription>قم بتحديث معلوماتك الشخصية وكلمة المرور</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">الاسم الكامل</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل اسمك" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">كلمة المرور الجديدة (اختياري)</Label>
                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="اتركه فارغاً إذا لم ترد التغيير" />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={handleUpdate} disabled={saving} className="w-full sm:w-auto">
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    حفظ التغييرات
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Profile;

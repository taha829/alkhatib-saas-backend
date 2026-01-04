import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    LogOut,
    Settings,
    Moon,
    Sun,
    ChevronDown,
    Clock,
    Calendar,
    Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { whatsappApi, BASE_URL } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface HeaderProps {
    onNavigate?: (path: string) => void;
    onTabChange?: (tab: string) => void;
}

const Header = ({ onNavigate, onTabChange }: HeaderProps) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [settings, setSettings] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await whatsappApi.getSettings();
                setSettings(data);
            } catch (error) {
                console.error('Error fetching settings for header:', error);
            }
        };
        loadSettings();

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const clinicLogo = settings?.clinic_logo
        ? (settings.clinic_logo.startsWith('http') ? settings.clinic_logo : `${BASE_URL}${settings.clinic_logo}`)
        : '/logo.png';

    const clinicName = settings?.clinic_name || "نظام العيادة";
    const clinicDesc = settings?.clinic_description || "إدارة ذكية";

    // Format Date and Time in Arabic
    const timeString = currentTime.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    const dateString = currentTime.toLocaleDateString('ar-EG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <header className="sticky top-0 z-50 w-full bg-background/40 backdrop-blur-2xl border-b border-border/5">
            <div className="container flex h-16 items-center justify-between px-6 mx-auto max-w-7xl">

                {/* 1. Actions & Unified Profile (Moved to Right side in RTL) */}
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-10 w-10 hover:bg-muted/50 relative"
                            >
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-background"></span>
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl" sideOffset={8}>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/10 bg-muted/20">
                                <h4 className="font-bold text-sm">الإشعارات</h4>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        className="h-6 text-[10px] text-primary hover:bg-primary/10"
                                        onClick={() => markAllAsRead.mutate()}
                                    >
                                        تحديد الكل كمقروء
                                    </Button>
                                )}
                            </div>
                            <ScrollArea className="h-[300px]">
                                {notifications?.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                                        <Bell className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="text-xs">لا توجد إشعارات جديدة</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col p-1">
                                        {notifications?.slice(0, 10).map((notification) => (
                                            <DropdownMenuItem
                                                key={notification.id}
                                                className={`flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg mb-1 focus:bg-muted ${!notification.is_read ? 'bg-primary/5' : ''}`}
                                                onSelect={() => {
                                                    if (!notification.is_read) markAsRead.mutate(notification.id);
                                                }}
                                            >
                                                <div className="flex items-start w-full gap-3">
                                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notification.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                                                    <div className="flex-1 space-y-1">
                                                        <p className={`text-xs leading-none ${!notification.is_read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground/50 pt-1">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full h-10 w-10 hover:bg-muted/50 transition-all active:scale-90 relative group"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5 text-orange-400" /> : <Moon className="h-5 w-5 text-primary" />}
                        <span className="absolute -bottom-1 -left-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    </Button>

                    <div className="h-8 w-[1px] bg-border/10" />

                    {/* Elite Unified Profile Pill */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full bg-muted/20 hover:bg-muted/40 transition-all duration-500 group outline-none border border-border/5 hover:border-border/20 shadow-sm active:scale-95">
                                <ChevronDown className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />

                                <div className="flex flex-col items-start mr-1 text-right hidden sm:flex">
                                    <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter mb-0.5">
                                        مرحباً بك
                                    </span>
                                    <span className="text-[13px] font-black text-foreground/90 leading-tight">
                                        {user?.name ? (user.name.includes('د.') || user.name.startsWith('د ') ? user.name : `د. ${user.name}`) : "دكتور"}
                                    </span>
                                </div>

                                <div className="relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-primary rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500" />
                                    <div className="relative h-9 w-9 rounded-full bg-orange-600 flex items-center justify-center text-white overflow-hidden shadow-xl ring-2 ring-background">
                                        {user?.avatar ?
                                            <img
                                                src={user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`}
                                                className="h-full w-full object-cover"
                                            /> :
                                            <User className="h-5 w-5" />
                                        }
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="w-56 mt-4 p-2 rounded-2xl border-border/10 bg-card/95 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95"
                            sideOffset={8}
                        >
                            <div className="px-3 py-2">
                                <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.25em] mb-1">إدارة الحساب</div>
                                <div className="flex items-center gap-2 px-1">
                                    <div className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                                        {user?.role === 'admin' ? 'مدير النظام' : 'طبيب'}
                                    </div>
                                </div>
                            </div>
                            <DropdownMenuSeparator className="bg-border/5 my-2" />
                            <DropdownMenuItem
                                onSelect={() => {
                                    console.log('[Header] Navigating to profile');
                                    onNavigate ? onNavigate('/profile') : navigate('/profile');
                                }}
                                className="rounded-xl focus:bg-muted cursor-pointer gap-3 py-3 text-sm font-bold group"
                            >
                                <User className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                الملف الشخصي
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => {
                                    console.log('[Header] Changing tab to clinic-settings');
                                    onTabChange && onTabChange('clinic-settings');
                                }}
                                className="rounded-xl focus:bg-muted cursor-pointer gap-3 py-3 text-sm font-bold group"
                            >
                                <Settings className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                إعدادات النظام
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/5 my-2" />
                            <DropdownMenuItem
                                onSelect={() => {
                                    console.log('[Header] Signing out');
                                    signOut();
                                }}
                                className="rounded-xl focus:bg-destructive/10 focus:text-destructive text-destructive cursor-pointer gap-3 py-3 text-sm font-bold"
                            >
                                <LogOut className="h-4 w-4" />
                                تسجيل الخروج
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* 2. Professional Real-time Dynamic Clock (Center) */}
                <div className="hidden lg:flex items-center gap-6 bg-muted/20 px-6 py-1.5 rounded-2xl border border-border/10 shadow-inner">
                    <div className="flex items-center gap-2 text-primary/80">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-black font-mono tabular-nums leading-none min-w-[90px] text-center">
                            {timeString}
                        </span>
                    </div>
                    <div className="h-4 w-[1px] bg-border/20" />
                    <div className="flex items-center gap-2 text-muted-foreground/80">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-bold leading-none">
                            {dateString}
                        </span>
                    </div>
                </div>

                {/* 3. Spacer for balance (Left side in RTL) */}
                <div className="flex-1 lg:flex-none w-[200px] hidden sm:block" />
            </div>
        </header>
    );
};

export default Header;

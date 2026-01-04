import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Settings,
    LogOut,
    MessageCircle,
    Shield,
    Users,
    FileText,
    Calendar,
    LineChart,
    ExternalLink,
    Sparkles,
    Facebook,
    Instagram,
    Linkedin,
    Twitter
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { whatsappApi, BASE_URL } from "@/lib/api";

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
    const navigate = useNavigate();
    const { signOut, user } = useAuth();
    const [branding, setBranding] = useState({
        name: 'عيادتي',
        description: 'نظام إدارة العيادات',
        logo: './logo.png'
    });

    useEffect(() => {
        const loadBranding = async () => {
            try {
                const settings = await whatsappApi.getSettings();
                if (settings.clinic_name || settings.clinic_description || settings.clinic_logo) {
                    setBranding({
                        name: settings.clinic_name || 'عيادتي',
                        description: settings.clinic_description || 'نظام إدارة العيادات',
                        logo: settings.clinic_logo ? (settings.clinic_logo.startsWith('http') ? settings.clinic_logo : `${BASE_URL}${settings.clinic_logo}`) : './logo.png'
                    });
                }
            } catch (error) {
                console.error('Error loading branding:', error);
            }
        };
        loadBranding();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate("/auth");
    };

    const mainNavItems = [
        { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
        { id: 'whatsapp-bot', label: 'المحادثات', icon: MessageCircle },
        { id: 'contacts', label: 'المرضى', icon: Users },
        { id: 'appointments', label: 'المواعيد', icon: Calendar },
        { id: 'bot-stats', label: 'الإحصائيات', icon: LineChart },
        { id: 'templates', label: 'الرسائل الجاهزة', icon: FileText },
    ];

    return (
        <div className="w-full h-full bg-gradient-to-b from-card/80 to-card/50 backdrop-blur-xl border-l border-border/50 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <img
                        src={branding.logo}
                        alt="Logo"
                        className="h-10 w-10 rounded-xl shadow-glow object-cover transition-all duration-500 hover:scale-110"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = './logo.png';
                        }}
                    />
                    <div className="overflow-hidden">
                        <h1 className="text-xl font-display font-black leading-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate max-w-[150px]">
                            {branding.name}
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter truncate">
                            {branding.description}
                        </p>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 px-4 pt-4 pb-4">
                <nav className="space-y-1">
                    {mainNavItems.map((item) => (
                        <Button
                            key={item.id}
                            variant={activeTab === item.id ? "secondary" : "ghost"}
                            className={cn(
                                "w-full flex-row-reverse justify-start gap-3 transition-all duration-300 relative overflow-hidden group mb-1",
                                activeTab === item.id
                                    ? "bg-primary/10 text-primary shadow-sm font-bold border-r-4 border-primary rounded-l-lg rounded-r-none"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:translate-x-1"
                            )}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 transition-transform duration-300",
                                activeTab === item.id ? "scale-110" : "group-hover:scale-110"
                            )} />
                            <span className="text-sm">{item.label}</span>
                        </Button>
                    ))}

                    {user?.role === 'admin' && (
                        <Button
                            variant="ghost"
                            className="w-full flex-row-reverse justify-start gap-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 mt-4"
                            onClick={() => navigate('/admin')}
                        >
                            <Shield className="h-4 w-4" />
                            لوحة الإدارة
                        </Button>
                    )}
                </nav>
            </ScrollArea>

            {/* Sidebar Footer - Brand & Socials */}
            <div className="p-4 border-t border-border/50 bg-card/30 backdrop-blur-md">
                <div className="flex flex-col items-start gap-3">
                    {/* Brand (Line 1) */}
                    <a
                        href="https://alkhatib-marketing.great-site.net/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-row items-center gap-3 group cursor-pointer w-full"
                    >
                        <div className="relative flex-shrink-0">
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                            <img
                                src="/logo.png"
                                alt="Al-Khatib Logo"
                                className="relative h-10 w-10 rounded-full border border-white/10 shadow-lg object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://alkhatib-marketing.great-site.net/favicon.ico';
                                }}
                            />
                        </div>
                        <div className="flex flex-col items-start text-right">
                            <h2 className="text-[10px] font-black tracking-tighter bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent group-hover:from-orange-500 group-hover:to-amber-500 transition-all duration-500 flex items-center gap-1">
                                AL-KHATIB-MARKETING
                                <ExternalLink className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                            </h2>
                            <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                                <Sparkles className="h-2 w-2 text-amber-500 animate-spin-slow" />
                                Premium Digital Solutions
                            </div>
                        </div>
                    </a>

                    {/* Social Icons (Line 2) */}
                    <div className="flex items-center justify-start gap-2 w-full pr-1">
                        {[
                            { icon: Facebook, href: "https://www.facebook.com/alkhatib.marketing/" },
                            { icon: Instagram, href: "https://www.instagram.com/alkhatib.marketing/" },
                            { icon: Twitter, href: "https://twitter.com/alkhatib_mkt" },
                            { icon: Linkedin, href: "https://www.linkedin.com/company/alkhatib-marketing/" }
                        ].map((social, index) => (
                            <a
                                key={index}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-full border border-orange-500/30 text-orange-500 transition-all duration-500 hover:scale-110 hover:border-orange-500 hover:bg-orange-500 hover:text-white hover:shadow-[0_0_10px_rgba(249,115,22,0.4)] group"
                            >
                                <social.icon className="h-3 w-3 transition-transform duration-500 group-hover:rotate-[360deg]" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

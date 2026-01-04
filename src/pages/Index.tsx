import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useContacts } from "@/hooks/useContacts";
import { useTheme } from "@/hooks/useTheme";
import { TemplatesManager } from "@/components/TemplatesManager";
import AppointmentsCalendar from "@/components/AppointmentsCalendar";
import { PatientCard } from "@/components/PatientCard";
import WhatsAppBot from "./WhatsAppBot";
import { MedicalStatsCard } from "@/components/MedicalStatsCard";
import { AutoReplyToggle } from "@/components/AutoReplyToggle";
import { UpcomingAppointments } from "@/components/UpcomingAppointments";
import { ClinicStats } from "@/components/ClinicStats";
import ClinicSettings from "@/components/ClinicSettings";
import { appointmentsApi, whatsappApi, dataApi } from "@/lib/api";
import {
  Users,
  Bell,
  Loader2,
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  TrendingUp,
  MessageCircle,
  Calendar,
  Search,
  RefreshCw,
  UserPlus
} from "lucide-react";
import { Input } from "@/components/ui/input";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { contacts, isLoading: contactsLoading, exportContacts, deleteContact, updateStatus, syncContacts } = useContacts();

  const [stats, setStats] = useState<any>(null);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const [upcomingAppointmentsList, setUpcomingAppointmentsList] = useState<any[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");

  const filteredContacts = (contacts || []).filter((c: any) =>
    (c.name?.toLowerCase().includes(patientSearchTerm.toLowerCase())) ||
    (c.phone?.includes(patientSearchTerm))
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [statsData, settingsData, upcomingData] = await Promise.all([
          appointmentsApi.getStats(),
          whatsappApi.getSettings(),
          dataApi.get(`/appointments?date_from=${today}`)
        ]);
        setStats(statsData);
        setAiSettings(settingsData);
        setUpcomingAppointmentsList(upcomingData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    if (user && activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [user, activeTab]);

  const handleToggleAutoReply = async (active: boolean) => {
    try {
      await whatsappApi.updateSettings({ ...aiSettings, ai_enabled: active ? '1' : '0' });
      setAiSettings(prev => ({ ...prev, ai_enabled: active ? '1' : '0' }));
    } catch (error) {
      console.error('Error toggling auto-reply:', error);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">جاري التحويل...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden" dir="rtl">
      {/* Sidebar Area */}
      <aside className="w-80 flex-shrink-0 border-l border-border/50 bg-card/50 backdrop-blur-xl z-50">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          onNavigate={(path) => navigate(path)}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div style={{ animationDelay: '0s' }}>
                  <MedicalStatsCard
                    title="مرضى اليوم"
                    value={stats?.today_total || 0}
                    subtitle="إجمالي المواعيد"
                    icon={Users}
                    color="blue"
                  />
                </div>
                <div style={{ animationDelay: '0.1s' }}>
                  <MedicalStatsCard
                    title="حضر"
                    value={stats?.today_completed || 0}
                    subtitle="مريض حضر"
                    icon={CheckCircle2}
                    color="green"
                  />
                </div>
                <div style={{ animationDelay: '0.2s' }}>
                  <MedicalStatsCard
                    title="في الانتظار"
                    value={stats?.today_waiting || 0}
                    subtitle="مريض منتظر"
                    icon={Clock}
                    color="orange"
                  />
                </div>
                <div style={{ animationDelay: '0.3s' }}>
                  <MedicalStatsCard
                    title="معدل الحضور"
                    value={stats?.today_total > 0 ? `${Math.round((stats.today_completed / stats.today_total) * 100)}%` : "100%"}
                    subtitle={stats?.today_total > 0 ? "بناءً على مواعيد اليوم" : "النظام جديد"}
                    icon={TrendingUp}
                    color="purple"
                  />
                </div>
              </div>

              <AutoReplyToggle
                isActive={aiSettings?.ai_enabled === '1'}
                onToggle={handleToggleAutoReply}
              />

              <UpcomingAppointments
                appointments={upcomingAppointmentsList
                  .filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed')
                  .map(apt => ({
                    id: apt.id.toString(),
                    patientName: apt.patient_name || apt.customer_name,
                    time: new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    date: new Date(apt.appointment_date).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' }),
                    type: apt.appointment_type === 'consultation' ? 'استشارة' : apt.appointment_type,
                    status: apt.status === 'scheduled' ? 'scheduled' : 'confirmed'
                  }))}
                onViewAll={() => setActiveTab('appointments')}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab('whatsapp-bot')}>
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <MessageCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">عرض المحادثات</h3>
                      <p className="text-sm text-muted-foreground">تحدث مع المرضى عبر واتساب</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab('appointments')}>
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">التقويم الكامل</h3>
                      <p className="text-sm text-muted-foreground">عرض جميع المواعيد</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-6 animate-fade-in pb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-display font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">إدارة المرضى</h2>
                  <p className="text-muted-foreground mt-1">إجمالي المرضى المسجلين: {(contacts || []).length}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/20 hover:bg-primary/5 hidden md:flex"
                    onClick={() => syncContacts.mutate()}
                  >
                    <RefreshCw className={cn("h-4 w-4", syncContacts.isPending && "animate-spin")} />
                    مزامنة من واتساب
                  </Button>
                  <Button className="gradient-primary" onClick={exportContacts}>
                    تصدير البيانات
                  </Button>
                </div>
              </div>

              <div className="relative group max-w-2xl mx-auto mb-10">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none group-focus-within:text-primary transition-colors">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  className="w-full h-14 pr-12 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-lg"
                  placeholder="ابحث عن مريض بالاسم أو رقم الهاتف..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                />
              </div>

              {contactsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/50 animate-in fade-in zoom-in duration-700">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <Users className="h-20 w-20 text-primary/40 relative z-10" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">لا يوجد مرضى مطابقين</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-6">
                    لم نجد أي مريض يطابق بحثك. تأكد من كتابة الاسم أو الرقم بشكل صحيح، أو قم بمزامنة البيانات.
                  </p>
                  <Button variant="outline" className="rounded-full px-8 gap-2 border-primary/20 hover:bg-primary/5" onClick={() => syncContacts.mutate()}>
                    <RefreshCw className={cn("h-4 w-4", syncContacts.isPending && "animate-spin")} />
                    مزامنة المرضى الآن
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContacts.map((contact: any) => (
                    <PatientCard
                      key={contact.id}
                      id={contact.id}
                      name={contact.name}
                      phone={contact.phone}
                      status={contact.patient_status}
                      last_visit={contact.actual_last_visit || contact.last_visit}
                      total_appointments={contact.total_appointments}
                      last_diagnosis={contact.last_diagnosis}
                      medical_notes={contact.medical_notes}
                      blood_type={contact.blood_type}
                      allergies={contact.allergies}
                      chronic_diseases={contact.chronic_diseases}
                      onDelete={(id) => deleteContact.mutate(id)}
                      onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
                      onOpenChat={(phone) => {
                        setSelectedPhone(phone);
                        setActiveTab('whatsapp-bot');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && <TemplatesManager />}

          {activeTab === 'whatsapp-bot' && (
            <WhatsAppBot
              initialPhone={selectedPhone}
              initialName={selectedName}
              onBackCleanup={() => {
                setSelectedPhone(null);
                setSelectedName(null);
              }}
            />
          )}

          {activeTab === 'appointments' && <AppointmentsCalendar />}

          {activeTab === 'clinic-settings' && <ClinicSettings />}

          {activeTab === 'bot-stats' && <ClinicStats />}
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Index;

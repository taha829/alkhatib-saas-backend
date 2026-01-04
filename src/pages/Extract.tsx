import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useContacts } from "@/hooks/useContacts";
import DataExtractor from "@/components/DataExtractor";
import PlatformStats from "@/components/PlatformStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Download, Trash2, ArrowRight, Phone } from "lucide-react";

const Extract = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { contacts, isLoading: contactsLoading, exportContacts, deleteContact } = useContacts();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const platformColors: Record<string, string> = {
    facebook: 'bg-blue-600',
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    twitter: 'bg-sky-500',
    linkedin: 'bg-blue-700',
    tiktok: 'bg-foreground',
    youtube: 'bg-red-600',
    telegram: 'bg-sky-500',
    whatsapp: 'bg-green-600',
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">استخراج البيانات</h1>
            <p className="text-muted-foreground">
              استخرج أرقام الهواتف والبيانات من جميع منصات التواصل الاجتماعي
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Extractor */}
          <div className="lg:col-span-2 space-y-6">
            <DataExtractor />
            
            {/* Contacts List */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    جهات الاتصال المستخرجة
                  </CardTitle>
                  <CardDescription>
                    {contacts.length} جهة اتصال
                  </CardDescription>
                </div>
                {contacts.length > 0 && (
                  <Button variant="outline" size="sm" onClick={exportContacts}>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير CSV
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {contactsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">لا توجد جهات اتصال مستخرجة بعد</p>
                    <p className="text-sm mt-2">أدخل رابط أو نص لبدء الاستخراج</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {contacts.map((contact) => (
                      <div 
                        key={contact.id} 
                        className="p-4 rounded-lg border border-border bg-background/50 flex items-center justify-between hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-10 rounded-full ${platformColors[contact.platform] || 'bg-muted'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">
                                {contact.name || 'غير معروف'}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {contact.platform}
                              </Badge>
                            </div>
                            <p className="text-sm text-primary font-mono" dir="ltr">
                              {contact.phone}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {contact.extracted_from}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteContact.mutate(contact.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  إحصائيات عامة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-3xl font-bold text-primary">{contacts.length}</p>
                    <p className="text-sm text-muted-foreground">إجمالي جهات الاتصال</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                      <p className="text-xl font-bold text-foreground">
                        {new Set(contacts.map(c => c.platform)).size}
                      </p>
                      <p className="text-xs text-muted-foreground">منصات</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                      <p className="text-xl font-bold text-foreground">
                        {contacts.filter(c => c.name).length}
                      </p>
                      <p className="text-xs text-muted-foreground">بأسماء</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <PlatformStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Extract;

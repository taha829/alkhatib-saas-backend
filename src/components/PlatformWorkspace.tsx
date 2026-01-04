import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useDataExtraction } from "@/hooks/useDataExtraction";
import { Loader2, Link as LinkIcon, FileText, Download, Phone } from "lucide-react";
import { toastWithSound } from '@/lib/toast-with-sound';
import { ContactCard } from "./ContactCard";

interface PlatformWorkspaceProps {
    platform: string;
    platformInfo: { name: string; color: string; icon: string };
    contacts: any[];
    onExport: () => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: string) => void;
    onOpenChat?: (phone: string, name?: string) => void;
}

const PlatformWorkspace = ({ platform, platformInfo, contacts, onExport, onDelete, onUpdateStatus, onOpenChat }: PlatformWorkspaceProps) => {
    const [url, setUrl] = useState("");
    const [text, setText] = useState("");
    const { extractFromUrl, extractFromText, isExtracting } = useDataExtraction();

    const handleExtractFromUrl = async () => {
        if (!url.trim()) {
            toastWithSound.error("الرجاء إدخال رابط صالح");
            return;
        }
        await extractFromUrl(url, platform);
        setUrl("");
    };

    const handleExtractFromText = async () => {
        if (!text.trim()) {
            toastWithSound.error("الرجاء إدخال نص للاستخراج");
            return;
        }
        await extractFromText(text, platform);
        setText("");
    };

    const platformColors: Record<string, string> = {
        facebook: 'bg-blue-600',
        instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
        twitter: 'bg-sky-500',
        linkedin: 'bg-blue-700',
        youtube: 'bg-red-600',
        whatsapp: 'bg-green-600',
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Platform Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${platformColors[platform] || 'bg-primary'} shadow-lg`}>
                        <span className="text-4xl">{platformInfo.icon}</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-display font-bold">{platformInfo.name}</h2>
                        <p className="text-muted-foreground">استخراج وإدارة البيانات من {platformInfo.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-center px-6 py-3 rounded-lg bg-card border border-border">
                        <p className="text-2xl font-bold text-primary">{contacts.length}</p>
                        <p className="text-xs text-muted-foreground">جهة اتصال</p>
                    </div>
                    {contacts.length > 0 && (
                        <Button onClick={onExport} className="gap-2">
                            <Download className="h-4 w-4" />
                            تصدير CSV
                        </Button>
                    )}
                </div>
            </div>

            {/* Extraction Tools */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-primary" />
                        أدوات الاستخراج
                    </CardTitle>
                    <CardDescription>استخرج أرقام الهواتف من {platformInfo.name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="url" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="url">من رابط</TabsTrigger>
                            <TabsTrigger value="text">من نص</TabsTrigger>
                        </TabsList>

                        <TabsContent value="url" className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">رابط {platformInfo.name}</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={`أدخل رابط من ${platformInfo.name}...`}
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        disabled={isExtracting}
                                    />
                                    <Button
                                        onClick={handleExtractFromUrl}
                                        disabled={isExtracting}
                                        className="gap-2 min-w-[120px]"
                                    >
                                        {isExtracting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                جاري الاستخراج...
                                            </>
                                        ) : (
                                            <>
                                                <LinkIcon className="h-4 w-4" />
                                                استخراج
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="text" className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">النص</label>
                                <Textarea
                                    placeholder="الصق النص هنا..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    disabled={isExtracting}
                                    rows={5}
                                />
                                <Button
                                    onClick={handleExtractFromText}
                                    disabled={isExtracting}
                                    className="gap-2 w-full"
                                >
                                    {isExtracting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            جاري الاستخراج...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="h-4 w-4" />
                                            استخراج من النص
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Results */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        النتائج المستخرجة ({contacts.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {contacts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">لا توجد نتائج بعد</p>
                            <p className="text-sm mt-2">استخدم أدوات الاستخراج أعلاه للبدء</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto p-1">
                            {contacts.map((contact: any) => (
                                <ContactCard
                                    key={contact.id}
                                    id={contact.id}
                                    name={contact.name}
                                    phone={contact.phone}
                                    source={contact.source}
                                    platform={contact.platform}
                                    extractedFrom={contact.extracted_from}
                                    status={contact.status}
                                    onDelete={onDelete}
                                    onUpdateStatus={onUpdateStatus}
                                    onOpenChat={onOpenChat}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PlatformWorkspace;

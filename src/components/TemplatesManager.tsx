import { useState } from "react";
import { useTemplates, Template } from "@/hooks/useTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, MessageSquare, Loader2, ShieldCheck } from "lucide-react";

export const TemplatesManager = () => {
    const { templates = [], addTemplate, deleteTemplate, updateTemplate, isLoading } = useTemplates();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
    const [trigger, setTrigger] = useState("");
    const [response, setResponse] = useState("");

    const handleOpenDialog = (template?: Template) => {
        if (template) {
            setCurrentTemplate(template);
            setTrigger(template.trigger);
            setResponse(template.response);
        } else {
            setCurrentTemplate(null);
            setTrigger("");
            setResponse("");
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!trigger.trim() || !response.trim()) return;

        if (currentTemplate) {
            await updateTemplate(currentTemplate.id, trigger, response);
        } else {
            await addTemplate(trigger, response);
        }
        setIsDialogOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">جاري تحميل القواعد الذكية...</p>
            </div>
        );
    }

    // Ensure templates is always an array to prevent .map crashes
    const templateList = Array.isArray(templates) ? templates : [];

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        إدارة الردود الآلية
                    </h2>
                    <p className="text-muted-foreground mt-1">قم ببرمجة الكلمات المفتاحية والردود التي سيقوم البوت بإرسالها تلقائياً</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2 gradient-primary shadow-lg shadow-primary/20 rounded-xl px-6 h-11">
                            <Plus className="h-5 w-5" />
                            رد آلي جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">{currentTemplate ? "تعديل الرد الآلي" : "إضافة رد آلي جديد"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    الكلمة المفتاحية (Trigger)
                                </label>
                                <Input
                                    placeholder="مثال: السعر، الموعد، العنوان"
                                    className="h-12 rounded-xl border-border/50 focus:ring-primary/20"
                                    value={trigger}
                                    onChange={(e) => setTrigger(e.target.value)}
                                />
                                <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/5">عندما يرسل العميل هذه الكلمة، سيقوم البوت بالرد تلقائياً</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    نص الرد الآلي (Response)
                                </label>
                                <Textarea
                                    placeholder="اكتب نص الرد هنا..."
                                    className="min-h-[150px] rounded-xl border-border/50 focus:ring-primary/20 py-3 leading-relaxed"
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl flex-1 sm:flex-none">إلغاء</Button>
                            <Button onClick={handleSave} className="gradient-primary rounded-xl px-8 flex-1 sm:flex-none">
                                {currentTemplate ? "حفظ التعديلات" : "إضافة الرد"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl shadow-black/5 overflow-hidden rounded-3xl">
                <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="flex items-center gap-2.5 text-lg">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        القواعد النشطة ({templateList.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {templateList.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-border">
                                <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <p className="text-muted-foreground font-medium mb-1">لا توجد قواعد رد آلي حتى الآن</p>
                            <p className="text-xs text-muted-foreground/50 mb-6">ابدأ ببرمجة الكلمات المفتاحية لتسهيل الرد على العملاء</p>
                            <Button onClick={() => handleOpenDialog()} variant="outline" className="rounded-xl gap-2 hover:bg-primary hover:text-white transition-all">
                                <Plus className="h-4 w-4" />
                                أضف أول قاعدة
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-border/50">
                                        <TableHead className="text-right font-bold h-12">الكلمة المفتاحية</TableHead>
                                        <TableHead className="text-right font-bold h-12">نص الرد</TableHead>
                                        <TableHead className="w-[120px] text-left font-bold h-12">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templateList.map((template) => (
                                        <TableRow key={template.id} className="border-border/50 hover:bg-muted/10 transition-colors">
                                            <TableCell className="font-bold">
                                                <span className="px-3 py-1 rounded-full bg-primary/5 text-primary text-xs border border-primary/10">
                                                    {template.trigger}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-md" dir="auto">
                                                <div className="line-clamp-2 text-sm leading-relaxed">
                                                    {template.response}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)} className="h-9 w-9 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-colors">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteTemplate(template.id)} className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

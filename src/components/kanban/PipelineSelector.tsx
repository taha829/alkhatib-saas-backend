import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toastWithSound } from '@/lib/toast-with-sound';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Pipeline {
    id: number;
    name: string;
    is_default: number;
}

interface PipelineSelectorProps {
    currentPipeline: number | null;
    onChange: (id: number) => void;
}

export function PipelineSelector({ currentPipeline, onChange }: PipelineSelectorProps) {
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [newPipelineName, setNewPipelineName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchPipelines();
    }, []);

    const fetchPipelines = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/crm/pipelines', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setPipelines(data);
            if (!currentPipeline && data.length > 0) {
                // Determine default
                const def = data.find((p: Pipeline) => p.is_default) || data[0];
                onChange(def.id);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async () => {
        if (!newPipelineName.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/crm/pipelines', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newPipelineName })
            });
            if (res.ok) {
                toastWithSound.success('تم إنشاء المسار بنجاح');
                setNewPipelineName("");
                setIsDialogOpen(false);
                fetchPipelines();
            }
        } catch (error) {
            toastWithSound.error('فشل الإنشاء');
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={currentPipeline?.toString()} onValueChange={(val) => onChange(Number(val))}>
                <SelectTrigger className="w-[180px] bg-card/60 backdrop-blur-sm">
                    <SelectValue placeholder="اختر المسار" />
                </SelectTrigger>
                <SelectContent>
                    {pipelines.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-card/60"><Plus className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إضافة مسار مبيعات جديد</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2 mt-4">
                        <Input
                            placeholder="اسم المسار (مثلاً: العقارات، الدعم الفني)"
                            value={newPipelineName}
                            onChange={e => setNewPipelineName(e.target.value)}
                        />
                        <Button onClick={handleCreate}>إنشاء</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

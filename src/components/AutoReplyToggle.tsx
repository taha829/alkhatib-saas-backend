import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

interface AutoReplyToggleProps {
    isActive?: boolean;
    onToggle?: (active: boolean) => void;
}

export function AutoReplyToggle({ isActive = false, onToggle }: AutoReplyToggleProps) {
    const [active, setActive] = useState(isActive);

    // Sync state with prop if it changes externally
    useEffect(() => {
        setActive(isActive);
    }, [isActive]);

    const handleToggle = (checked: boolean) => {
        setActive(checked);
        onToggle?.(checked);
    };

    return (
        <Card className={cn(
            "p-6 border-border/50 backdrop-blur-sm transition-all duration-500",
            active ? "bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]" : "bg-card/50"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-xl border transition-colors duration-500",
                        active ? "bg-green-500/10 border-green-500/20" : "bg-muted/50 border-border"
                    )}>
                        <MessageCircle className={cn(
                            "h-6 w-6",
                            active ? "text-green-600" : "text-muted-foreground"
                        )} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-1">الرد التلقائي (AI)</h3>
                        <p className="text-sm text-muted-foreground">
                            {active ? "نشط - يرد على المرضى تلقائياً بالذكاء الاصطناعي" : "متوقف - التحكم يدوي حالياً"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={active ? "default" : "secondary"} className={cn(
                        "px-3 py-1 transition-all duration-500",
                        active ? "bg-green-500 hover:bg-green-600 text-white" : ""
                    )}>
                        {active ? "🟢 نشط" : "⚪ غير مفعل"}
                    </Badge>
                    <Switch
                        checked={active}
                        onCheckedChange={handleToggle}
                        className="data-[state=checked]:bg-green-500"
                    />
                </div>
            </div>
        </Card>
    );
}

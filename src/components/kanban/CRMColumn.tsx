import { CRMCard } from './CRMCard';
import { cn } from '@/lib/utils';
import { Search, UserPlus, Star, CheckCircle, XCircle } from 'lucide-react';

interface CRMColumnProps {
    id: string;
    title: string;
    contacts: any[];
    color: string;
    onDeleteContact?: (id: string) => void;
    onUpdateStatus?: (id: string, newStatus: string) => void;
    onOpenChat?: (phone: string, name?: string) => void;
}

export function CRMColumn({ id, title, contacts, color, onDeleteContact, onUpdateStatus, onOpenChat }: CRMColumnProps) {
    const getIcon = () => {
        switch (id) {
            case 'new': return <UserPlus className="h-4 w-4" />;
            case 'interested': return <Star className="h-4 w-4" />;
            case 'customer': return <CheckCircle className="h-4 w-4" />;
            case 'junk': return <XCircle className="h-4 w-4" />;
            default: return <Search className="h-4 w-4" />;
        }
    };

    return (
        <div className={cn(
            "flex flex-col h-full flex-1 min-w-[220px] rounded-2xl transition-all duration-300",
            "bg-muted/10 border border-border/40 backdrop-blur-sm shadow-inner",
        )}>
            {/* Column Header */}
            <div className="p-3 flex items-center justify-between sticky top-0 z-10 bg-muted/5 backdrop-blur-md rounded-t-2xl border-b border-border/20">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg text-white shadow-lg" style={{ backgroundColor: color }}>
                        {getIcon()}
                    </div>
                    <h3 className="font-bold text-sm text-foreground/80">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background border border-border/50 shadow-sm text-muted-foreground">
                        {contacts.length}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div
                className={cn(
                    "flex-1 p-3 overflow-y-auto scrollbar-hide space-y-1 transition-colors duration-200",
                )}
            >
                {contacts.length > 0 ? (
                    contacts.map((contact) => (
                        <CRMCard
                            key={contact.id}
                            contact={contact}
                            onDelete={onDeleteContact}
                            onUpdateStatus={onUpdateStatus}
                            onOpenChat={onOpenChat}
                        />
                    ))
                ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border/30 rounded-xl bg-muted/5 opacity-60">
                        <div className="p-2 rounded-full bg-muted/10 mb-2">
                            {getIcon()}
                        </div>
                        <span>لا توجد بيانات حالياً</span>
                    </div>
                )}
            </div>

            {/* Subtle glow effect at bottom */}
            <div className="h-2 rounded-b-2xl opacity-20" style={{ backgroundColor: color }}></div>
        </div>
    );
}

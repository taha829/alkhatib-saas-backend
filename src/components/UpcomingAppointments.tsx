import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Appointment {
    id: string;
    patientName: string;
    time: string;
    date?: string; // Add optional date string
    type: string;
    status: "scheduled" | "confirmed" | "waiting";
}

interface UpcomingAppointmentsProps {
    appointments?: Appointment[];
    onViewAll?: () => void;
}

const statusConfig = {
    scheduled: { label: "محجوز", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    confirmed: { label: "مؤكد", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    waiting: { label: "في الانتظار", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
};

export function UpcomingAppointments({ appointments = [], onViewAll }: UpcomingAppointmentsProps) {
    const displayAppointments = appointments;

    return (
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">المواعيد القادمة</h3>
                        <p className="text-xs text-muted-foreground">جدول المواعيد المحجوزة</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onViewAll} className="text-primary hover:text-primary/80">
                    عرض الكل
                    <ChevronLeft className="h-4 w-4 mr-1" />
                </Button>
            </div>

            <div className="space-y-3">
                {displayAppointments.map((appointment) => (
                    <div
                        key={appointment.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-muted/20 hover:bg-muted/50 transition-all duration-300 border border-border/30 hover:border-primary/20 hover:shadow-md cursor-pointer"
                    >
                        <div className="flex items-start gap-4 mb-3 sm:mb-0">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-50 transition-opacity" />
                                <div className="relative p-2.5 rounded-xl bg-background border border-border/50 shadow-sm">
                                    <User className="h-5 w-5 text-primary/70" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                    {appointment.patientName}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-secondary/50">
                                        {appointment.type}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-1">
                            {appointment.date && (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/50 px-2.5 py-1 rounded-lg border border-border/20">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{appointment.date}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-foreground/80 bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                <span>{appointment.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {displayAppointments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/30">
                    <Calendar className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-sm font-medium">لا توجد مواعيد قادمة</p>
                </div>
            )}
        </Card>
    );
}

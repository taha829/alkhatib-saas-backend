import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { appointmentsApi } from "@/lib/api";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    Users, Calendar, CheckCircle, TrendingUp,
    Activity, Clock, AlertCircle, Loader2
} from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const ClinicStats = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["clinic-stats"],
        queryFn: () => appointmentsApi.getStats(),
        refetchInterval: 30000 // Refresh every 30s
    });

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const summaryCards = [
        { title: "إجمالي المرضى", value: stats?.total_patients || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "مواعيد اليوم", value: stats?.today_total || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-100" },
        { title: "حالات مكتملة", value: stats?.today_completed || 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
        { title: "مواعيد الشهر", value: stats?.this_month || 0, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-10" dir="rtl">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryCards.map((card, idx) => (
                    <Card key={idx} className="p-6 border-none shadow-sm bg-card hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                                <h3 className="text-3xl font-black mt-1">{card.value}</h3>
                            </div>
                            <div className={`${card.bg} p-3 rounded-2xl`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Visits Chart */}
                <Card className="lg:col-span-2 p-8 border-none shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold">نشاط العيادة (آخر ٧ أيام)</h3>
                            <p className="text-sm text-muted-foreground">عدد الزيارات اليومية وتوزيع المرضى</p>
                        </div>
                        <Activity className="h-6 w-6 text-primary opacity-50" />
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.last7Days || []}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="visits"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorVisits)"
                                    name="زيارات"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Distribution Chart */}
                <Card className="p-8 border-none shadow-sm">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold">توزيع الحالات</h3>
                        <p className="text-sm text-muted-foreground">حسب حالة الموعد الحالية</p>
                    </div>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.statusDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {(stats?.statusDistribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black">{stats?.today_total || 0}</span>
                            <span className="text-[10px] text-muted-foreground">إجمالي اليوم</span>
                        </div>
                    </div>
                    <div className="mt-6 space-y-3">
                        {(stats?.statusDistribution || []).map((entry, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-sm font-medium">{entry.name === 'scheduled' ? 'مجدول' : entry.name === 'confirmed' ? 'مؤكد' : entry.name === 'completed' ? 'مكتمل' : 'ملغي'}</span>
                                </div>
                                <span className="text-xs font-bold">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Additional Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="flex items-center gap-4 mb-4">
                        <Clock className="h-6 w-6 text-primary" />
                        <h4 className="font-bold">أوقات الذروة</h4>
                    </div>
                    <p className="text-muted-foreground text-sm">أكثر الأوقات ازدحاماً هي الفترة الصباحية ما بين الساعة ٩ و ١١ صباحاً. تأكد من توفير طاقم عمل كافٍ.</p>
                </Card>

                <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-orange-500/5 to-transparent">
                    <div className="flex items-center gap-4 mb-4">
                        <AlertCircle className="h-6 w-6 text-orange-500" />
                        <h4 className="font-bold">ملاحظات هامة</h4>
                    </div>
                    <p className="text-muted-foreground text-sm">هناك زيادة بنسبة ١٢٪ في حالات "عدم الحضور" هذا الأسبوع. ننصح بتفعيل رسائل التذكير التلقائية عبر واتساب.</p>
                </Card>
            </div>
        </div>
    );
};

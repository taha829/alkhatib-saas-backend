import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { MessageSquare, Zap, ArrowUpRight, TrendingUp, Users } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function BotAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:3001/api/whatsapp/analytics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) return <div className="p-12 text-center text-muted-foreground">جاري تحميل الإحصائيات...</div>;

    const stats = [
        { title: 'إجمالي الردود الآلية', value: data.stats.auto_replies, icon: Zap, color: 'text-yellow-500' },
        { title: 'الرسائل المستلمة', value: data.stats.incoming_messages, icon: MessageSquare, color: 'text-blue-500' },
        { title: 'الرسائل المرسلة', value: data.stats.outgoing_messages, icon: ArrowUpRight, color: 'text-green-500' },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold">إحصائيات البوت</h2>
                    <p className="text-sm text-muted-foreground">نظرة عامة على أداء نظام الرد الآلي</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-20" />
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-border/50 bg-card/50 backdrop-blur">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{stat.title}</p>
                                    <p className="text-3xl font-display font-bold">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-muted/50 ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Triggers Chart */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg">أكثر الكلمات المفتاحية استخداماً</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topTriggers} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="trigger"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Engagement Distribution */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg">توزيع التفاعل</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'ردود آلية', value: data.stats.auto_replies },
                                        { name: 'رسائل يدوية', value: data.stats.outgoing_messages - data.stats.auto_replies },
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {[0, 1].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold text-lg">
                                    {Math.round((data.stats.auto_replies / data.stats.outgoing_messages) * 100) || 0}%
                                    <tspan x="50%" dy="1.2em" fontSize="10" className="fill-muted-foreground font-normal">أتمتة</tspan>
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

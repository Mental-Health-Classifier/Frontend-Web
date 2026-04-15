import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Activity, Brain } from "lucide-react";

const trendData = [
  { date: "Mon", stress: 65, depression: 45, anxiety: 72 },
  { date: "Tue", stress: 72, depression: 48, anxiety: 68 },
  { date: "Wed", stress: 58, depression: 42, anxiety: 65 },
  { date: "Thu", stress: 75, depression: 52, anxiety: 78 },
  { date: "Fri", stress: 68, depression: 38, anxiety: 70 },
  { date: "Sat", stress: 45, depression: 32, anxiety: 55 },
  { date: "Sun", stress: 62, depression: 40, anxiety: 68 },
];

interface MetricCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  bgGradient: string;
}

const metrics: MetricCard[] = [
  {
    title: "Last Status",
    value: "Depression",
    description: "45% confidence",
    icon: <Brain className="h-6 w-6" />,
    bgGradient: "from-[#0369C2]/90 to-[#0369C2]",
  },
  {
    title: "Total Analyses",
    value: "24",
    description: "In the last 7 days",
    icon: <Activity className="h-6 w-6" />,
    bgGradient: "from-[#8680C6]/90 to-[#8680C6]",
  },
  {
    title: "Dominant Condition",
    value: "Anxiety",
    description: "Avg 68% across week",
    icon: <TrendingUp className="h-6 w-6" />,
    bgGradient: "from-[#8680C6]/80 to-[#8680C6]",
  },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-8rem)] bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
              Your Mental Health Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your emotional patterns and understand your mental health trends
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <Card
                key={metric.title}
                className="border border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div
                  className={`bg-gradient-to-br ${metric.bgGradient} p-6 text-white bg-clip-padding`}
                >
                  <div className="flex items-start justify-between mb-4">                    <div>
                      <p className="text-sm font-medium opacity-90">{metric.title}</p>
                      <h2 className="font-heading font-bold text-2xl mt-1">
                        {metric.value}
                      </h2>
                    </div>
                    <div className="opacity-75">{metric.icon}</div>
                  </div>
                  <p className="text-xs opacity-75">{metric.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Chart Section */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">
                Condition Trend (Last 7 Days)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    stroke="#F2393D"
                    strokeWidth={2}
                    dot={{ fill: "#F2393D", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Stress"
                  />
                  <Line
                    type="monotone"
                    dataKey="depression"
                    stroke="#0369C2"
                    strokeWidth={2}
                    dot={{ fill: "#0369C2", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Depression"
                  />
                  <Line
                    type="monotone"
                    dataKey="anxiety"
                    stroke="#8680C6"
                    strokeWidth={2}
                    dot={{ fill: "#8680C6", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Anxiety"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History Panel */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-heading font-bold text-xl text-foreground mb-6">
              Recent Sessions
            </h2>
            <div className="space-y-3">
              {[
                { date: "Today 2:45 PM", status: "Anxiety", confidence: 72 },
                { date: "Today 10:20 AM", status: "Stress", confidence: 68 },
                { date: "Yesterday 4:15 PM", status: "Depression", confidence: 58 },
                { date: "Yesterday 1:30 PM", status: "Anxiety", confidence: 75 },
                { date: "2 days ago", status: "Normal", confidence: 42 },
              ].map((session, idx) => {
                let statusColor = "hsl(var(--foreground))";
                if (session.status === "Depression") statusColor = "#0369C2";
                if (session.status === "Anxiety") statusColor = "#8680C6";
                if (session.status === "Stress") statusColor = "#F2393D";
                
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: statusColor }}
                      />
                      <div>
                        <p className="font-medium text-sm text-foreground" style={{ color: statusColor }}>
                          {session.status}
                        </p>
                        <p className="text-xs text-muted-foreground">{session.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm" style={{ color: statusColor }}>
                        {session.confidence}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

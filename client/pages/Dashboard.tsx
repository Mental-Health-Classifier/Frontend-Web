import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Activity, Brain, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { xaiApi } from "@/lib/api";

interface Prediction {
  id: string;
  input_text: string;
  category: string;
  confidence: number;
  created_at: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  bgGradient: string;
}

export default function Dashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await xaiApi.getHistory();
        setPredictions(res.data ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derive metrics from real data
  const lastPrediction = predictions.length > 0 ? predictions[0] : null;
  const totalAnalyses = predictions.length;

  // Count categories
  const categoryCounts: Record<string, number> = {};
  predictions.forEach((p) => {
    const cat = p.category || "Unknown";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const dominantCondition = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  const metrics: MetricCard[] = [
    {
      title: "Last Status",
      value: lastPrediction?.category ?? "—",
      description: lastPrediction ? `${Math.round(lastPrediction.confidence * 100)}% confidence` : "No data yet",
      icon: <Brain className="h-6 w-6" />,
      bgGradient: "from-[#0369C2]/90 to-[#0369C2]",
    },
    {
      title: "Total Analyses",
      value: totalAnalyses,
      description: "All time",
      icon: <Activity className="h-6 w-6" />,
      bgGradient: "from-[#8680C6]/90 to-[#8680C6]",
    },
    {
      title: "Dominant Condition",
      value: dominantCondition ? dominantCondition[0] : "—",
      description: dominantCondition ? `${dominantCondition[1]} occurrences` : "No data yet",
      icon: <TrendingUp className="h-6 w-6" />,
      bgGradient: "from-[#8680C6]/80 to-[#8680C6]",
    },
  ];

  // Build trend data from real predictions (group by day)
  const dayMap: Record<string, { stress: number; depression: number; anxiety: number; count: number }> = {};
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  predictions.forEach((p) => {
    const d = new Date(p.created_at);
    const dayKey = d.toLocaleDateString("en-US", { weekday: "short" });
    if (!dayMap[dayKey]) dayMap[dayKey] = { stress: 0, depression: 0, anxiety: 0, count: 0 };
    dayMap[dayKey].count++;

    const conf = Math.round(p.confidence * 100);
    const cat = (p.category || "").toLowerCase();
    if (cat.includes("stress")) dayMap[dayKey].stress += conf;
    else if (cat.includes("depr")) dayMap[dayKey].depression += conf;
    else if (cat.includes("anxi") || cat.includes("cemas")) dayMap[dayKey].anxiety += conf;
  });

  const trendData = dayLabels.map((day) => {
    const d = dayMap[day];
    if (!d || d.count === 0) return { date: day, stress: 0, depression: 0, anxiety: 0 };
    return {
      date: day,
      stress: Math.round(d.stress / d.count),
      depression: Math.round(d.depression / d.count),
      anxiety: Math.round(d.anxiety / d.count),
    };
  });

  // Build recent sessions list
  const recentSessions = predictions.slice(0, 5).map((p) => ({
    date: new Date(p.created_at).toLocaleString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    }),
    status: p.category || "Unknown",
    confidence: Math.round(p.confidence * 100),
  }));

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[calc(100vh-8rem)] bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

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
              {recentSessions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada sesi analisis. Mulai dari halaman Chat.
                </p>
              )}
              {recentSessions.map((session, idx) => {
                let statusColor = "hsl(var(--foreground))";
                const cat = session.status.toLowerCase();
                if (cat.includes("depr")) statusColor = "#0369C2";
                if (cat.includes("anxi") || cat.includes("cemas")) statusColor = "#8680C6";
                if (cat.includes("stress")) statusColor = "#F2393D";
                
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

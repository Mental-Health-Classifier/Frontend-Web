import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Activity, Brain, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { xaiApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";

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
  bgClass: string;
}

const classificationMap = {
  depression: { label: "Depresi", color: "#0369C2" },
  anxiety: { label: "Cemas", color: "#8680C6" },
  stress: { label: "Stres", color: "#F2393D" },
};

export default function Dashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await xaiApi.getHistory();
        const items: Prediction[] = res.data ?? [];
        items.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setPredictions(items);
      } catch (err) {
        setError("Gagal memuat riwayat. Coba muat ulang halaman.");
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
    const cat = p.category || "Tidak diketahui";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const dominantCondition = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  const metrics: MetricCard[] = [
    {
      title: "Latest Status",
      value: lastPrediction?.category ?? "—",
      description: lastPrediction ? `${lastPrediction.confidence > 1 ? Math.round(lastPrediction.confidence) : Math.round(lastPrediction.confidence * 100)}% Confidence Score` : "No data yet",
      icon: <Brain className="h-6 w-6" />,
      bgClass: "bg-primary",
    },
    {
      title: "Total Analysis",
      value: totalAnalyses,
      description: "All time",
      icon: <Activity className="h-6 w-6" />,
      bgClass: "bg-foreground",
    },
    {
      title: "Dominant Condition",
      value: dominantCondition ? dominantCondition[0] : "—",
      description: dominantCondition ? `${dominantCondition[1]} kemunculan` : "No data yet",
      icon: <TrendingUp className="h-6 w-6" />,
      bgClass: "bg-accent",
    },
  ];

  // Build trend data from real predictions (group by day)
  const dayMap: Record<string, { stress: number; depression: number; anxiety: number; count: number }> = {};
  const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const dayLabelMap: Record<string, string> = { "Sun": "Min", "Mon": "Sen", "Tue": "Sel", "Wed": "Rab", "Thu": "Kam", "Fri": "Jum", "Sat": "Sab" };

  predictions.forEach((p) => {
    const d = new Date(p.created_at);
    const dayKeyEn = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayKey = dayLabelMap[dayKeyEn] || dayKeyEn;
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

  // Recent sessions from backend predictions
  const recentSessions = predictions.slice(0, 5).map((p) => ({
    id: p.id,
    date: new Date(p.created_at).toLocaleString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    }),
    status: p.category || "Tidak diketahui",
    confidence: p.confidence > 1 ? Math.round(p.confidence) : Math.round(p.confidence * 100),
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

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-[calc(100vh-8rem)] bg-background flex flex-col items-center justify-center gap-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary underline underline-offset-4"
          >
            Muat ulang
          </button>
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
              Dashboard Kesehatan Mental Anda
            </h1>
            <p className="text-muted-foreground">
              Pantau pola emosional dan pahami tren kesehatan mental Anda
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <Card
                key={metric.title}
                className="border border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`${metric.bgClass} p-6 text-white`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
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
                Condition Trends (Last 7 Days)
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
                    stroke={classificationMap.stress.color}
                    strokeWidth={2}
                    dot={{ fill: classificationMap.stress.color, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Stres"
                  />
                  <Line
                    type="monotone"
                    dataKey="depression"
                    stroke={classificationMap.depression.color}
                    strokeWidth={2}
                    dot={{ fill: classificationMap.depression.color, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Depresi"
                  />
                  <Line
                    type="monotone"
                    dataKey="anxiety"
                    stroke={classificationMap.anxiety.color}
                    strokeWidth={2}
                    dot={{ fill: classificationMap.anxiety.color, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Cemas"
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
                  Belum ada sesi analisis. Mulai dari halaman Obrolan.
                </p>
              )}
              {recentSessions.map((session, idx) => {
                const catLower = session.status.toLowerCase();
                let indicatorColor = "hsl(var(--primary))";
                if (catLower.includes("depr")) indicatorColor = classificationMap.depression.color;
                else if (catLower.includes("anxi") || catLower.includes("cemas")) indicatorColor = classificationMap.anxiety.color;
                else if (catLower.includes("stress")) indicatorColor = classificationMap.stress.color;

                return (
                  <button
                    key={idx}
                    onClick={() => navigate(`/chat?session_id=${session.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors border border-border text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicatorColor }} />
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {session.status}
                        </p>
                        <p className="text-xs text-muted-foreground">{session.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-foreground">
                        {session.confidence}%
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

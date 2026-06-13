import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, History } from "lucide-react";
import { useEffect, useState } from "react";
import { logsApi, type ActivityLog } from "@/lib/api";

/** Indonesian labels for audit action codes (see LOGGING.md). */
export const ACTION_LABELS: Record<string, string> = {
  "auth.register": "Pendaftaran akun",
  "auth.login": "Masuk",
  "auth.login.failed": "Percobaan masuk gagal",
  "user.update": "Perbarui profil",
  "user.password_change": "Ubah kata sandi",
  "analysis.text": "Analisis teks",
  "analysis.audio_transcribe": "Analisis suara",
  "analysis.delete": "Hapus riwayat analisis",
  "frontend.error": "Kesalahan aplikasi",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const PAGE_SIZE = 50;
const MAX_LIMIT = 200;

export default function ActivityLogCard() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    logsApi
      .getMyLogs(limit)
      .then((res) => {
        if (!cancelled) {
          setLogs(res.data ?? []);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message || "Gagal memuat log aktivitas");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  // logs.length === limit -> there are probably more rows on the server
  const canLoadMore = logs.length === limit && limit < MAX_LIMIT;

  return (
    <Card className="border border-border">
      <div className="p-6">
        <h2 className="font-heading font-bold text-lg text-foreground mb-1 flex items-center gap-2">
          <History className="h-5 w-5" />
          Log Aktivitas
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          Riwayat aktivitas akun Anda, terbaru di atas
        </p>

        {loading && (
          <div className="flex justify-center py-8" data-testid="activity-loading">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-destructive py-4" data-testid="activity-error">{error}</p>
        )}

        {!loading && !error && logs.length === 0 && (
          <p className="text-sm text-muted-foreground py-4" data-testid="activity-empty">
            Belum ada aktivitas tercatat.
          </p>
        )}

        {!loading && !error && logs.length > 0 && (
          <ul className="divide-y divide-border" data-testid="activity-list">
            {logs.map((log) => (
              <li key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {actionLabel(log.action)}
                  </p>
                  {log.detail && (
                    <p className="text-xs text-muted-foreground truncate">{log.detail}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {formatTimestamp(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && canLoadMore && (
          <Button
            variant="outline"
            className="w-full mt-4 border border-border"
            onClick={() => setLimit((l) => Math.min(l + PAGE_SIZE, MAX_LIMIT))}
          >
            Muat Lebih Banyak
          </Button>
        )}
      </div>
    </Card>
  );
}

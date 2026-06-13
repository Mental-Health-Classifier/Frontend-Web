/**
 * Global frontend error reporter — sends uncaught errors to
 * POST /api/v1/logs/frontend (see LOGGING.md at the repo root).
 *
 * Safeguards:
 *  - duplicate messages within DEDUPE_WINDOW_MS are dropped
 *  - at most MAX_REPORTS_PER_SESSION reports per page session
 *  - bearer tokens are stripped from stack text
 *  - the reporter itself never throws (fire-and-forget)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export const DEDUPE_WINDOW_MS = 30_000;
export const MAX_REPORTS_PER_SESSION = 10;

const recentMessages = new Map<string, number>(); // message -> last sent ts
let sessionReportCount = 0;

/** Test hook — reset internal state between vitest cases. */
export function _resetForTest(): void {
  recentMessages.clear();
  sessionReportCount = 0;
}

/** Strip anything that looks like a bearer token or JWT from text. */
export function sanitize(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, "Bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, "[jwt-redacted]");
}

export interface ErrorReport {
  message: string;
  source?: string;
  url?: string;
  stack?: string;
}

/**
 * Send one error report. Never throws; returns true when the report was
 * actually dispatched (not deduped/capped).
 */
export function reportError(report: ErrorReport): boolean {
  try {
    const message = (report.message || "Unknown error").slice(0, 500);

    const now = Date.now();
    const lastSent = recentMessages.get(message);
    if (lastSent !== undefined && now - lastSent < DEDUPE_WINDOW_MS) return false;
    if (sessionReportCount >= MAX_REPORTS_PER_SESSION) return false;

    recentMessages.set(message, now);
    sessionReportCount += 1;

    const token = localStorage.getItem("token");
    const body = JSON.stringify({
      message,
      source: report.source?.slice(0, 300),
      url: (report.url ?? window.location.pathname).slice(0, 300),
      stack: report.stack ? sanitize(report.stack).slice(0, 2000) : undefined,
    });

    fetch(`${API_BASE}/logs/frontend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      // page may be unloading after a fatal error
      keepalive: true,
    }).catch(() => {});

    return true;
  } catch {
    return false; // reporter must never break the app
  }
}

/** Install window-level handlers. Call once at app startup. */
export function installErrorReporter(): void {
  window.addEventListener("error", (event) => {
    reportError({
      message: event.message || String(event.error ?? "Unknown error"),
      source: event.filename ? `${event.filename}:${event.lineno ?? 0}` : undefined,
      stack: event.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason: unknown = event.reason;
    const message =
      reason instanceof Error ? reason.message : String(reason ?? "Unhandled rejection");
    reportError({
      message: `Unhandled rejection: ${message}`,
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}

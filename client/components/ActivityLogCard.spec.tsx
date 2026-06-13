import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import ActivityLogCard, { actionLabel, formatTimestamp, ACTION_LABELS } from "./ActivityLogCard";

vi.mock("@/lib/api", () => ({
  logsApi: { getMyLogs: vi.fn() },
}));

import { logsApi } from "@/lib/api";
const getMyLogs = logsApi.getMyLogs as ReturnType<typeof vi.fn>;

function makeLog(overrides: Partial<any> = {}) {
  return {
    id: crypto.randomUUID(),
    user_id: "u1",
    action: "auth.login",
    detail: null,
    ip_address: "127.0.0.1",
    created_at: "2026-06-13T02:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  getMyLogs.mockReset();
});

afterEach(() => cleanup());

describe("actionLabel", () => {
  it("maps every known action to Indonesian", () => {
    for (const key of Object.keys(ACTION_LABELS)) {
      expect(actionLabel(key)).not.toBe(key);
    }
  });

  it("falls back to raw action for unknown codes", () => {
    expect(actionLabel("custom.thing")).toBe("custom.thing");
  });
});

describe("formatTimestamp", () => {
  it("renders a readable Indonesian date", () => {
    const out = formatTimestamp("2026-06-13T02:00:00Z");
    expect(out).toMatch(/2026/);
  });

  it("returns input untouched when unparseable", () => {
    expect(formatTimestamp("garbage")).toBe("garbage");
  });
});

describe("<ActivityLogCard />", () => {
  it("shows rows with mapped labels", async () => {
    getMyLogs.mockResolvedValue({
      data: [
        makeLog({ action: "auth.login" }),
        makeLog({ action: "analysis.text", detail: "chars=120" }),
      ],
    });
    render(<ActivityLogCard />);
    await waitFor(() => expect(screen.getByTestId("activity-list")).toBeTruthy());
    expect(screen.getByText("Masuk")).toBeTruthy();
    expect(screen.getByText("Analisis teks")).toBeTruthy();
    expect(screen.getByText("chars=120")).toBeTruthy();
  });

  it("shows empty state when no logs", async () => {
    getMyLogs.mockResolvedValue({ data: [] });
    render(<ActivityLogCard />);
    await waitFor(() => expect(screen.getByTestId("activity-empty")).toBeTruthy());
  });

  it("shows error state when API fails", async () => {
    getMyLogs.mockRejectedValue(new Error("Server error (500)"));
    render(<ActivityLogCard />);
    await waitFor(() => expect(screen.getByTestId("activity-error")).toBeTruthy());
    expect(screen.getByText(/Server error/)).toBeTruthy();
  });

  it("offers load-more only when page is full", async () => {
    getMyLogs.mockResolvedValue({
      data: Array.from({ length: 50 }, () => makeLog()),
    });
    render(<ActivityLogCard />);
    await waitFor(() => expect(screen.getByTestId("activity-list")).toBeTruthy());
    expect(screen.getByText("Muat Lebih Banyak")).toBeTruthy();
  });

  it("hides load-more on a partial page", async () => {
    getMyLogs.mockResolvedValue({ data: [makeLog()] });
    render(<ActivityLogCard />);
    await waitFor(() => expect(screen.getByTestId("activity-list")).toBeTruthy());
    expect(screen.queryByText("Muat Lebih Banyak")).toBeNull();
  });
});

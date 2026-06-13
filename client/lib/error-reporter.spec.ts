import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  reportError,
  sanitize,
  installErrorReporter,
  _resetForTest,
  MAX_REPORTS_PER_SESSION,
  DEDUPE_WINDOW_MS,
} from "./error-reporter";

const fetchMock = vi.fn(() => Promise.resolve(new Response("{}")));

beforeEach(() => {
  _resetForTest();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockClear();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("sanitize", () => {
  it("strips bearer tokens", () => {
    expect(sanitize("Authorization: Bearer abc.def-123")).not.toContain("abc.def-123");
  });

  it("strips raw JWTs", () => {
    const jwt = "eyJhbGciOi.eyJzdWIiOi.SflKxwRJSM";
    expect(sanitize(`token=${jwt}`)).toContain("[jwt-redacted]");
  });

  it("leaves normal text alone", () => {
    expect(sanitize("TypeError: x is undefined")).toBe("TypeError: x is undefined");
  });
});

describe("reportError", () => {
  it("sends a POST to /logs/frontend with the payload", () => {
    const ok = reportError({ message: "boom", source: "A.tsx:1", url: "/chat" });
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as any;
    expect(url).toContain("/logs/frontend");
    const body = JSON.parse(init.body);
    expect(body.message).toBe("boom");
    expect(body.source).toBe("A.tsx:1");
    expect(body.url).toBe("/chat");
  });

  it("attaches Authorization header when token present", () => {
    localStorage.setItem("token", "tok123");
    reportError({ message: "boom" });
    const [, init] = fetchMock.mock.calls[0] as any;
    expect(init.headers.Authorization).toBe("Bearer tok123");
  });

  it("omits Authorization header when no token", () => {
    reportError({ message: "boom" });
    const [, init] = fetchMock.mock.calls[0] as any;
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("dedupes identical messages inside the window", () => {
    vi.useFakeTimers();
    expect(reportError({ message: "same" })).toBe(true);
    expect(reportError({ message: "same" })).toBe(false);
    vi.advanceTimersByTime(DEDUPE_WINDOW_MS + 1);
    expect(reportError({ message: "same" })).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("caps reports per session", () => {
    for (let i = 0; i < MAX_REPORTS_PER_SESSION; i++) {
      expect(reportError({ message: `err-${i}` })).toBe(true);
    }
    expect(reportError({ message: "one too many" })).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(MAX_REPORTS_PER_SESSION);
  });

  it("truncates long fields to API limits", () => {
    reportError({ message: "m".repeat(600), stack: "s".repeat(3000) });
    const body = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(body.message.length).toBe(500);
    expect(body.stack.length).toBe(2000);
  });

  it("sanitizes tokens inside the stack", () => {
    reportError({ message: "boom", stack: "at x Bearer secret.token.here" });
    const body = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(body.stack).not.toContain("secret.token.here");
  });

  it("never throws even when fetch rejects", () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error("net down")));
    expect(() => reportError({ message: "boom" })).not.toThrow();
  });

  it("never throws when localStorage explodes", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("denied");
    };
    try {
      expect(() => reportError({ message: "boom" })).not.toThrow();
    } finally {
      Storage.prototype.getItem = original;
    }
  });
});

describe("installErrorReporter", () => {
  it("reports window error events", () => {
    installErrorReporter();
    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "Script error: kaboom",
        filename: "main.tsx",
        lineno: 7,
      }),
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(body.message).toContain("kaboom");
    expect(body.source).toBe("main.tsx:7");
  });

  it("reports unhandled rejections", () => {
    installErrorReporter();
    const event = new Event("unhandledrejection") as any;
    event.reason = new Error("promise died");
    window.dispatchEvent(event);
    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(body.message).toContain("promise died");
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

vi.mock("@/lib/error-reporter", () => ({
  reportError: vi.fn(),
}));

import { reportError } from "@/lib/error-reporter";
const reportMock = reportError as ReturnType<typeof vi.fn>;

function Bomb(): never {
  throw new Error("render kaboom");
}

beforeEach(() => {
  reportMock.mockReset();
  // silence expected React error noise
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("<ErrorBoundary />", () => {
  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>aman</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("aman")).toBeTruthy();
  });

  it("shows fallback and reports when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Terjadi kesalahan")).toBeTruthy();
    expect(reportMock).toHaveBeenCalledTimes(1);
    expect(reportMock.mock.calls[0][0].message).toBe("render kaboom");
  });
});

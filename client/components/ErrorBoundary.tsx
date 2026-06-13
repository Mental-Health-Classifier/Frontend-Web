import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/error-reporter";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catches render-time errors, reports them, shows a recoverable fallback. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError({
      message: error.message,
      source: info.componentStack?.split("\n")[1]?.trim(),
      stack: error.stack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="font-heading font-bold text-2xl text-foreground">
            Terjadi kesalahan
          </h1>
          <p className="text-muted-foreground max-w-md">
            Maaf, ada masalah saat menampilkan halaman ini. Tim kami sudah
            menerima laporannya.
          </p>
          <button
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = "/";
            }}
          >
            Kembali ke Beranda
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-layout flex flex-col min-h-screen bg-background">
      {/* Header/Navbar */}
      <header className="app-layout-navbar bg-primary text-primary-foreground border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="font-heading font-bold text-xl text-white hover:opacity-90 transition-opacity"
            >
              MindCare
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link
                to="/chat"
                className="font-medium text-sm text-white/90 hover:text-white transition-colors"
              >
                Obrolan
              </Link>
              <Link
                to="/dashboard"
                className="font-medium text-sm text-white/90 hover:text-white transition-colors"
              >
                Dasbor
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden sm:inline text-sm text-white/80 font-medium mr-2">
                {user.name}
              </span>
            )}
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-white/10 hidden sm:flex gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted text-muted-foreground text-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center">
          <p>MindCare © 2026 - Mendukung perjalanan kesehatan mental Anda</p>
        </div>
      </footer>
    </div>
  );
}

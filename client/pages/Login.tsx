import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    try {
      await login(email, password);
      toast({ title: "Login berhasil", description: "Selamat datang kembali!" });
      navigate("/chat");
    } catch (err: any) {
      toast({ title: "Login gagal", description: err.message || "Email atau kata sandi salah", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70"></div>

      <div className="w-full max-w-md relative z-10 pt-16">
        <Card className="border-white/20 dark:border-white/10 shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-all duration-300">
          <div className="p-8">
            {/* Logo/Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg text-white">
                <span className="font-heading font-bold text-2xl">M</span>
              </div>
              <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
                MindCare
              </h1>
              <p className="text-sm text-muted-foreground">
                Selamat datang kembali. Mari lanjutkan perjalanan kesehatan mental Anda.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Alamat Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-border/50 bg-background/50 backdrop-blur-sm rounded-xl px-4 py-6"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Kata Sandi
                  </Label>
                  <a href="#" className="text-xs text-primary hover:underline font-medium">Lupa kata sandi?</a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-border/50 bg-background/50 backdrop-blur-sm rounded-xl px-4 py-6 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl py-6 bg-primary hover:bg-primary/90 text-white font-semibold transition-all shadow-md hover:shadow-lg mt-6"
              >
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang masuk...</> : "Masuk"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-transparent text-muted-foreground bg-white dark:bg-slate-900 rounded-full">
                  Belum punya akun?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link to="/register">
              <Button variant="outline" className="w-full rounded-xl py-6 border border-border/50 bg-background/50 hover:bg-background/80 shadow-sm transition-all drop-shadow-sm text-foreground">
                Buat Akun
              </Button>
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 px-4">
          Kesehatan mental Anda adalah prioritas kami. Semua percakapan dienkripsi dan rahasia.
        </p>
      </div>
    </div>
  );
}

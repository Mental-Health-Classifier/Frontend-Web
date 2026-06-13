import AppLayout from "@/components/AppLayout";
import ActivityLogCard from "@/components/ActivityLogCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saveHistory, setSaveHistory] = useState(true);
  const [autoVoice, setAutoVoice] = useState(() => localStorage.getItem("autoVoice") === "true");
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authApi.updateMe({ name, email });
      await refreshUser(true); // silent — profile update failure ≠ auth failure
      localStorage.setItem("autoVoice", autoVoice.toString());
      toast({ title: "Berhasil", description: "Profil berhasil diperbarui" });
      navigate("/chat");
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message || "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Kata sandi baru dan konfirmasi tidak cocok", variant: "destructive" });
      return;
    }
    if (!currentPassword || !newPassword) {
      toast({ title: "Error", description: "Semua field kata sandi harus diisi", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast({ title: "Berhasil", description: "Kata sandi berhasil diubah" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message || "Kata sandi lama salah", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-8rem)] bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
              Pengaturan
            </h1>
            <p className="text-muted-foreground">
              Kelola akun dan preferensi Anda
            </p>
          </div>

          {/* Profile Management Section */}
          <Card className="border border-border">
            <div className="p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-6">
                Kelola Profil
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    Nama Lengkap
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Alamat Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Password Update Section */}
          <Card className="border border-border">
            <div className="p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-6">
                Ubah Kata Sandi
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current" className="text-sm font-medium text-foreground">
                    Kata Sandi Lama
                  </Label>
                  <Input
                    id="current"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2"
                    disabled={isChangingPassword}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new" className="text-sm font-medium text-foreground">
                    Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <Input
                      id="new"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border border-border rounded-lg px-3 py-2 pr-10"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-sm font-medium text-foreground">
                    Konfirmasi Kata Sandi
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border border-border rounded-lg px-3 py-2 pr-10"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full mt-4"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengubah...</> : "Ubah Kata Sandi"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Preferences Section */}
          <Card className="border border-border">
            <div className="p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-6">
                Preferensi
              </h2>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-lg bg-background">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">
                      Simpan Riwayat Analisis
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Menyimpan catatan penilaian kesehatan mental Anda
                    </p>
                  </div>
                  <Switch
                    checked={saveHistory}
                    onCheckedChange={setSaveHistory}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-background">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">
                      Aktifkan Input Suara Otomatis
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Otomatis mulai merekam saat obrolan difokuskan
                    </p>
                  </div>
                  <Switch
                    checked={autoVoice}
                    onCheckedChange={setAutoVoice}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-background">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">
                      Notifikasi
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Menerima pengingat untuk check-in rutin
                    </p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Activity Log Section */}
          <ActivityLogCard />

          {/* Save Button */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" className="border border-border" onClick={() => navigate(-1)}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

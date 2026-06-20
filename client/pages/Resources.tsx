import AppLayout from "@/components/AppLayout";
import { getAllTiersForCategory, CRISIS_CONTACTS, type Category } from "@/lib/resources";
import { Phone, Copy, Check } from "lucide-react";
import { useState } from "react";

function CopyableContact({ contact }: { contact: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(contact);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      title="Klik untuk menyalin"
      className="inline-flex items-center gap-1.5 font-bold font-mono text-foreground hover:text-primary transition-colors cursor-pointer text-base"
    >
      {copied
        ? <><Check className="h-4 w-4" /> Tersalin</>
        : <><Copy className="h-3.5 w-3.5 opacity-30" /> {contact}</>
      }
    </button>
  );
}

const CONDITIONS: { id: Category; label: string; color: string }[] = [
  { id: "stress",     label: "Stres",     color: "#F2393D" },
  { id: "depression", label: "Depresi",   color: "#0369C2" },
  { id: "anxiety",    label: "Kecemasan", color: "#8680C6" },
];

const TIER_LABELS = [
  "Mulai dari sini",
  "Langkah lebih lanjut",
  "Cari bantuan segera",
];

export default function Resources() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Page header */}
        <div className="mb-14">
          <h1 className="text-3xl font-bold text-foreground mb-2">Sumber Daya</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Panduan dan kontak berdasarkan kondisi yang kamu rasakan. Tidak ada yang harus dihadapi sendirian.
          </p>
        </div>

        {/* Condition sections */}
        <div className="space-y-16">
          {CONDITIONS.map(({ id, label, color }) => {
            const tiers = getAllTiersForCategory(id);
            return (
              <section key={id} id={id}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: color }} />
                  <h2 className="text-lg font-semibold text-foreground tracking-tight">{label}</h2>
                </div>

                {/* Stepper */}
                <div className="space-y-0">
                  {tiers.map((res, i) => {
                    const isLast = i === tiers.length - 1;
                    const isCrisis = res.tier === 3;
                    return (
                      <div key={i} className="flex gap-5">
                        {/* Step indicator column */}
                        <div className="flex flex-col items-center">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                            style={{
                              backgroundColor: isCrisis ? color : `${color}18`,
                              color: isCrisis ? "#fff" : color,
                              border: `1.5px solid ${isCrisis ? color : `${color}40`}`,
                            }}
                          >
                            {i + 1}
                          </div>
                          {!isLast && (
                            <div className="w-px bg-border flex-1 my-2" style={{ minHeight: 32 }} />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 ${!isLast ? "pb-8" : ""}`}>
                          <span
                            className="text-[11px] font-semibold uppercase tracking-widest mb-2 block"
                            style={{ color: isCrisis ? color : "hsl(var(--muted-foreground))" }}
                          >
                            {TIER_LABELS[i]}
                          </span>
                          <p className="text-sm text-foreground leading-relaxed">
                            {res.tip}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Crisis contacts */}
        <section className="mt-16 pt-12 border-t border-border">
          <div className="flex items-center gap-2.5 mb-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Kontak Darurat</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-7">
            Tersedia 24 jam. Menghubungi layanan ini adalah langkah yang berani.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CRISIS_CONTACTS.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                <div className="mb-1">
                  <CopyableContact contact={c.contact} />
                </div>
                <p className="text-xs text-muted-foreground">{c.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Professional services note */}
        <div className="mt-8 rounded-xl bg-muted/40 border border-border px-5 py-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Untuk konsultasi online, Riliv dan Halodoc menyediakan layanan psikolog mulai dari Rp 55.000 per sesi.
            Pengguna BPJS dapat mengakses layanan kesehatan jiwa secara gratis melalui Puskesmas terdekat.
            Direktori penyedia layanan per kota tersedia di{" "}
            <a
              href="https://www.intothelightid.org/tentang-bunuh-diri/daftar-penyedia-layanan-kesehatan-mental/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-foreground hover:text-primary transition-colors"
            >
              intothelightid.org
            </a>.
          </p>
        </div>

      </div>
    </AppLayout>
  );
}

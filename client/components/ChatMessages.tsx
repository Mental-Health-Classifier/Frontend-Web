import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquareText, Brain, Zap, HeartCrack, Smile, AlertCircle, Lightbulb, Phone } from "lucide-react";
import { useChat, type XaiLime } from "@/lib/chat-context";
import { type ResourceEntry } from "@/lib/resources";
import { useEffect, useRef, useState } from "react";

const classificationMap = {
  depression: { label: "Depresi",   color: "#0369C2" },
  anxiety:    { label: "Cemas",     color: "#8680C6" },
  stress:     { label: "Stres",     color: "#F2393D" },
};

const TEMPLATE_SUGGESTIONS = [
  {
    icon: HeartCrack,
    label: "Merasa Sedih",
    color: "#0369C2",
    text: "Saya sudah tidak semangat hidup, setiap hari terasa gelap dan hampa. Saya tidak bisa merasakan kebahagiaan sama sekali.",
  },
  {
    icon: Zap,
    label: "Kecemasan",
    color: "#8680C6",
    text: "Saya sering merasa cemas dan khawatir berlebihan tentang banyak hal, terutama pekerjaan dan masa depan saya.",
  },
  {
    icon: Brain,
    label: "Stres Berat",
    color: "#F2393D",
    text: "Saya merasa sangat stres dan kelelahan. Pikiran terus berputar dan saya kesulitan tidur beberapa hari ini.",
  },
  {
    icon: Smile,
    label: "Ceritakan Perasaan",
    color: "#22c55e",
    text: "Saya ingin berbagi perasaan saya hari ini dan mendapatkan analisis tentang kondisi mental saya.",
  },
];

/* ------------------------------------------------------------------ */
/*  Inline highlighted text component                                   */
/* ------------------------------------------------------------------ */

type Cls = "depression" | "anxiety" | "stress" | "none";

function HighlightedText({ text, keyWords }: { text: string; keyWords: XaiLime["keyWords"] }) {
  const wordMap = new Map<string, Cls>();
  for (const kw of keyWords) {
    if (kw.classification !== "none") wordMap.set(kw.word.toLowerCase(), kw.classification);
  }

  const tokens = text.split(/(\s+)/);

  return (
    <span className="text-sm leading-relaxed">
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
        const clean = token.toLowerCase().replace(/[^a-z0-9À-ɏ]/g, "");
        let cls: Cls | undefined = wordMap.get(clean);
        if (!cls && clean.length >= 4) {
          for (const [k, v] of wordMap.entries()) {
            if (k.length >= 4 && (clean.includes(k) || k.includes(clean))) { cls = v; break; }
          }
        }
        if (cls) {
          const color = classificationMap[cls].color;
          return (
            <mark
              key={i}
              style={{ backgroundColor: `${color}28`, color, borderRadius: "4px", padding: "1px 4px", fontWeight: 600 }}
            >
              {token}
            </mark>
          );
        }
        return <span key={i}>{token}</span>;
      })}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Resource panel                                                      */
/* ------------------------------------------------------------------ */

function ResourcePanel({ resources }: { resources: ResourceEntry[] }) {
  if (resources.length === 0) return null;

  const hasCrisis = resources.some(r => r.tier === 3);

  return (
    <div className="max-w-3xl">
      <div className={`rounded-xl border shadow-sm overflow-hidden ${hasCrisis ? "border-red-200" : "border-border"}`}>
        {/* Header */}
        <div className={`px-4 py-3 flex items-center gap-2 border-b ${hasCrisis ? "bg-red-50 border-red-200" : "bg-muted/40 border-border"}`}>
          <Lightbulb className={`h-4 w-4 shrink-0 ${hasCrisis ? "text-red-500" : "text-primary"}`} />
          <span className="text-sm font-semibold text-foreground">
            {hasCrisis ? "Kamu Tidak Sendirian. Ini yang Bisa Dilakukan." : "Langkah yang Bisa Kamu Coba"}
          </span>
        </div>

        {/* Resource cards */}
        <div className="divide-y divide-border">
          {resources.map((res, i) => {
            const meta = classificationMap[res.category];
            const isCrisis = res.tier === 3;

            return (
              <div key={i} className="p-4" style={{ borderLeft: `3px solid ${meta.color}` }}>
                {/* Category + tier label */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  {isCrisis && (
                    <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Perlu perhatian segera
                    </span>
                  )}
                </div>

                {/* Tip */}
                <p className="text-sm text-foreground leading-relaxed">
                  {res.tip}
                </p>

                {/* Crisis contacts */}
                {res.contacts && (
                  <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Phone className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-xs font-bold text-red-700">Hubungi bantuan sekarang:</span>
                    </div>
                    <div className="space-y-2">
                      {res.contacts.map((c, j) => (
                        <div key={j} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                          <span className="font-semibold text-foreground">{c.label}</span>
                          <span className="font-bold text-red-600">{c.contact}</span>
                          <span className="text-muted-foreground">{c.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading step estimates                                              */
/* ------------------------------------------------------------------ */

const STEP_ESTIMATE: Record<string, string> = {
  "Mentranskrip audio...": "~10 dtk",
  "Menganalisis teks...":  "~3 dtk",
  "Menerapkan LIME...":    "~5 dtk",
};

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ChatMessages() {
  const { messages, isSending, loadingStatus, sendMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isSending) { setElapsed(0); return; }
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isSending]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  return (
    <ScrollArea className="flex-1 p-6">
      <div className="space-y-6 w-full max-w-5xl mx-auto">

        {/* Welcome + template suggestions */}
        {messages.length === 0 && !isSending && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-8 py-8">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <MessageSquareText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-2xl text-foreground mb-2">
                  Halo! Bagaimana perasaan Anda hari ini?
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Bagikan perasaan Anda dan MindCare akan menganalisis kondisi mental Anda secara otomatis.
                </p>
              </div>
            </div>

            <div className="w-full max-w-2xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Atau coba salah satu template ini:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATE_SUGGESTIONS.map((tpl) => {
                  const Icon = tpl.icon;
                  return (
                    <button
                      key={tpl.label}
                      onClick={() => sendMessage(tpl.text)}
                      className="group flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card hover:border-border hover:shadow-md text-left transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div
                        className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${tpl.color}18`, color: tpl.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold mb-1" style={{ color: tpl.color }}>{tpl.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{tpl.text}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.type === "user" ? (
              <div className="bg-primary text-white rounded-xl px-4 py-3 max-w-xs lg:max-w-md shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            ) : (
              <div className="w-full space-y-3">
                <div className="bg-card border border-border rounded-xl p-4 max-w-3xl shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm leading-relaxed text-foreground mb-4">
                    {message.content}
                  </p>

                  {/* XAI LIME panel */}
                  {message.xaiLime && (() => {
                    const activeLabels = (["depression", "anxiety", "stress"] as const)
                      .filter(l => message.xaiLime!.probabilities[l] >= 50);
                    if (activeLabels.length === 0) return null;
                    return (
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertCircle className="h-4 w-4 text-accent" />
                          <h4 className="font-heading font-semibold text-sm text-foreground">
                            Analisis XAI LIME
                          </h4>
                        </div>

                        {/* Individual probability bars */}
                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-muted-foreground font-medium">Confidence Score:</p>
                          {(["depression", "anxiety", "stress"] as const).map(l => (
                            <div key={l} className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 w-20 shrink-0">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: classificationMap[l].color }} />
                                <span className="text-xs font-medium text-foreground">{classificationMap[l].label}</span>
                              </div>
                              <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${message.xaiLime!.probabilities[l]}%`, backgroundColor: classificationMap[l].color }}
                                />
                              </div>
                              <span className="text-xs font-bold w-8 text-right tabular-nums" style={{ color: classificationMap[l].color }}>
                                {message.xaiLime!.probabilities[l]}%
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Keyword badges */}
                        {message.xaiLime.keyWords.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-4 mb-3">
                            <p className="text-xs text-muted-foreground mb-3 font-medium">Kata Kunci Penting:</p>
                            <div className="flex flex-wrap gap-2">
                              {message.xaiLime.keyWords.map((kw, idx) => {
                                const badgeColor = kw.classification !== "none" ? classificationMap[kw.classification].color : "hsl(var(--border))";
                                const textColor  = kw.classification !== "none" ? "#ffffff" : "hsl(var(--foreground))";
                                return (
                                  <span
                                    key={idx}
                                    style={{ backgroundColor: badgeColor, color: textColor }}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                                  >
                                    {kw.word}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Inline highlighted input text */}
                        {message.inputText && message.xaiLime.keyWords.length > 0 && (
                          <div className="bg-muted/40 rounded-lg px-4 py-3">
                            <HighlightedText
                              text={message.inputText}
                              keyWords={message.xaiLime.keyWords}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Resource panel — separate card below LIME */}
                {message.resources && message.resources.length > 0 && (
                  <ResourcePanel resources={message.resources} />
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator with step + elapsed */}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-md min-w-[220px] space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs font-medium text-foreground">
                  {loadingStatus ?? "Memproses..."}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-1">
                <span>{elapsed}s berlalu</span>
                {loadingStatus && STEP_ESTIMATE[loadingStatus] && (
                  <span className="text-muted-foreground/70">estimasi {STEP_ESTIMATE[loadingStatus]}</span>
                )}
              </div>
              <div className="h-0.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary/50 rounded-full"
                     style={{ width: "40%", animation: "shimmer 2s ease-in-out infinite" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

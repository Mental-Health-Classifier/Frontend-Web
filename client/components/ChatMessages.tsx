import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquareText, Brain, Zap, HeartCrack, Smile } from "lucide-react";
import { useChat, type XaiLime } from "@/lib/chat-context";
import { useEffect, useRef, useState } from "react";

const classificationMap = {
  depression: { label: "Depresi",    color: "#0369C2" },
  anxiety:    { label: "Kecemasan",  color: "#8680C6" },
  stress:     { label: "Stres",      color: "#F2393D" },
};

const TEMPLATE_SUGGESTIONS = [
  {
    icon: HeartCrack,
    label: "Merasa Sedih",
    color: "#0369C2",
    text: "Saya merasa sangat sedih dan tidak berdaya akhir-akhir ini. Rasanya semua terasa berat dan saya tidak tahu harus bagaimana.",
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
  // Only highlight words with a real classification
  const wordMap = new Map<string, Cls>();
  for (const kw of keyWords) {
    if (kw.classification !== "none") wordMap.set(kw.word.toLowerCase(), kw.classification);
  }

  // Split preserving whitespace runs
  const tokens = text.split(/(\s+)/);

  return (
    <span className="text-sm leading-relaxed">
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;

        const clean = token.toLowerCase().replace(/[^a-z0-9À-ɏ]/g, "");

        // 1. exact match
        let cls: Cls | undefined = wordMap.get(clean);

        // 2. stem/partial match (handles Sastrawi stemming e.g. "berdaya" → "daya")
        if (!cls && clean.length >= 3) {
          for (const [k, v] of wordMap.entries()) {
            if (clean.includes(k) || k.includes(clean)) { cls = v; break; }
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
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

const STEP_ESTIMATE: Record<string, string> = {
  "Mentranskrip audio...": "~10 dtk",
  "Menganalisis teks...":  "~3 dtk",
  "Menerapkan LIME...":    "~5 dtk",
};

export default function ChatMessages() {
  const { messages, isSending, loadingStatus, sendMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);

  // live elapsed-seconds counter while sending
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

        {/* Welcome template */}
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
              <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl px-4 py-3 max-w-xs lg:max-w-md shadow-lg transform transition-all duration-200 hover:-translate-y-0.5">
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            ) : (
              <div className="w-full">
                <div className="bg-card border border-border rounded-xl p-4 max-w-3xl shadow-md hover:shadow-xl transition-shadow space-y-4">

                  {/* Plain text reply */}
                  <p className="text-sm leading-relaxed text-foreground">
                    {message.content}
                  </p>

                  {/* Analysis panel — only when xaiLime present */}
                  {message.xaiLime && (
                    <div className="border-t border-border pt-4 space-y-4">

                      {/* 3 individual probability bars */}
                      <div className="space-y-2">
                        {(["depression", "anxiety", "stress"] as const).map((label) => {
                          const pct   = message.xaiLime!.probabilities[label];
                          const { color, label: lbl } = classificationMap[label];
                          return (
                            <div key={label} className="flex items-center gap-3">
                              <span className="text-xs font-medium w-20 text-right text-muted-foreground shrink-0">
                                {lbl}
                              </span>
                              <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${pct}%`, backgroundColor: color }}
                                  className="h-full rounded-full transition-all duration-700"
                                />
                              </div>
                              <span className="text-xs font-semibold w-9 shrink-0" style={{ color }}>
                                {pct}%
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* User input with inline word highlights */}
                      {message.inputText && message.xaiLime.keyWords.length > 0 && (
                        <div className="bg-muted/40 rounded-lg px-4 py-3">
                          <HighlightedText
                            text={message.inputText}
                            keyWords={message.xaiLime.keyWords}
                          />
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator with step + elapsed time */}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-md min-w-[220px] space-y-2">
              {/* dots + step label */}
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
              {/* elapsed + estimate */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-1">
                <span>{elapsed}s berlalu</span>
                {loadingStatus && STEP_ESTIMATE[loadingStatus] && (
                  <span className="text-muted-foreground/70">
                    estimasi {STEP_ESTIMATE[loadingStatus]}
                  </span>
                )}
              </div>
              {/* thin progress shimmer bar */}
              <div className="h-0.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary/50 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
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

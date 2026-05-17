import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, MessageSquareText, Brain, Zap, HeartCrack, Smile } from "lucide-react";
import { useChat, type ChatMessage } from "@/lib/chat-context";
import { useEffect, useRef } from "react";

const classificationMap = {
  depression: { label: "Depresi", color: "#0369C2" },
  anxiety: { label: "Cemas", color: "#8680C6" },
  stress: { label: "Stress", color: "#F2393D" },
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

export default function ChatMessages() {
  const { messages, isSending, sendMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  return (
    <ScrollArea className="flex-1 p-6">
      <div className="space-y-6 w-full max-w-5xl mx-auto">
        {/* Welcome template — shown when chat is empty */}
        {messages.length === 0 && !isSending && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-8 py-8">
            {/* Hero icon + heading */}
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <MessageSquareText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-2xl text-foreground mb-2">
                  Halo! Bagaimana perasaan Anda hari ini?
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Bagikan perasaan Anda dan MindCare akan menganalisis kondisi mental Anda menggunakan model AI IndoBERT dengan penjelasan transparan dari XAI LIME.
                </p>
              </div>
            </div>

            {/* Suggestion chips */}
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
                        <p className="text-xs font-semibold mb-1" style={{ color: tpl.color }}>
                          {tpl.label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {tpl.text}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.type === "user" ? (
              // User Message
              <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl px-4 py-3 max-w-xs lg:max-w-md shadow-lg transform transition-all duration-200 hover:-translate-y-0.5">
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            ) : (
              // AI Message
              <div className="w-full space-y-4">
                <div className="bg-card border border-border rounded-xl p-4 max-w-3xl shadow-md hover:shadow-xl transition-shadow">
                  <p className="text-sm leading-relaxed text-foreground mb-4">
                    {message.content}
                  </p>

                  {/* XAI LIME UI */}
                  {message.xaiLime && (
                    <div className="border-t border-border pt-4">
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertCircle className="h-4 w-4 text-accent" />
                          <h4 className="font-heading font-semibold text-sm text-foreground">
                            XAI LIME Analysis
                          </h4>
                        </div>
                        
                        {/* Probability Bars */}
                        <div className="space-y-3 mb-6">
                          <p className="text-xs text-muted-foreground font-medium">Probabilities:</p>
                          <div className="flex w-full h-4 rounded-full overflow-hidden bg-secondary">
                            <div 
                              style={{ width: `${message.xaiLime.probabilities.depression}%`, backgroundColor: classificationMap.depression.color }} 
                              className="h-full" 
                              title={`Depresi: ${message.xaiLime.probabilities.depression}%`}
                            />
                            <div 
                              style={{ width: `${message.xaiLime.probabilities.anxiety}%`, backgroundColor: classificationMap.anxiety.color }} 
                              className="h-full" 
                              title={`Cemas: ${message.xaiLime.probabilities.anxiety}%`}
                            />
                            <div 
                              style={{ width: `${message.xaiLime.probabilities.stress}%`, backgroundColor: classificationMap.stress.color }} 
                              className="h-full" 
                              title={`Stress: ${message.xaiLime.probabilities.stress}%`}
                            />
                          </div>
                          <div className="flex justify-between text-xs font-medium">
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: classificationMap.depression.color }}></span>
                              Depresi {message.xaiLime.probabilities.depression}%
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: classificationMap.anxiety.color }}></span>
                              Cemas {message.xaiLime.probabilities.anxiety}%
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: classificationMap.stress.color }}></span>
                              Stress {message.xaiLime.probabilities.stress}%
                            </div>
                          </div>
                        </div>

                        {/* Keyword Highlights */}
                        {message.xaiLime.keyWords.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground mb-3 font-medium">Highlighted Keywords:</p>
                            <div className="flex flex-wrap gap-2">
                              {message.xaiLime.keyWords.map((kw, idx) => {
                                const badgeColor = kw.classification !== "none" ? classificationMap[kw.classification].color : "hsl(var(--border))";
                                const textColor = kw.classification !== "none" ? "#ffffff" : "hsl(var(--foreground))";
                                return (
                                  <span
                                    key={idx}
                                    style={{ backgroundColor: badgeColor, color: textColor }}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                                  >
                                    {kw.word}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-md">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

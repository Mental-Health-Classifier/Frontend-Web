import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, MessageSquareText } from "lucide-react";
import { useChat, type ChatMessage } from "@/lib/chat-context";
import { useEffect, useRef } from "react";

const classificationMap = {
  depression: { label: "Depresi", color: "#0369C2" },
  anxiety: { label: "Cemas", color: "#8680C6" },
  stress: { label: "Stress", color: "#F2393D" },
};

export default function ChatMessages() {
  const { messages, isSending } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  return (
    <ScrollArea className="flex-1 p-6">
      <div className="space-y-6 w-full max-w-5xl mx-auto">
        {/* Empty state */}
        {messages.length === 0 && !isSending && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquareText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                Mulai Percakapan
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Bagikan perasaan Anda di bawah ini. Kami akan menganalisis sentimen Anda menggunakan AI dan memberikan penjelasan XAI LIME.
              </p>
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

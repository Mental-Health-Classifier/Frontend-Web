import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Clock } from "lucide-react";
import { useChat } from "@/lib/chat-context";

export default function ChatSidebar() {
  const { history, isLoading, startNewChat, loadHistoryItem, activeHistoryId } = useChat();

  return (
    <div className="w-64 bg-secondary border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-6">

        <Button
          className="w-full bg-white/70 dark:bg-slate-800/70 text-foreground hover:bg-white/90 dark:hover:bg-slate-800/90 font-medium gap-2 border-none shadow-sm"
          variant="outline"
          onClick={() => {
            startNewChat();
            if (localStorage.getItem("autoVoice") === "true") {
              window.dispatchEvent(new Event("mindcare-start-voice"));
            }
          }}
        >
          <Plus className="h-5 w-5" />
          Analisis Baru
        </Button>
      </div>

      {/* History List */}
      <ScrollArea className="flex-1 p-4 pt-0">
        <div className="space-y-3">
          {isLoading && history.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">Memuat riwayat...</p>
            </div>
          )}

          {!isLoading && history.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">Belum ada riwayat analisis</p>
            </div>
          )}

          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => loadHistoryItem(item.id)}
              className={`w-full text-left p-3 rounded-lg border-none shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                activeHistoryId === item.id
                  ? "bg-primary/15 ring-2 ring-inset ring-primary/40 outline-none"
                  : "bg-white/70 dark:bg-slate-800/70 hover:bg-primary/5"
              }`}
            >
              <div className="mb-2">
                <span className="text-sm text-foreground line-clamp-2">
                  {item.preview}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{item.timestamp}</span>
                </div>
                {item.category && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {item.category}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

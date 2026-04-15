import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Clock } from "lucide-react";

interface HistoryItem {
  id: string;
  preview: string;
  timestamp: string;
}

const mockHistory: HistoryItem[] = [
  { id: "1", preview: "Saya merasa sangat lelah dan sulit tidur...", timestamp: "Today 2:45 PM" },
  { id: "2", preview: "Akhir-akhir ini saya gampang emosi...", timestamp: "Today 10:20 AM" },
  { id: "3", preview: "Saya selalu cemas setiap kali mau pergi...", timestamp: "Yesterday 4:15 PM" },
  { id: "4", preview: "Kerjaan sangat menumpuk dan bikin pusing...", timestamp: "Yesterday 1:30 PM" },
  { id: "5", preview: "Saya tidak tahu harus cerita ke siapa...", timestamp: "2 days ago" },
  { id: "6", preview: "Semua terasa biasa saja sih hari ini.", timestamp: "3 days ago" },
];

export default function ChatSidebar() {
  return (
    <div className="w-64 bg-gradient-to-b from-green-mint/90 to-secondary border-r border-border flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="p-6">
        <div className="bg-white/70 dark:bg-slate-800/70 p-3 rounded-lg flex items-center justify-center mb-4">
          <h1 className="font-heading font-bold text-xl text-foreground drop-shadow-sm border-none">
            Mental Health
          </h1>
        </div>
        <Button
          className="w-full bg-white/70 dark:bg-slate-800/70 text-foreground hover:bg-white/90 dark:hover:bg-slate-800/90 font-medium gap-2 border-none shadow-sm"
          variant="outline"
        >
          <Plus className="h-5 w-5" />
          Chat Analysis
        </Button>
      </div>

      {/* History List */}
      <ScrollArea className="flex-1 p-4 pt-0">
        <div className="space-y-3">
          {mockHistory.map((item) => (
            <button
              key={item.id}
              className="w-full text-left p-3 rounded-lg bg-white/70 dark:bg-slate-800/70 border-none shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:bg-green-mint/20"
            >
              <div className="mb-2">
                <span className="text-sm text-foreground line-clamp-2">
                  {item.preview}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{item.timestamp}</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send } from "lucide-react";
import { useState } from "react";

export default function ChatInput() {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      // Handle send message
      setMessage("");
    }
  };

  return (
    <div className="border-t border-border bg-card p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Bagikan perasaan Anda di sini... Kami mendengarkan dengan empati."
            className="resize-none min-h-[100px] border border-border rounded-lg pl-4 pr-[88px] py-3 font-sans text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                handleSend();
              }
            }}
          />
          
          {/* Input Controls inside Textarea */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-accent hover:bg-secondary"
              title="Record voice input (Beta)"
            >
              <Mic className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              size="icon"
              className="h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Ctrl + Enter to send • Your thoughts are safe and confidential
        </p>
      </div>
    </div>
  );
}

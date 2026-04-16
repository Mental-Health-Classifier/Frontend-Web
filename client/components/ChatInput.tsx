import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, Send, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ChatInput() {
  const [message, setMessage] = useState("");
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      // Handle send message
      setMessage("");
    }
  };

  const popupvoiceinput = () => {
    setIsVoiceDialogOpen(true);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // TODO: Implement voice recording logic
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // TODO: Implement stop recording and transcription logic
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
              onClick={popupvoiceinput}
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

      {/* Voice Recording Dialog */}
      <Dialog open={isVoiceDialogOpen} onOpenChange={setIsVoiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Voice Input</DialogTitle>
            <DialogDescription>
              Click the button below to start recording your voice. We'll transcribe it automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-6">
            {/* Recording Indicator */}
            {isRecording && (
              <div className="flex items-center gap-2 text-red-500">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-sm font-medium">Recording...</span>
              </div>
            )}

            {/* Record Button */}
            <Button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              size="lg"
              className={isRecording ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"}
            >
              {isRecording ? (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>

            {/* Close Button */}
            <Button
              onClick={() => setIsVoiceDialogOpen(false)}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

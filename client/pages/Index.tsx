import AppLayout from "@/components/AppLayout";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessages from "@/components/ChatMessages";
import ChatInput from "@/components/ChatInput";
import { ChatProvider } from "@/lib/chat-context";

export default function Index() {
  return (
    <AppLayout>
      <ChatProvider>
        <div className="flex h-[calc(100vh-8rem)]">
          {/* Sidebar - Hidden on mobile, visible on md and up */}
          <div className="hidden md:flex md:w-64">
            <ChatSidebar />
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-background">
            <ChatMessages />
            <ChatInput />
          </div>
        </div>
      </ChatProvider>
    </AppLayout>
  );
}

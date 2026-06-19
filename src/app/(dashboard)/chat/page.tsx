import { ChatWindow } from "@/components/ai/ChatWindow";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b px-6 py-3">
        <h1 className="font-semibold text-gray-900">AI Асистент</h1>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}

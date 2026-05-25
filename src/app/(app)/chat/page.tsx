import { ChatInbox } from '@/components/chat/chat-inbox';

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight">
          Messages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your conversations with matched profiles
        </p>
      </div>
      <ChatInbox />
    </div>
  );
}

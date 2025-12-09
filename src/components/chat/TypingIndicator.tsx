import { Bot } from "lucide-react";

interface TypingIndicatorProps {
  agentName?: string;
}

export function TypingIndicator({ agentName = "Loan Assistant" }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 slide-up">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
        <Bot className="w-5 h-5 text-primary" />
      </div>
      <div className="space-y-1">
        <span className="text-xs font-medium text-primary">{agentName}</span>
        <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-4">
          <div className="flex gap-1">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

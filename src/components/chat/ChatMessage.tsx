import { cn } from "@/lib/utils";
import { Bot, User, Shield, CreditCard, FileCheck, Handshake } from "lucide-react";

export type AgentType = "master" | "verification" | "underwriting" | "sales";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  agent?: AgentType;
  timestamp?: string;
}

const agentConfig: Record<AgentType, { icon: React.ElementType; label: string; color: string }> = {
  master: { icon: Bot, label: "Loan Assistant", color: "text-primary" },
  verification: { icon: Shield, label: "Verification Agent", color: "text-blue-600" },
  underwriting: { icon: CreditCard, label: "Underwriting Agent", color: "text-purple-600" },
  sales: { icon: Handshake, label: "Sales Agent", color: "text-accent" },
};

export function ChatMessage({ content, isUser, agent = "master", timestamp }: ChatMessageProps) {
  const AgentIcon = agentConfig[agent].icon;
  
  return (
    <div className={cn("flex gap-3 slide-up", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
          isUser ? "bg-primary" : "bg-secondary"
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-primary-foreground" />
        ) : (
          <AgentIcon className={cn("w-5 h-5", agentConfig[agent].color)} />
        )}
      </div>

      {/* Message */}
      <div className={cn("max-w-[75%] space-y-1", isUser ? "items-end" : "items-start")}>
        {!isUser && (
          <span className={cn("text-xs font-medium", agentConfig[agent].color)}>
            {agentConfig[agent].label}
          </span>
        )}
        <div
          className={cn(
            "px-4 py-3 rounded-2xl",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-bl-md"
          )}
        >
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
        {timestamp && (
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        )}
      </div>
    </div>
  );
}

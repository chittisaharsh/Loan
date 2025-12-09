import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChatMessage, AgentType } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { LoanProgress, LoanStage } from "./LoanProgress";
import { MessageSquare, X, Minimize2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  agent?: AgentType;
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hello! Welcome to QuickLoan. I'm your personal loan assistant. I'm here to help you get a loan quickly and easily. What would you like to do today?",
    isUser: false,
    agent: "master",
    timestamp: "Just now",
  },
];

const quickReplies = [
  "Apply for a personal loan",
  "Check my eligibility",
  "Know about interest rates",
  "Track my application",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStage, setCurrentStage] = useState<LoanStage>("entry");
  const [currentAgent, setCurrentAgent] = useState<AgentType>("master");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // Simulate bot response
    setIsTyping(true);
    setTimeout(() => {
      let botResponse: Message;
      
      if (content.toLowerCase().includes("apply") || content.toLowerCase().includes("loan")) {
        setCurrentStage("needs");
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: "Great choice! To help you find the best loan, I need to understand your requirements. What is the primary purpose of this loan? (e.g., Home renovation, Medical expenses, Education, Wedding, Debt consolidation)",
          isUser: false,
          agent: "master",
          timestamp: "Just now",
        };
      } else if (content.toLowerCase().includes("renovation") || content.toLowerCase().includes("medical") || content.toLowerCase().includes("education")) {
        setCurrentStage("prequalification");
        setCurrentAgent("verification");
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: "Perfect! I'm now connecting you to our Verification Agent to complete your KYC. This will only take a moment. Please provide your PAN card number to proceed.",
          isUser: false,
          agent: "verification",
          timestamp: "Just now",
        };
      } else if (content.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(content)) {
        setCurrentStage("eligibility");
        setCurrentAgent("underwriting");
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: "Thank you! Your KYC details have been verified. I'm now checking your credit score and eligibility. Based on your profile, you're pre-approved for a loan up to ₹5,00,000 at 10.99% p.a.!",
          isUser: false,
          agent: "underwriting",
          timestamp: "Just now",
        };
      } else if (content.toLowerCase().includes("eligibility") || content.toLowerCase().includes("check")) {
        setCurrentStage("eligibility");
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: "I'd be happy to check your eligibility! For a quick assessment, please share your monthly income and employment type (Salaried/Self-employed).",
          isUser: false,
          agent: "underwriting",
          timestamp: "Just now",
        };
      } else {
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: "I understand. Let me help you with that. Could you please provide more details about what you're looking for?",
          isUser: false,
          agent: currentAgent,
          timestamp: "Just now",
        };
      }
      
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const handleFileUpload = (file: File) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `📎 Uploaded: ${file.name}`,
      isUser: true,
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, userMessage]);
    
    setIsTyping(true);
    setTimeout(() => {
      setCurrentStage("approval");
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Thank you for uploading ${file.name}. I'm verifying your document now. This usually takes just a few seconds...`,
        isUser: false,
        agent: "underwriting",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="hero"
        size="icon-lg"
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-chat pulse-glow z-50"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col bg-card rounded-2xl shadow-chat overflow-hidden transition-all duration-300",
        isMinimized ? "w-80 h-16" : "w-[400px] h-[600px] max-h-[80vh]"
      )}
    >
      {/* Header */}
      <div className="gradient-hero px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-primary-foreground">QuickLoan Assistant</h3>
            <p className="text-xs text-primary-foreground/80">Online • Typically replies instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Progress Tracker */}
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <LoanProgress currentStage={currentStage} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                agent={message.agent}
                timestamp={message.timestamp}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <ChatInput 
              onSend={handleSend} 
              onFileUpload={handleFileUpload}
              disabled={isTyping} 
            />
          </div>
        </>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { Check, Circle, MessageSquare, Shield, CreditCard, Handshake, FileText, CheckCircle2 } from "lucide-react";

export type LoanStage = 
  | "entry"
  | "needs"
  | "prequalification"
  | "eligibility"
  | "offer"
  | "documents"
  | "approval"
  | "sanction";

interface LoanProgressProps {
  currentStage: LoanStage;
}

const stages: { id: LoanStage; label: string; icon: React.ElementType }[] = [
  { id: "entry", label: "Start", icon: MessageSquare },
  { id: "needs", label: "Needs", icon: MessageSquare },
  { id: "prequalification", label: "KYC", icon: Shield },
  { id: "eligibility", label: "Eligibility", icon: CreditCard },
  { id: "offer", label: "Offer", icon: Handshake },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "approval", label: "Approval", icon: CheckCircle2 },
  { id: "sanction", label: "Sanction", icon: Check },
];

export function LoanProgress({ currentStage }: LoanProgressProps) {
  const currentIndex = stages.findIndex((s) => s.id === currentStage);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
          />
        </div>

        {/* Stage indicators */}
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="relative flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-secondary text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium whitespace-nowrap",
                  isCurrent && "text-primary",
                  !isCurrent && "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

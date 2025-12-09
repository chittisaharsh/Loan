import { MessageSquare, Shield, CreditCard, Handshake, FileText, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Start Chat",
    description: "Begin your loan journey by chatting with our AI assistant. Tell us your requirements.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "Quick KYC",
    description: "Our verification agent instantly verifies your identity with minimal documents.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: CreditCard,
    title: "Eligibility Check",
    description: "Real-time credit assessment to determine your loan eligibility and limits.",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    icon: Handshake,
    title: "Choose Your Offer",
    description: "Compare personalized loan offers and select the one that suits you best.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: FileText,
    title: "Upload Documents",
    description: "Simply upload required documents right in the chat. We accept photos too!",
    color: "bg-green-500/10 text-green-600",
  },
  {
    icon: CheckCircle2,
    title: "Instant Approval",
    description: "Get your sanction letter instantly. Money credited within 24 hours.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg">
            A seamless journey from application to disbursement, powered by AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative bg-card rounded-2xl p-6 shadow-soft hover:shadow-chat transition-all duration-300 hover:-translate-y-1"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shadow-md">
                {index + 1}
              </div>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl ${step.color} flex items-center justify-center mb-4`}>
                <step.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Connector Line */}
              {index < steps.length - 1 && index !== 2 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 border-t-2 border-dashed border-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Bot, Languages, FileCheck, Clock, Shield, Smartphone } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Assistance",
    description: "Our intelligent chatbot understands context and guides you through the entire loan process naturally.",
  },
  {
    icon: Languages,
    title: "Multilingual Support",
    description: "Communicate in your preferred language. We support Hindi, English, and regional languages.",
  },
  {
    icon: FileCheck,
    title: "Smart Document Processing",
    description: "Just snap and upload. Our AI extracts information automatically from your documents.",
  },
  {
    icon: Clock,
    title: "Real-Time Updates",
    description: "Track your application status in real-time. Get instant notifications at every step.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your data is protected with end-to-end encryption and strict privacy controls.",
  },
  {
    icon: Smartphone,
    title: "Voice Support",
    description: "Prefer talking? Switch to voice mode anytime for a more personal experience.",
  },
];

export function Features() {
  return (
    <section className="py-20">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose QuickLoan?
          </h2>
          <p className="text-muted-foreground text-lg">
            Experience the future of lending with our intelligent loan platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group text-center p-6 rounded-2xl hover:bg-secondary/50 transition-colors duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl gradient-hero flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow duration-300">
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

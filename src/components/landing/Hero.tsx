// src/components/Hero.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroProps {
  onStartChat?: () => void;
}

export function Hero({ onStartChat }: HeroProps) {
  const navigate = useNavigate(); // hook called inside the component

  const features = [
    { icon: Zap, text: "Instant Approval" },
    { icon: Shield, text: "100% Secure" },
    { icon: Clock, text: "24/7 Support" },
  ];

  const handleStartApplication = () => {
    try {
      if (onStartChat) onStartChat();
    } catch (e) {
      // ignore errors from caller
      // but continue to navigate
    }
    navigate("/apply");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium fade-in">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Loan Processing</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight slide-up">
            Get Your Personal Loan
            <span className="block text-primary">In Minutes, Not Months</span>
          </h1>

          {/* Subheading */}
          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Our AI-powered chatbot guides you through a seamless loan application process.
            From eligibility check to instant sanction letter – all in one conversation.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Button variant="hero" size="xl" onClick={handleStartApplication} className="group">
              Start Your Application
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button variant="outline" size="xl">
              Check Eligibility
            </Button>
          </div>

          {/* Features */}
          <div
            className="flex flex-wrap items-center justify-center gap-6 pt-8 slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-muted-foreground">
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-border mt-12 slide-up" style={{ animationDelay: "0.4s" }}>
            <p className="text-sm text-muted-foreground mb-4">Trusted by thousands of customers</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-foreground">50K+</p>
                <p className="text-sm text-muted-foreground">Loans Disbursed</p>
              </div>
              <div className="w-px h-12 bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-foreground">₹500Cr+</p>
                <p className="text-sm text-muted-foreground">Total Disbursement</p>
              </div>
              <div className="w-px h-12 bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-foreground">4.8★</p>
                <p className="text-sm text-muted-foreground">Customer Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

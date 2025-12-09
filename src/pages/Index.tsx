import { useState } from "react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";

const Index = () => {
  const [chatOpen, setChatOpen] = useState(false);

  const handleStartChat = () => {
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onStartChat={handleStartChat} />
      <main className="pt-16">
        <Hero onStartChat={handleStartChat} />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <div id="features">
          <Features />
        </div>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Index;

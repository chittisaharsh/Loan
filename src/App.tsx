// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ApplyForm from "./pages/ApplyForm";
import DocumentUpload from "./pages/DocumentUpload";
import KycVerification from "./pages/KycVerification";
import PaymentPlans from "./pages/PaymentPlans";
import TermsAndConditions from "./pages/TermsAndConditions";
import AgreementSummary from "./pages/AgreementSummary"; // ← summary / PDF page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Application Form */}
          <Route path="/apply" element={<ApplyForm />} />

          {/* Document Upload */}
          <Route path="/upload" element={<DocumentUpload />} />

          {/* KYC Result */}
          <Route path="/apply/kyc-result" element={<KycVerification />} />

          {/* Payment Plans */}
          <Route path="/plans" element={<PaymentPlans />} />

          {/* Terms & Conditions (AFTER selecting a plan) */}
          <Route path="/terms" element={<TermsAndConditions />} />

          {/* Agreement summary / printable PDF */}
          <Route path="/apply/summary" element={<AgreementSummary />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

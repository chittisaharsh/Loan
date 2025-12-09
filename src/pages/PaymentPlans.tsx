// src/pages/PaymentPlans.tsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Banknote, Clock, Percent } from "lucide-react";

type Employment = "Student" | "Self-employed" | "Salaried Employee" | "Unemployed" | string | undefined;

type PlanOption = {
  months: number;
  label: string;
};

const PLAN_OPTIONS: PlanOption[] = [
  { months: 6, label: "6 months" },
  { months: 12, label: "1 year" },
  { months: 24, label: "2 years" },
  { months: 36, label: "3 years" },
  { months: 60, label: "5 years" },
];

const ANNUAL_RATE = 0.14; // 14% p.a. compounded annually as specified

function formatCurrency(x: number) {
  if (!isFinite(x)) return "—";
  return "₹" + Math.round(x).toLocaleString();
}

function monthlyRateFromAnnualCompounded(annualRate: number) {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

function calcEMI(principal: number, monthlyRate: number, months: number) {
  if (!principal || months <= 0) return { emi: 0, totalPayable: 0, totalInterest: 0 };
  const r = monthlyRate;
  if (r === 0) {
    const emi = principal / months;
    return { emi, totalPayable: principal, totalInterest: 0 };
  }
  const factor = Math.pow(1 + r, months);
  const emi = (principal * r * factor) / (factor - 1);
  const totalPayable = emi * months;
  const totalInterest = totalPayable - principal;
  return { emi, totalPayable, totalInterest };
}

export default function PaymentPlans(): JSX.Element {
  const { state } = useLocation();
  const navigate = useNavigate();

  const stored = typeof window !== "undefined" ? sessionStorage.getItem("loanApplication") : null;
  const storedJson = stored ? JSON.parse(stored) : null;

  // Accept loan amount from navigation state (Payment flow) or fallback to stored values
  const navLoanAmount = state?.loanAmount ?? state?.requiredLoanAmount ?? null;
  const navUser = state?.user ?? null;

  const salaryFromState = navUser?.salary ?? navUser?.metadata?.salary ?? null;

  const requestedLoanRaw = Number(navLoanAmount ?? storedJson?.requiredLoanAmount ?? storedJson?.metadata?.requiredLoanAmount ?? 0);
  const salaryRaw = Number(salaryFromState ?? storedJson?.metadata?.salary ?? 0);
  const employment = (navUser?.employment ?? storedJson?.metadata?.employment ?? navUser?.employment ?? storedJson?.user?.employment) as Employment;

  const maxLoan = useMemo(() => {
    const s = Number(salaryRaw || 0);
    const emp = (employment || "").toString().trim();
    if (emp.toLowerCase() === "student") {
      if (!s || s === 0) return 5000;
      return 2 * s;
    }
    if (emp.toLowerCase().includes("self")) {
      return 3 * s;
    }
    if (emp.toLowerCase().includes("salaried")) {
      return 5 * s;
    }
    if (emp.toLowerCase().includes("unemploy")) {
      return 50000;
    }
    return 50000;
  }, [employment, salaryRaw]);

  const requestedAmount = Math.max(0, Math.round(requestedLoanRaw || 0));
  // principal = the amount that will be shown in plans (min(requested, maxLoan))
  const principal = Math.min(requestedAmount || maxLoan, maxLoan);
  const limitExceeded = requestedAmount > maxLoan;

  const monthlyRate = monthlyRateFromAnnualCompounded(ANNUAL_RATE);

  const plans = PLAN_OPTIONS.map((p) => {
    const { emi, totalPayable, totalInterest } = calcEMI(principal, monthlyRate, p.months);
    return {
      ...p,
      emi,
      totalPayable,
      totalInterest,
    };
  });

  // Recommended plan selection heuristic
  const recommendedMonths = plans.some((p) => p.months === 12) ? 12 : plans[plans.length - 1].months;

  function handleSelectPlan(planMonths: number) {
    const selected = plans.find((pl) => pl.months === planMonths);
    // persist selected plan with loanAmount so downstream pages can read it reliably
    sessionStorage.setItem(
      "selectedPlan",
      JSON.stringify({
        loanAmount: principal,
        months: selected?.months,
        annualRate: ANNUAL_RATE * 100,
        emi: selected?.emi,
        totalPayable: selected?.totalPayable,
      })
    );

    // also persist sanctioned/approved amount for global access
    try {
      sessionStorage.setItem("sanctionedAmount", String(principal));
    } catch (err) {
      // ignore storage errors in prototype
    }

    // Navigate to terms page — include loanAmount explicitly in state
    navigate("/terms", { state: { plan: selected, loanAmount: principal, user: navUser ?? storedJson?.user } });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Choose a repayment plan</h1>
          <p className="text-sm text-slate-600 mt-1">We computed eligible loan amount and professional EMI options for you.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500">You requested</div>
          <div className="bg-white border px-4 py-2 rounded-lg shadow-sm">
            <div className="text-xs text-slate-500">Requested</div>
            <div className="font-semibold text-lg">{formatCurrency(requestedAmount)}</div>
          </div>

          <div className="bg-white border px-4 py-2 rounded-lg shadow-sm">
            <div className="text-xs text-slate-500">Eligible limit</div>
            <div className="font-semibold text-lg">{formatCurrency(maxLoan)}</div>
          </div>

          <div className="bg-white border px-4 py-2 rounded-lg shadow-sm">
            <div className="text-xs text-slate-500">Sanctioned</div>
            <div className="font-semibold text-lg">{formatCurrency(principal)}</div>
          </div>
        </div>
      </header>

      {limitExceeded && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border-l-4 border-amber-400">
          <div className="font-medium text-amber-800">Requested amount exceeds eligibility</div>
          <div className="text-sm text-amber-700 mt-1">
            Based on your profile the maximum eligible loan is <strong>{formatCurrency(maxLoan)}</strong>. Plans below are shown for the eligible amount.
          </div>
        </div>
      )}

      <section className="grid gap-6">
        {plans.map((p) => {
          const isRecommended = p.months === recommendedMonths;
          return (
            <article
              key={p.months}
              className={`flex flex-col md:flex-row items-stretch justify-between gap-4 p-5 rounded-lg transition-shadow bg-white border ${
                isRecommended ? "shadow-2xl ring-1 ring-blue-50" : "shadow-sm"
              } hover:shadow-lg`}
            >
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-blue-50 p-3 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{p.label}</h3>
                      {isRecommended && (
                        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Recommended</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Tenure: <strong>{p.months} months</strong> · Rate: <strong>{(ANNUAL_RATE * 100).toFixed(2)}% p.a.</strong> (compounded annually)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <div className="text-xs text-slate-400">Loan Amount</div>
                    <div className="text-lg font-semibold">{formatCurrency(principal)}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Total Payable</div>
                    <div className="text-lg font-semibold">{formatCurrency(p.totalPayable)}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Interest (total)</div>
                    <div className="text-lg font-semibold">{formatCurrency(p.totalInterest)}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-slate-400" />
                    <span>Monthly rate ≈ {(monthlyRate * 100).toFixed(3)}%</span>
                  </div>
                  <div className="px-2 py-1 bg-slate-50 border rounded text-xs">Instant processing</div>
                </div>
              </div>

              {/* EMI card */}
              <aside className="w-full md:w-64 flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 border-l md:border-l-0 md:pl-6">
                <div className="w-full rounded-lg p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
                  <div className="text-xs opacity-90">Monthly installment</div>
                  <div className="text-2xl font-bold mt-2">{formatCurrency(p.emi)}</div>
                  <div className="text-xs opacity-90 mt-1">{p.months} installments</div>
                </div>

                <div className="w-full mt-3 text-center">
                  <button
                    aria-label={`Select ${p.label} plan`}
                    onClick={() => handleSelectPlan(p.months)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border text-blue-700 hover:bg-blue-50"
                  >
                    Select plan
                  </button>

                  <div className="mt-2 text-xs text-slate-500">
                    EMI shown is indicative. Final terms after verification.
                  </div>
                </div>
              </aside>
            </article>
          );
        })}
      </section>

      <footer className="mt-8 bg-white/40 p-4 rounded-lg text-sm text-slate-600 border">
        <div className="flex items-start gap-4">
          <Percent className="w-5 h-5 text-slate-400" />
          <div>
            <div>
              Rate: <strong>{(ANNUAL_RATE * 100).toFixed(2)}% p.a.</strong> (compounded annually) — EMIs calculated using the equivalent monthly rate derived from annual compounding.
            </div>
            <div className="mt-2 text-xs text-slate-500">
              The options shown are indicative. Final approval, interest rate, and disbursement are subject to verification & underwriting. For custom plans, contact support.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

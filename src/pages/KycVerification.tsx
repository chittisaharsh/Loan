// src/pages/KycVerification.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

/* ---------- geometry/constants ---------- */
const OUTER_RADIUS = 74;
const STROKE = 12;
const NORMALIZED_MAX = 900 - 300;       // <-- Only declared ONCE
const CIRCUMFERENCE = 2 * Math.PI * OUTER_RADIUS;

/* ---------- helpers ---------- */
function simpleHash(s: string | undefined) {
  if (!s) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function hashToRange(seed: string | undefined, min: number, max: number) {
  const h = simpleHash(seed || "");
  return min + (h % (max - min + 1));
}

function scoreCategory(score: number) {
  if (score >= 800) return { label: "Excellent", color: "#059669", recommendation: "Eligible for best rates" };
  if (score >= 750) return { label: "Very Good", color: "#15803d", recommendation: "Low interest likely" };
  if (score >= 700) return { label: "Good", color: "#65a30d", recommendation: "Competitive offers possible" };
  if (score >= 600) return { label: "Fair", color: "#d97706", recommendation: "May need co-applicant" };
  return { label: "Poor", color: "#dc2626", recommendation: "Higher risk — manual review needed" };
}

/* ---------- component ---------- */
export default function KycVerification(): JSX.Element {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { conversationId, statuses, user, requiredLoanAmount } = (state || {}) as any;

  // fallback to sessionStorage
  const storedApp = typeof window !== "undefined" ? sessionStorage.getItem("loanApplication") : null;
  const storedJson = storedApp ? JSON.parse(storedApp) : null;

  const loanAmount =
    requiredLoanAmount ??
    storedJson?.requiredLoanAmount ??
    storedJson?.metadata?.requiredLoanAmount ??
    null;

  const applicantName = user?.name ?? storedJson?.user?.name ?? "—";
  const applicantMobile = user?.mobile ?? storedJson?.user?.mobile ?? "—";

  const employment =
    user?.employment ??
    storedJson?.metadata?.employment ??
    storedJson?.user?.employment ??
    "—";

  /* ---------- Score calculation ---------- */
  const seed = `${applicantName}_${applicantMobile}`;

  const targetScore = useMemo(() => {
    const emp = (employment || "").toLowerCase();
    if (emp === "student") return hashToRange(seed, 670, 710);
    if (emp.includes("self")) return hashToRange(seed, 700, 780);
    if (emp.includes("salaried")) return hashToRange(seed, 750, 850);
    if (emp.includes("unemploy")) return hashToRange(seed, 450, 550);
    return hashToRange(seed, 650, 750);
  }, [seed, employment]);

  const [animatedScore, setAnimatedScore] = useState(300);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    const delay = 300;
    const duration = 1000;
    let raf: number = 0;
    let start: number | null = null;

    const timeout = setTimeout(() => {
      setShowScore(true);

      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min(1, (timestamp - start) / duration);

        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(300 + (targetScore - 300) * ease);
        setAnimatedScore(current);

        if (progress < 1) raf = requestAnimationFrame(animate);
      };

      raf = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [targetScore]);

  const pct = Math.max(0, Math.min(1, (animatedScore - 300) / NORMALIZED_MAX));
  const dashoffset = CIRCUMFERENCE * (1 - pct);

  const category = scoreCategory(animatedScore);
  const showConfetti = animatedScore >= 800;

  function handleContinue() {
    navigate("/plans", {
      state: { user, loanAmount }
    });
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-8"
         style={{ background: "linear-gradient(180deg,#f8fafc,#eef2ff)" }}>
      <div className="w-full max-w-5xl space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">KYC Completed</h2>
            <p className="text-sm text-slate-600">Your documents have been verified successfully.</p>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-500">Applicant</div>
            <div className="font-medium">{applicantName}</div>
            <div className="text-sm text-slate-500">{applicantMobile}</div>
          </div>
        </div>

        {/* Main Section: Left Summary + Right Score */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left Side */}
          <div className="md:col-span-2 space-y-4">
            {/* KYC Card */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <p className="text-lg font-semibold">KYC Verified</p>
                <p className="text-sm text-slate-600">
                  All documents verified {conversationId ? `(ID: ${conversationId})` : ""}
                </p>

                <p className="mt-3 text-sm text-slate-700">
                  Employment: <strong>{employment}</strong>  
                  &nbsp;·&nbsp; Requested loan: <strong>₹{loanAmount?.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            {/* Documents Status */}
            <div className="p-4 border rounded-lg bg-white/60">
              <div className="text-xs text-slate-500">Documents status</div>
              <ul className="mt-2 list-disc list-inside text-sm">
                {Object.entries(statuses || {}).map(([k]) => (
                  <li key={k} className="capitalize">
                    {k.replace(/_/g, " ")}:
                    <span className="text-green-600 font-medium ml-1">Verified</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="p-4 border rounded-lg bg-white/60">
              <div className="text-xs text-slate-500">Next steps</div>
              <ul className="list-disc list-inside text-sm mt-2 text-slate-700">
                <li>Review payment plans</li>
                <li>Select a preferred EMI schedule</li>
                <li>Submit for approval</li>
              </ul>
            </div>
          </div>

          {/* Right Side - CIBIL Score */}
          <div className="relative p-5 bg-gradient-to-b from-white to-slate-50 border rounded-xl flex flex-col items-center">

            {/* Confetti */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none">
                🎉🎉🎉
              </div>
            )}

            {/* Circle */}
            <svg width={OUTER_RADIUS * 2 + STROKE * 2}
                 height={OUTER_RADIUS * 2 + STROKE * 2}>
              <g transform={`translate(${STROKE},${STROKE})`}>
                <circle
                  r={OUTER_RADIUS}
                  cx={OUTER_RADIUS}
                  cy={OUTER_RADIUS}
                  stroke="#e5e7eb"
                  strokeWidth={STROKE}
                  fill="transparent"
                />

                <circle
                  r={OUTER_RADIUS}
                  cx={OUTER_RADIUS}
                  cy={OUTER_RADIUS}
                  fill="transparent"
                  stroke={category.color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashoffset}
                  transform={`rotate(-90 ${OUTER_RADIUS} ${OUTER_RADIUS})`}
                  style={{ transition: "stroke-dashoffset .4s ease" }}
                />

                <foreignObject x={OUTER_RADIUS - 40} y={OUTER_RADIUS - 24} width="80" height="48">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold">{animatedScore}</div>
                    <div className="text-xs text-slate-500">CIBIL score</div>
                  </div>
                </foreignObject>
              </g>
            </svg>

            {/* Score Details */}
            <div className="w-full mt-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Credit Rating</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-semibold">{animatedScore}</span>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ background: `${category.color}22`, color: category.color }}
                    >
                      {category.label}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Range</p>
                  <p className="text-sm font-medium">300–900</p>
                </div>
              </div>

              {/* Bar */}
              <div className="h-2 w-full bg-slate-200 rounded mt-4 overflow-hidden">
                <div
                  style={{
                    width: `${pct * 100}%`,
                    background: category.color,
                    height: "100%",
                    transition: "width .6s ease"
                  }}
                />
              </div>

              <p className="text-xs text-slate-500 mt-2">
                {category.recommendation}
              </p>

              <button
                onClick={handleContinue}
                className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center">Team Intellcia.</p>
      </div>
    </div>
  );
}

// src/pages/TermsAndConditions.tsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* -------------------- Helpers -------------------- */

function makeToken() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const time = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const rand = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, "0")
    .toUpperCase();
  return `${time}-${rand}`;
}

function prettyBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/* -------------------- Component -------------------- */

export default function TermsAndConditions(): JSX.Element {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { plan, loanAmount, user } = (state || {}) as any;

  // (NEW) Read sanctioned amount if state loanAmount missing
  const sanctionedAmount =
    loanAmount ??
    Number(sessionStorage.getItem("sanctionedAmount")) ??
    plan?.loanAmount ??
    0;

  const [acknowledged, setAcknowledged] = useState(false);
  const [collateralName, setCollateralName] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedOk, setUploadedOk] = useState(false);

  const token = useMemo(() => makeToken(), []);

  function validateAndProceed() {
    setErrors(null);

    if (!acknowledged) {
      setErrors("You must acknowledge the Terms & Conditions to continue.");
      return;
    }

    // validation for collateral
    if ((collateralName && !proofFile) || (!collateralName && proofFile)) {
      setErrors("Both collateral name and proof document are required when providing collateral.");
      return;
    }

    if (proofFile) {
      setUploading(true);
      setTimeout(() => {
        setUploading(false);
        setUploadedOk(true);
        persistAndNavigate();
      }, 600 + Math.random() * 600);
    } else {
      persistAndNavigate();
    }
  }

  /* -------------------- Save final agreement -------------------- */

  function persistAndNavigate() {
    try {
      const agreement = {
        token,
        acknowledgedAt: new Date().toISOString(),
        plan: plan ?? null,
        sanctionedAmount, // 🔥 always the correct loan amount
        collateral: collateralName
          ? {
              name: collateralName,
              proofFileName: proofFile?.name ?? null,
              proofFileType: proofFile?.type ?? null,
              proofFileSize: proofFile?.size ?? null,
            }
          : null,
        user: user ?? null,
      };

      sessionStorage.setItem("loanAgreement", JSON.stringify(agreement));
    } catch {}

    navigate("/apply/summary", { state: { agreementSaved: true, token } });
  }

  function onFileChange(f?: File | null) {
    setUploadedOk(false);
    setProofFile(f ?? null);
  }

  /* -------------------- UI -------------------- */

  return (
    <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6">

        {/* Selected Plan Header */}
        {plan && (
          <div className="mb-4 p-3 rounded border bg-slate-50">
            <div className="text-sm text-slate-600">Selected Plan</div>

            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="font-medium">{plan.months} months</div>
                <div className="text-xs text-slate-500">
                  EMI: ₹{Math.round(plan.emi).toLocaleString()}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-slate-500">Sanctioned Amount</div>
                <div className="font-semibold text-lg">
                  ₹{Number(sanctionedAmount).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-semibold mb-3">Terms & Conditions</h1>

        <p className="text-sm text-muted-foreground mb-4">
          Please read the terms and conditions carefully before proceeding.
        </p>

        {/* Terms list */}
        <div className="space-y-3 mb-6 max-h-56 overflow-y-auto pr-2">
          <ol className="list-decimal list-inside text-sm space-y-2 text-slate-700">
            <li><strong>Loan amount:</strong> You agree the sanctioned amount is accurate.</li>
            <li><strong>Interest:</strong> Charged as per plan at 14% p.a. compounded annually.</li>
            <li><strong>Repayment:</strong> You agree to repay EMIs on time.</li>
            <li><strong>Prepayment:</strong> Foreclosure rules apply as per lender policy.</li>
            <li><strong>Verification:</strong> Lender may verify documents or deny disbursement.</li>
            <li><strong>Collateral:</strong> If provided, you confirm legal ownership.</li>
            <li><strong>Default:</strong> May lead to penalties & report to credit bureau.</li>
            <li><strong>Governing law:</strong> As per Indian financial regulations.</li>
          </ol>
        </div>

        {/* Acknowledgement */}
        <div className="mb-4">
          <label className="inline-flex items-start gap-3">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">I acknowledge the Terms & Conditions.</span>
          </label>
        </div>

        {/* Collateral Section */}
        <div className="border-t pt-4 space-y-4">
          <h2 className="text-lg font-medium">Collateral (optional)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium">Collateral Name</label>
              <input
                value={collateralName}
                onChange={(e) => setCollateralName(e.target.value)}
                placeholder="e.g., Honda City 2018, Flat in Pune"
                className="mt-1 block w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Proof of Asset (upload)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full"
              />

              {proofFile && (
                <div className="mt-2 text-xs text-slate-700">
                  <strong>{proofFile.name}</strong>
                  <div className="text-slate-500">{prettyBytes(proofFile.size)}</div>
                </div>
              )}

              {uploadedOk && (
                <div className="text-xs text-green-600 mt-1">
                  Proof uploaded (simulated)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {errors && <div className="mt-4 text-sm text-red-600">{errors}</div>}

        {/* Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={validateAndProceed}
            disabled={uploading}
            className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Acknowledge & Continue"}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded"
          >
            Back
          </button>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          By continuing you confirm that all submitted information is true.
        </div>
      </div>
    </div>
  );
}

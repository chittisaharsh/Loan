// src/pages/TermsAndConditions.tsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * TermsAndConditions.tsx
 *
 * - Expects navigation state (optional): { plan, loanAmount, user }
 * - Shows loan T&C, acknowledgement checkbox, collateral name + proof upload.
 * - Persists agreement + collateral to sessionStorage (includes token) and navigates to /apply/summary
 */

function makeToken() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const time = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(
    d.getMinutes()
  )}${pad(d.getSeconds())}`;
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

export default function TermsAndConditions(): JSX.Element {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { plan, loanAmount, user } = (state || {}) as any;

  const [acknowledged, setAcknowledged] = useState(false);
  const [collateralName, setCollateralName] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedOk, setUploadedOk] = useState(false);

  const token = useMemo(() => makeToken(), []); // generated once per mount

  function validateAndProceed() {
    setErrors(null);

    if (!acknowledged) {
      setErrors("You must acknowledge the Terms & Conditions to continue.");
      return;
    }

    // If user provided collateral name or file, require both
    if ((collateralName && !proofFile) || (!collateralName && proofFile)) {
      setErrors("Both collateral name and proof document are required when providing collateral.");
      return;
    }

    // simulate upload if file present
    if (proofFile) {
      setUploading(true);
      setTimeout(() => {
        setUploading(false);
        setUploadedOk(true);
        persistAndNavigate();
      }, 700 + Math.random() * 800);
    } else {
      persistAndNavigate();
    }
  }

  function persistAndNavigate() {
    try {
      const existing = typeof window !== "undefined" ? sessionStorage.getItem("loanApplication") : null;
      const base = existing ? JSON.parse(existing) : {};
      const agreement = {
        token,
        acknowledgedAt: new Date().toISOString(),
        plan: plan ?? null,
        loanAmount: loanAmount ?? base?.metadata?.requiredLoanAmount ?? null,
        collateral: collateralName
          ? {
              name: collateralName,
              proofFileName: proofFile?.name ?? null,
              proofFileType: proofFile?.type ?? null,
              proofFileSize: proofFile?.size ?? null,
            }
          : null,
        user: user ?? base?.user ?? null,
      };

      // Save agreement
      sessionStorage.setItem("loanAgreement", JSON.stringify(agreement));
    } catch (err) {
      // ignore in prototype
      // console.warn(err);
    }

    // navigate to printable summary and pass token
    navigate("/apply/summary", { state: { agreementSaved: true, token } });
  }

  function onFileChange(f?: File | null) {
    setUploadedOk(false);
    setProofFile(f ?? null);
  }

  return (
    <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6">
        {/* Plan summary */}
        {(plan || loanAmount) && (
          <div className="mb-4 p-3 rounded border bg-slate-50">
            <div className="text-sm text-slate-600">Selected plan</div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="font-medium">{plan?.months ? `${plan.months} months` : "Custom plan"}</div>
                <div className="text-xs text-slate-500">EMI: {plan?.emi ? `₹${Math.round(plan.emi).toLocaleString()}` : "—"}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Loan</div>
                <div className="font-semibold">₹{(loanAmount ?? plan?.loanAmount ?? 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-semibold mb-3">Terms & Conditions</h1>

        <p className="text-sm text-muted-foreground mb-4">
          Please read the terms and conditions carefully before proceeding. By acknowledging, you accept the following:
        </p>

        <div className="space-y-3 mb-6 max-h-56 overflow-y-auto pr-2">
          <ol className="list-decimal list-inside text-sm space-y-2 text-slate-700">
            <li>
              <strong>Loan amount & purpose:</strong> The borrower confirms the requested loan amount and its stated purpose
              are accurate. Misrepresentation may lead to rejection or recall.
            </li>

            <li>
              <strong>Interest & charges:</strong> Interest is charged on the principal at the rate disclosed at the time of
              offer. Interest computed on the reducing balance or compounded annually as per plan details.
            </li>

            <li>
              <strong>Repayment:</strong> Borrower agrees to repay EMIs on schedule. Late payments may incur penalties and
              impact credit score.
            </li>

            <li>
              <strong>Prepayment & foreclosure:</strong> Prepayment/foreclosure policies (applicable charges, notice period)
              will be specified in the sanction letter.
            </li>

            <li>
              <strong>Verification & fraud:</strong> The lender reserves the right to verify any information and refuse or
              recall disbursement in case of fraud, misrepresentation, or adverse findings.
            </li>

            <li>
              <strong>Collateral & security:</strong> Where collateral is provided, borrower warrants legal ownership and
              agrees to hand over documents as required. Collateral valuation and legal checks may be performed.
            </li>

            <li>
              <strong>Default:</strong> On default, lender may initiate recovery, report to credit bureaus, and enforce
              security if applicable.
            </li>

            <li>
              <strong>Governing law:</strong> These terms are governed by applicable laws and jurisdiction of the borrower's
              residence / lender's registered office.
            </li>
          </ol>
        </div>

        {/* Acknowledge */}
        <div className="mb-4">
          <label className="inline-flex items-start gap-3">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              I acknowledge that I have read and agree to the Terms & Conditions above.
            </span>
          </label>
        </div>

        {/* Collateral segment */}
        <div className="border-t pt-4 space-y-4">
          <h2 className="text-lg font-medium">Collateral (if any)</h2>
          <p className="text-sm text-muted-foreground">If you wish to provide collateral to improve approval chances, enter details below.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Collateral - Name</label>
              <input
                value={collateralName}
                onChange={(e) => setCollateralName(e.target.value)}
                placeholder="e.g. 2018 Honda City (vehicle), 2BHK flat in Pune"
                className="mt-1 block w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Proof of asset (upload)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full"
              />

              {/* File preview */}
              {proofFile && (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-700">
                    <div className="font-medium">{proofFile.name}</div>
                    <div className="text-xs text-slate-500">{proofFile.type || "file"} · {prettyBytes(proofFile.size)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProofFile(null);
                        setUploadedOk(false);
                      }}
                      className="text-xs px-2 py-1 border rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {uploadedOk && <div className="text-xs text-green-600 mt-2">Proof uploaded (simulated)</div>}
            </div>
          </div>
        </div>

        {/* Errors */}
        {errors && <div className="mt-4 text-sm text-red-600">{errors}</div>}

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={validateAndProceed}
            disabled={uploading || !acknowledged || (!!collateralName && !proofFile) || (!collateralName && !!proofFile)}
            className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "I Acknowledge & Continue"}
          </button>

          <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded">
            Back
          </button>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          By continuing you confirm you are authorised to submit the collateral documents and that the information provided is true.
        </div>
      </div>
    </div>
  );
}

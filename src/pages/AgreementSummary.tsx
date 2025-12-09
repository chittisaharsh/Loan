// src/pages/AgreementSummary.tsx
import React, { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * AgreementSummary.tsx
 *
 * - Reads 'loanAgreement' and 'selectedPlan' from sessionStorage.
 * - Generates a token number if not present.
 * - Shows printable preview inside an iframe using srcDoc.
 * - "Download PDF" triggers the browser print dialog (user saves as PDF).
 * - "Download JSON" gives a machine-readable backup.
 *
 * Notes:
 * - Browser print -> Save as PDF is the most-compatible approach without extra libs.
 * - If you later add jsPDF/html2canvas, we can produce a binary PDF automatically.
 */

function makeToken() {
  // deterministic-ish token: YYYYMMDD-HHMMSS-4hex
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

function formatINR(n?: number | null) {
  if (!n && n !== 0) return "—";
  return "₹" + Number(n).toLocaleString();
}

export default function AgreementSummary(): JSX.Element {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // read stored objects (Terms page & PaymentPlans saved them)
  const loanAgreement =
    (typeof window !== "undefined" && sessionStorage.getItem("loanAgreement")) || null;
  const selectedPlan =
    (typeof window !== "undefined" && sessionStorage.getItem("selectedPlan")) || null;

  const agreement = loanAgreement ? JSON.parse(loanAgreement) : null;
  const plan = selectedPlan ? JSON.parse(selectedPlan) : null;

  // built/derived fields
  const token = agreement?.token ?? makeToken();
  const generatedAt = agreement?.acknowledgedAt ?? new Date().toISOString();

  // final document payload that we will persist (so it exists for later)
  const finalDoc = useMemo(() => {
    const doc = {
      token,
      generatedAt,
      applicant: agreement?.user ?? null,
      loanAmount: agreement?.loanAmount ?? plan?.loanAmount ?? null,
      plan: plan ?? agreement?.plan ?? null,
      collateral: agreement?.collateral ?? null,
      acknowledgedAt: agreement?.acknowledgedAt ?? new Date().toISOString(),
      meta: {
        savedFrom: "web-prototype",
      },
    };
    // persist back (so token is saved for future)
    try {
      sessionStorage.setItem("finalAgreement", JSON.stringify(doc));
      // also save token back to loanAgreement for traceability
      const la = agreement ? { ...agreement, token } : { token, acknowledgedAt: generatedAt };
      sessionStorage.setItem("loanAgreement", JSON.stringify(la));
    } catch (err) {
      // ignore storage errors in prototype
    }
    return doc;
  }, [agreement, plan, token, generatedAt]);

  // Build an HTML string for print preview
  const printableHtml = useMemo(() => {
    const applicantName = finalDoc.applicant?.name ?? "—";
    const mobile = finalDoc.applicant?.mobile ?? "—";
    const loanAmt = formatINR(finalDoc.loanAmount);
    const planLabel = finalDoc.plan?.months ? `${finalDoc.plan.months} months` : "—";
    const emi = finalDoc.plan?.emi ? formatINR(Math.round(finalDoc.plan.emi)) : "—";
    const totalPayable = finalDoc.plan?.totalPayable ? formatINR(Math.round(finalDoc.plan.totalPayable)) : "—";
    const collateralName = finalDoc.collateral?.name ?? "—";
    const collateralProof = finalDoc.collateral?.proofFileName ?? "—";

    const now = new Date(finalDoc.generatedAt).toLocaleString();

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Loan Agreement — ${token}</title>
<style>
  body { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color: #111827; padding: 28px; }
  .container { max-width: 800px; margin: 0 auto; border: 1px solid #e6edf3; padding: 24px; border-radius: 8px; }
  h1 { font-size: 20px; margin: 0 0 8px; color: #0f172a; }
  h2 { font-size: 14px; margin: 12px 0 6px; color: #0f172a; }
  .muted { color: #6b7280; font-size: 13px; }
  .row { display:flex; justify-content:space-between; margin:8px 0; }
  .box { border-radius:6px; background:#f8fafc; padding:10px; border:1px solid #eef2ff; }
  .small { font-size: 12px; color: #374151; }
  table { width:100%; border-collapse:collapse; margin-top:12px;}
  td, th { padding:10px; border:1px solid #e6edf3; font-size:13px; vertical-align:top; }
  .right { text-align:right; }
  .token { font-weight:700; color:#0ea5a4; }
  .sig { margin-top:24px; }
  footer { font-size:11px; color:#6b7280; margin-top:18px; border-top:1px dashed #e6edf3; padding-top:10px; }
</style>
</head>
<body>
  <div class="container">
    <h1>Loan Agreement — Preview</h1>
    <div class="muted">Token: <span class="token">${token}</span> · Generated: ${now}</div>

    <h2>Applicant</h2>
    <div class="row">
      <div>
        <div class="small">Name</div>
        <div>${applicantName}</div>
      </div>
      <div class="right">
        <div class="small">Mobile</div>
        <div>${mobile}</div>
      </div>
    </div>

    <h2>Loan Summary</h2>
    <table>
      <tbody>
        <tr>
          <th>Requested / Approved Amount</th>
          <td class="right">${loanAmt}</td>
        </tr>
        <tr>
          <th>Selected Plan</th>
          <td class="right">${planLabel} · EMI: ${emi} / month</td>
        </tr>
        <tr>
          <th>Total Payable</th>
          <td class="right">${totalPayable}</td>
        </tr>
      </tbody>
    </table>

    <h2>Collateral (if provided)</h2>
    <div class="box">
      <div class="small">Collateral name</div>
      <div>${collateralName}</div>
      <div class="small" style="margin-top:8px">Proof document</div>
      <div>${collateralProof}</div>
    </div>

    <h2>Acknowledgement</h2>
    <p class="small">I/We acknowledge that the information provided in this application is true and complete to the best of my knowledge. I/We agree to the Terms & Conditions provided at the time of application. This document is a system-generated preview and the final sanction letter will be issued upon approval.</p>

    <div class="sig">
      <div class="row">
        <div>
          <div class="small">Applicant signature (electronic)</div>
          <div style="margin-top:12px">__________________________</div>
          <div class="small muted">Name: ${applicantName}</div>
        </div>

        <div class="right">
          <div class="small">Authorized by</div>
          <div style="margin-top:12px">__________________________</div>
          <div class="small muted">Team Intellcia</div>
        </div>
      </div>
    </div>

    <footer>
      This is a prototype agreement preview. Final agreement terms, interest rate, and amounts are subject to verification, underwriting, and regulatory checks.
    </footer>
  </div>
</body>
</html>`;
  }, [finalDoc, token]);

  // print / download actions
  function handlePrint() {
    // If the iframe exists, ask it to print; else open a new window
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
    } else {
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(printableHtml);
      w.document.close();
      w.focus();
      // user must manually Print -> Save as PDF
    }
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(finalDoc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loan-agreement-${token}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadHTML() {
    const blob = new Blob([printableHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loan-agreement-${token}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!finalDoc) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold">No agreement found</h2>
        <p className="text-sm text-slate-600">We couldn't find a saved agreement. Go back and complete the acknowledgement step.</p>
        <div className="mt-4">
          <button onClick={() => navigate("/")} className="px-4 py-2 bg-blue-600 text-white rounded">Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agreement created</h1>
          <p className="text-sm text-slate-600">Agreement token: <strong className="text-green-700">{finalDoc.token}</strong></p>
        </div>

        <div className="flex gap-3">
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded shadow">Download PDF</button>
          <button onClick={downloadHTML} className="px-4 py-2 border rounded">Download HTML</button>
          <button onClick={downloadJSON} className="px-4 py-2 border rounded">Download JSON</button>
        </div>
      </div>

      <div>
        <div className="text-sm text-slate-500 mb-2">Preview</div>
        <div style={{ height: 640, border: "1px solid #e6edf3", borderRadius: 8, overflow: "hidden" }}>
          <iframe
            ref={iframeRef}
            title="Agreement preview"
            srcDoc={printableHtml}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Tip: Click <strong>Download PDF</strong> to open the browser print dialog; choose "Save as PDF" to download the PDF copy. If your browser blocks popups for printing, use the HTML download then print locally.
      </div>

      <div className="pt-6 border-t text-sm text-slate-600">
        <div>Agreement token: <strong>{finalDoc.token}</strong></div>
        <div>Generated at: <strong>{new Date(finalDoc.generatedAt).toLocaleString()}</strong></div>
      </div>
    </div>
  );
}

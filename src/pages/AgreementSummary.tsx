// src/pages/AgreementSummary.tsx
import React, { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * AgreementSummary.tsx — polished UI
 *
 * Behavior:
 * - Reads 'loanAgreement' and 'selectedPlan' from sessionStorage.
 * - Builds a printable HTML preview (srcDoc) and shows it inside an iframe.
 * - "Download PDF" triggers the iframe print (user saves as PDF).
 * - Also offers HTML / JSON downloads and copy-token.
 */

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

function formatINR(n?: number | null) {
    if (n === null || n === undefined) return "—";
    return "₹" + Number(n).toLocaleString();
}

export default function AgreementSummary(): JSX.Element {
    const navigate = useNavigate();
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const loanAgreementRaw =
        (typeof window !== "undefined" && sessionStorage.getItem("loanAgreement")) || null;
    const selectedPlanRaw =
        (typeof window !== "undefined" && sessionStorage.getItem("selectedPlan")) || null;

    const agreement = loanAgreementRaw ? JSON.parse(loanAgreementRaw) : null;
    const plan = selectedPlanRaw ? JSON.parse(selectedPlanRaw) : null;

    const token = agreement?.token ?? makeToken();
    const generatedAt = agreement?.acknowledgedAt ?? new Date().toISOString();

    const finalDoc = useMemo(() => {
        const doc = {
            token,
            generatedAt,
            applicant: agreement?.user ?? null,
            loanAmount: agreement?.sanctionedAmount ?? agreement?.loanAmount ?? plan?.loanAmount ?? null,
            plan: plan ?? agreement?.plan ?? null,
            collateral: agreement?.collateral ?? null,
            acknowledgedAt: agreement?.acknowledgedAt ?? new Date().toISOString(),
            meta: { savedFrom: "web-prototype" },
        };

        try {
            sessionStorage.setItem("finalAgreement", JSON.stringify(doc));
            // also store token back into loanAgreement for traceability
            const la = agreement ? { ...agreement, token } : { token, acknowledgedAt: generatedAt };
            sessionStorage.setItem("loanAgreement", JSON.stringify(la));
        } catch (err) {
            // ignore storage errors for prototype
        }

        return doc;
    }, [agreement, plan, token, generatedAt]);

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
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  :root{
    --bg:#ffffff; --muted:#6b7280; --border:#e6edf3; --accent:#0ea5a4; --title:#0f172a;
    --card:#f8fafc; --ink:#0f172a;
  }
  body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; margin:0; padding:28px; color:var(--ink); background: #fbfdff;}
  .container{max-width:780px; margin:0 auto; background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:22px;}
  h1{font-size:20px; margin:0 0 6px; color:var(--title);}
  .muted{color:var(--muted); font-size:13px;}
  .row{display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin:10px 0;}
  .box{background:var(--card); border:1px solid var(--border); padding:12px; border-radius:8px;}
  table{width:100%; border-collapse:collapse; margin-top:14px;}
  th, td{padding:12px; border:1px solid var(--border); text-align:left; font-size:13px;}
  th{background:#fbfeff; color:var(--muted); width:55%;}
  .right{text-align:right;}
  .token{font-weight:700; color:var(--accent);}
  .kbd{display:inline-block; padding:6px 8px; background:#0f172a0d; border-radius:6px; font-size:12px;}
  footer{font-size:11px; color:var(--muted); margin-top:18px; border-top:1px dashed var(--border); padding-top:12px;}
  .sig{margin-top:20px; display:flex; justify-content:space-between; gap:12px;}
  .sig .block{width:48%;}
  .small{font-size:12px; color:var(--muted);}
</style>
</head>
<body>
  <div class="container">
    <h1>Sanctioned Loan Agreement — Preview</h1>
    <div class="muted">Token: <span class="token">${token}</span> · Generated: ${now}</div>

    <hr style="border:none; height:10px" />

    <div class="row">
      <div style="flex:1;">
        <div class="small">Applicant</div>
        <div style="font-weight:600; margin-top:6px;">${applicantName}</div>
        <div class="muted" style="margin-top:4px;">Mobile: ${mobile}</div>
      </div>

      <div style="width:280px;">
        <div class="small">Sanctioned Amount</div>
        <div style="font-size:20px; font-weight:700; color:var(--title); margin-top:6px;">${loanAmt}</div>
        <div class="muted small" style="margin-top:6px;">Plan: <span style="font-weight:600">${planLabel}</span></div>
        <div class="muted small">EMI: <span style="font-weight:600">${emi} / mo</span></div>
      </div>
    </div>

    <h2 style="font-size:14px; margin-top:18px; margin-bottom:8px; color:var(--title)">Loan Summary</h2>
    <table>
      <tbody>
        <tr><th>Approved Amount</th><td class="right">${loanAmt}</td></tr>
        <tr><th>Selected Repayment</th><td class="right">${planLabel} · EMI ${emi} / month</td></tr>
        <tr><th>Total Payable (incl. interest)</th><td class="right">${totalPayable}</td></tr>
        <tr><th>Agreement token</th><td class="right"><span class="kbd">${token}</span></td></tr>
      </tbody>
    </table>

    <h2 style="font-size:14px; margin-top:18px; color:var(--title)">Collateral</h2>
    <div class="box">
      <div style="font-size:13px; color:var(--muted)">Collateral name</div>
      <div style="font-weight:600; margin-top:6px;">${collateralName}</div>
      <div style="font-size:13px; color:var(--muted); margin-top:8px">Proof document</div>
      <div style="margin-top:6px;">${collateralProof}</div>
    </div>

    <h2 style="font-size:14px; margin-top:18px; color:var(--title)">Acknowledge</h2>
    <p style="font-size:13px; color:var(--muted); line-height:1.45">
      I/We acknowledge that the information provided in this application is true and accurate. This is a system-generated preview — the final sanction letter will be issued upon completion of verification and underwriting.
    </p>

    <div class="sig">
      <div class="block">
        <div class="small">Applicant (electronic)</div>
        <div style="margin-top:18px">__________________________</div>
        <div class="small muted" style="margin-top:8px">Name: ${applicantName}</div>
      </div>

      <div class="block" style="text-align:right">
        <div class="small">Authorized signatory</div>
        <div style="margin-top:18px">__________________________</div>
        <div class="small muted" style="margin-top:8px">Team Intellcia</div>
      </div>
    </div>

    <footer>
      This document is a prototype preview. Final agreement, terms, rates and disbursement are subject to verification and lender underwriting. For queries contact support.
    </footer>
  </div>
</body>
</html>`;
    }, [finalDoc, token]);

    function handlePrint() {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
            // focus + print the iframe content (best chance to produce single-page PDF)
            iframe.contentWindow!.focus();
            iframe.contentWindow!.print();
        } else {
            const w = window.open("", "_blank");
            if (!w) return;
            w.document.write(printableHtml);
            w.document.close();
            w.focus();
        }
    }

    function downloadJSON() {
        const blob = new Blob([JSON.stringify(finalDoc, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `loan-agreement-${finalDoc.token}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function downloadHTML() {
        const blob = new Blob([printableHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `loan-agreement-${finalDoc.token}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function copyToken() {
        try {
            navigator.clipboard?.writeText(finalDoc.token);
            // simple visual feedback — browser default alert (keeps file dependency-free)
            // You can replace with your Toaster component.
            alert("Agreement token copied to clipboard");
        } catch {
            alert(`Token: ${finalDoc.token}`);
        }
    }

    if (!finalDoc) {
        return (
            <div className="p-8 max-w-3xl mx-auto">
                <h2 className="text-xl font-semibold">No agreement found</h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                    We couldn't find a saved agreement. Go back and complete the acknowledgement step.
                </p>
                <div style={{ marginTop: 16 }}>
                    <button onClick={() => navigate("/")} style={{ padding: "8px 12px", background: "#0ea5a4", color: "#fff", borderRadius: 8, border: "none" }}>
                        Back to home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1100, margin: "28px auto", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22 }}>Agreement created</h1>
                    <div style={{ color: "#6b7280", marginTop: 6 }}>
                        Agreement token:&nbsp;
                        <strong style={{ color: "#047857" }}>{finalDoc.token}</strong>
                        <button
                            onClick={copyToken}
                            aria-label="Copy token"
                            style={{ marginLeft: 10, padding: "6px 8px", borderRadius: 8, border: "1px solid #e6edf3", background: "#fff" }}
                        >
                            Copy
                        </button>
                    </div>
                    <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>
                        Generated: {new Date(finalDoc.generatedAt).toLocaleString()}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={handlePrint}
                        style={{ padding: "10px 14px", background: "#0ea5a4", color: "#fff", borderRadius: 10, border: "none", cursor: "pointer" }}
                    >
                        Download PDF
                    </button>

                    <button
                        onClick={downloadHTML}
                        style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e6edf3", background: "#fff", cursor: "pointer" }}
                    >
                        Download HTML
                    </button>

                    <button
                        onClick={downloadJSON}
                        style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e6edf3", background: "#fff", cursor: "pointer" }}
                    >
                        Download JSON
                    </button>
                </div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
                <div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1, padding: 14, borderRadius: 12, background: "#fff", border: "1px solid #e6edf3" }}>
                            <div style={{ color: "#6b7280", fontSize: 13 }}>Applicant</div>
                            <div style={{ fontWeight: 700, marginTop: 6 }}>{finalDoc.applicant?.name ?? "—"}</div>
                            <div style={{ color: "#6b7280", marginTop: 6 }}>{finalDoc.applicant?.mobile ?? "—"}</div>
                        </div>

                        <div style={{ width: 220, padding: 14, borderRadius: 12, background: "#fff", border: "1px solid #e6edf3", textAlign: "right" }}>
                            <div style={{ color: "#6b7280", fontSize: 13 }}>Sanctioned Amount</div>
                            <div style={{ fontWeight: 800, fontSize: 20, marginTop: 6 }}>{formatINR(finalDoc.loanAmount)}</div>
                            <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>{finalDoc.plan?.months ?? "—"} months</div>
                        </div>
                    </div>

                    <div style={{ background: "#fff", border: "1px solid #e6edf3", borderRadius: 12, overflow: "hidden" }}>
                        <div style={{ padding: 14 }}>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>Loan Details</div>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <tbody>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #f1f5f9", width: "45%", color: "#6b7280" }}>Approved / Requested</th>
                                        <td style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #f1f5f9" }}>{formatINR(finalDoc.loanAmount)}</td>
                                    </tr>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #f1f5f9", color: "#6b7280" }}>Selected Plan</th>
                                        <td style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                                            {finalDoc.plan?.months ? `${finalDoc.plan.months} months` : "—"} · EMI: {finalDoc.plan?.emi ? formatINR(Math.round(finalDoc.plan.emi)) : "—"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: 10, color: "#6b7280" }}>Total Payable</th>
                                        <td style={{ textAlign: "right", padding: 10 }}>{finalDoc.plan?.totalPayable ? formatINR(Math.round(finalDoc.plan.totalPayable)) : "—"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div>
                    <div style={{ height: 520, border: "1px solid #e6edf3", borderRadius: 10, overflow: "hidden" }}>
                        <iframe
                            ref={iframeRef}
                            title="Agreement preview"
                            srcDoc={printableHtml}
                            style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
                        />
                    </div>

                    <div style={{ marginTop: 8, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                        Preview — use "Download PDF" to print/save as PDF.
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 18, color: "#6b7280", fontSize: 13 }}>
                Agreement token: <strong style={{ color: "#047857" }}>{finalDoc.token}</strong> · Generated at: {new Date(finalDoc.generatedAt).toLocaleString()}
            </div>
        </div>
    );
}

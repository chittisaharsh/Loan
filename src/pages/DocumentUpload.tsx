// src/pages/DocumentUpload.tsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type RequiredDoc = {
  key: string;
  label?: string;
  accept?: string;
};

type UploadState = {
  conversationId?: string;
  requiredDocs?: RequiredDoc[];
  user?: { name?: string; mobile?: string; employment?: string; salary?: number };
  loanAmount?: number;
};

/**
 * Build default required docs by employment type (used when no requiredDocs passed in state).
 */
function deriveRequiredDocsForEmployment(emp?: string): RequiredDoc[] {
  const id = { key: "ID_PROOF", label: "Government ID (PAN / Aadhaar)", accept: "image/*,application/pdf" };
  if (!emp) return [id];

  const e = emp.toString().toLowerCase();
  if (e === "student") {
    return [
      id,
      { key: "STUDENT_ID_CARD", label: "Student ID Card", accept: "image/*" },
      { key: "ADDRESS_PROOF", label: "Address Proof (Utility Bill)", accept: "image/*,application/pdf" },
    ];
  }
  if (e === "self-employed" || e === "self employed" || e === "selfemployed") {
    return [
      id,
      { key: "BUSINESS_REGISTRATION", label: "Business Registration / GST / Invoice", accept: "image/*,application/pdf" },
      { key: "BANK_STATEMENT_6M", label: "Bank Statement (6 months)", accept: "application/pdf,image/*" },
      { key: "PROFIT_LOSS", label: "Profit & Loss / Income Proof", accept: "application/pdf,image/*" },
    ];
  }
  if (e === "salaried employee" || e === "salaried") {
    return [
      id,
      { key: "EMPLOYMENT_PROOF", label: "Employment Proof (Offer Letter / Employer ID)", accept: "image/*,application/pdf" },
      { key: "SALARY_SLIP_3M", label: "Salary Slips (Last 3 months)", accept: "application/pdf,image/*" },
      { key: "BANK_STATEMENT_3M", label: "Bank Statement (Last 3 months)", accept: "application/pdf,image/*" },
    ];
  }
  if (e === "unemployed" || e === "unemployeed") {
    return [
      id,
      { key: "CO_APPLICANT_DOC", label: "Co-applicant / Guarantor ID & Consent", accept: "image/*,application/pdf" },
      { key: "ASSET_PROOF", label: "Asset Proof (Property / Vehicle documents)", accept: "image/*,application/pdf" },
    ];
  }
  // default fallback
  return [id];
}

export default function DocumentUpload(): JSX.Element {
  const { state } = useLocation();
  const navigate = useNavigate();
  const s = (state || {}) as UploadState;

  // Try read stored loan application (persisted by ApplyForm)
  const storedRaw = typeof window !== "undefined" ? sessionStorage.getItem("loanApplication") : null;
  const stored = storedRaw ? (JSON.parse(storedRaw) as any) : null;

  // Determine requiredDocs:
  // - Prefer state.requiredDocs
  // - Else derive from stored metadata.user.employment
  const requiredDocsFromState = s.requiredDocs && s.requiredDocs.length > 0 ? s.requiredDocs : undefined;
  const employmentFromState = s.user?.employment ?? stored?.metadata?.employment ?? stored?.user?.employment;
  const requiredDocs = useMemo<RequiredDoc[]>(
    () => requiredDocsFromState ?? deriveRequiredDocsForEmployment(employmentFromState),
    [requiredDocsFromState, employmentFromState]
  );

  // conversationId/user/loanAmount resolution (priority: state -> stored)
  const conversationId = s.conversationId ?? stored?.conversationId ?? null;
  const user = s.user ?? stored?.user ?? { name: undefined, mobile: undefined };
  const loanAmount = (s.loanAmount as number) ?? stored?.metadata?.requiredLoanAmount ?? undefined;

  // initial state maps
  const initialFiles = useMemo(() => Object.fromEntries(requiredDocs.map((d) => [d.key, null as File | null])), [requiredDocs]);
  const initialStatus = useMemo(() => Object.fromEntries(requiredDocs.map((d) => [d.key, "pending"])), [requiredDocs]);
  const initialFileNames = useMemo(() => Object.fromEntries(requiredDocs.map((d) => [d.key, ""])), [requiredDocs]);

  const [files, setFiles] = useState<Record<string, File | null>>(initialFiles);
  const [status, setStatus] = useState<Record<string, string>>(initialStatus);
  const [fileNames, setFileNames] = useState<Record<string, string>>(initialFileNames);
  const [uploadingAll, setUploadingAll] = useState(false);
  const [processingKyc, setProcessingKyc] = useState(false);

  function onFileChange(docKey: string, f?: File) {
    setFiles((s) => ({ ...s, [docKey]: f || null }));
    setFileNames((s) => ({ ...s, [docKey]: f ? f.name : "" }));
    setStatus((s) => ({ ...s, [docKey]: "" }));
  }

  // Simulate a single-file "upload" (no network) — mark as uploaded after tiny delay
  function simulateUploadOne(docKey: string) {
    const file = files[docKey];
    if (!file) {
      setStatus((s) => ({ ...s, [docKey]: "no_file" }));
      return;
    }
    setStatus((s) => ({ ...s, [docKey]: "uploading" }));

    setTimeout(() => {
      setStatus((s) => ({ ...s, [docKey]: "uploaded" }));
    }, 500 + Math.random() * 400);
  }

  // Upload all files (simulated), then show KYC processing screen for 3 seconds
  async function uploadAllAndProcessKyc() {
    setUploadingAll(true);

    for (const doc of requiredDocs) {
      if (files[doc.key]) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>((resolve) => {
          setStatus((s) => ({ ...s, [doc.key]: "uploading" }));
          setTimeout(() => {
            setStatus((s) => ({ ...s, [doc.key]: "uploaded" }));
            resolve();
          }, 400 + Math.random() * 600);
        });
      } else {
        setStatus((s) => ({ ...s, [doc.key]: "no_file" }));
      }
    }

    setUploadingAll(false);

    // start KYC processing UI
    setProcessingKyc(true);

    setTimeout(() => {
      setProcessingKyc(false);

      // Build statuses snapshot and pass along. Also include loanAmount and user.
      const statusesSnapshot = { ...status };
      // If some statuses still empty (race), ensure they reflect uploaded/no_file
      requiredDocs.forEach((d) => {
        if (!statusesSnapshot[d.key]) statusesSnapshot[d.key] = files[d.key] ? "uploaded" : "no_file";
      });

      navigate("/apply/kyc-result", {
        state: {
          conversationId,
          statuses: statusesSnapshot,
          user,
          loanAmount,
        },
      });
    }, 3000);
  }

  // Fullscreen KYC loader
  if (processingKyc) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95">
        <div className="text-center">
          <div className="mb-4 animate-spin inline-block w-12 h-12 border-4 rounded-full border-t-transparent" />
          <h3 className="text-xl font-semibold">KYC is being processed</h3>
          <p className="text-sm text-muted-foreground mt-2">This won't take long.</p>
        </div>
      </div>
    );
  }

  // If nothing to upload (defensive)
  if (!requiredDocs || requiredDocs.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">No documents required</h2>
        <p>If you were redirected here accidentally, go back to the application page.</p>
        <div className="mt-4">
          <button className="px-4 py-2 rounded border" onClick={() => navigate("/apply")}>
            Back to Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Upload Documents</h2>
          <p className="text-sm text-muted-foreground">Upload the documents requested for verification (prototype: uploads are local only).</p>
        </div>

        <div className="text-right">
          <div className="text-sm text-muted-foreground">Applicant</div>
          <div className="font-medium">{user?.name ?? "—"}</div>
          <div className="text-sm">{user?.mobile ?? "—"}</div>
          {loanAmount !== undefined && (
            <div className="text-sm mt-1 text-muted-foreground">Requested loan: <strong>₹{Number(loanAmount).toLocaleString()}</strong></div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {requiredDocs.map((doc) => (
          <div key={doc.key} className="p-3 border rounded flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium">{doc.label ?? doc.key}</div>
              <div className="text-sm text-muted-foreground">Accepted: {doc.accept ?? "JPG, PNG, PDF"}</div>
              <div className="text-xs text-muted-foreground mt-1">Status: {status[doc.key]}</div>
              {fileNames[doc.key] && <div className="text-xs mt-1 text-muted-foreground">File: {fileNames[doc.key]}</div>}
            </div>

            <input
              type="file"
              accept={doc.accept ?? "image/*,application/pdf"}
              onChange={(e) => onFileChange(doc.key, e.target.files?.[0])}
            />

            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="px-3 py-2 bg-blue-600 text-white rounded"
                onClick={() => simulateUploadOne(doc.key)}
              >
                Upload
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={uploadAllAndProcessKyc}
          disabled={uploadingAll}
        >
          {uploadingAll ? "Uploading..." : "Upload & Process KYC"}
        </button>

        <button type="button" className="px-4 py-2 border rounded" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  );
}

// src/pages/ApplyForm.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ApplyForm.tsx (no external network calls)
 *
 * - Client-only prototype: no n8n dependency.
 * - Persists loanApplication in sessionStorage and navigates to /upload with state.
 */

type EmploymentOption = "Student" | "Self-employed" | "Salaried Employee" | "Unemployed";

type FormState = {
  name: string;
  age: string;
  mobile: string;
  address: string;
  pan: string;
  aadhar: string;
  employment: EmploymentOption | "";
  salary: string;
  requiredLoanAmount: string;
  loanPurpose: string;
};

export default function ApplyForm(): JSX.Element {
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState<boolean>(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    age: "",
    mobile: "",
    address: "",
    pan: "",
    aadhar: "",
    employment: "",
    salary: "",
    requiredLoanAmount: "",
    loanPurpose: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastPayload, setLastPayload] = useState<object | null>(null);

  function handleStartClick() {
    setShowForm(true);
  }

  function updateField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    const ageNum = Number(form.age);
    if (!form.age || Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 120) e.age = "Enter a valid age.";
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = "Enter a 10-digit mobile number.";
    if (!form.address.trim()) e.address = "Address is required.";
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan.toUpperCase())) e.pan = "PAN must be 10 characters: e.g. ABCDE1234F";
    if (!/^\d{12}$/.test(form.aadhar)) e.aadhar = "Aadhaar must be 12 digits.";
    if (!form.employment) e.employment = "Select employment status.";
    if (!form.salary || Number.isNaN(Number(form.salary)) || Number(form.salary) < 0) e.salary = "Enter a valid salary.";
    if (
      !form.requiredLoanAmount ||
      Number.isNaN(Number(form.requiredLoanAmount)) ||
      Number(form.requiredLoanAmount) <= 0
    )
      e.requiredLoanAmount = "Enter valid loan amount.";
    if (!form.loanPurpose.trim()) e.loanPurpose = "Loan purpose is required.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildPayload() {
    const payload = {
      type: "chat",
      conversationId: null as string | null,
      user: {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
      },
      metadata: {
        age: Number(form.age),
        address: form.address.trim(),
        pan: form.pan.trim().toUpperCase(),
        aadhar: form.aadhar.trim(),
        employment: form.employment,
        salary: Number(form.salary),
        requiredLoanAmount: Number(form.requiredLoanAmount),
        loanPurpose: form.loanPurpose.trim(),
      },
      message: "Start Application: user submitted personal details (client-side)",
    };
    return payload;
  }

  function generateConversationId() {
    // simple unique id: conv_<timestamp>_<random 4 hex>
    const rnd = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, "0");
    return `conv_${new Date().toISOString()}_${rnd}`;
  }

  // Save loan application to sessionStorage (so subsequent pages can read it)
  function persistLoanApplication(payload: ReturnType<typeof buildPayload>, conversationId: string) {
    try {
      const toStore = {
        user: payload.user,
        metadata: payload.metadata,
        conversationId,
      };
      sessionStorage.setItem("loanApplication", JSON.stringify(toStore));
    } catch (err) {
      // ignore storage errors in prototype
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validate()) return;
    const payload = buildPayload();
    setLastPayload(payload);

    setSending(true);
    try {
      // generate conversation id locally
      const conversationId = generateConversationId();
      payload.conversationId = conversationId;

      // persist locally
      persistLoanApplication(payload, conversationId);

      // navigate to upload page — DocumentUpload will derive requiredDocs if none passed
      navigate("/upload", {
        state: {
          conversationId,
          user: payload.user,
          loanAmount: payload.metadata.requiredLoanAmount,
        },
      });
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, form: err?.message || String(err) }));
    } finally {
      setSending(false);
    }
  }

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? <p className="text-sm text-red-600 mt-1">{errors[name]}</p> : null;

  if (!showForm && !window.location.pathname.includes("/apply")) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Ready to apply?</h2>
        <p className="mb-4">Click start to begin your loan application.</p>
        <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleStartClick}>
          Start Application
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Loan Application — Personal Details</h2>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2"
            placeholder="Full name"
          />
          <FieldError name="name" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Age</label>
            <input
              value={form.age}
              onChange={(e) => updateField("age", e.target.value.replace(/[^0-9]/g, ""))}
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="e.g. 28"
            />
            <FieldError name="age" />
          </div>

          <div>
            <label className="block text-sm font-medium">Mobile number</label>
            <input
              value={form.mobile}
              onChange={(e) => updateField("mobile", e.target.value.replace(/[^0-9]/g, ""))}
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="10-digit mobile"
            />
            <FieldError name="mobile" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2"
            rows={3}
          />
          <FieldError name="address" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">PAN card number</label>
            <input
              value={form.pan}
              onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
              className="mt-1 block w-full rounded border px-3 py-2 uppercase"
              placeholder="ABCDE1234F"
              maxLength={10}
            />
            <FieldError name="pan" />
          </div>

          <div>
            <label className="block text-sm font medium">Aadhaar number</label>
            <input
              value={form.aadhar}
              onChange={(e) => updateField("aadhar", e.target.value.replace(/[^0-9]/g, ""))}
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="12-digit Aadhaar"
              maxLength={12}
            />
            <FieldError name="aadhar" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Employment</label>
            <select
              value={form.employment}
              onChange={(e) => updateField("employment", e.target.value as EmploymentOption)}
              className="mt-1 block w-full rounded border px-3 py-2"
            >
              <option value="">Select</option>
              <option value="Student">Student</option>
              <option value="Self-employed">Self-employed</option>
              <option value="Salaried Employee">Salaried Employee</option>
              <option value="Unemployed">Unemployed</option>
            </select>
            <FieldError name="employment" />
          </div>

          <div>
            <label className="block text-sm font-medium">Salary (numbers)</label>
            <input
              value={form.salary}
              onChange={(e) => updateField("salary", e.target.value.replace(/[^0-9]/g, ""))}
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="Annual or monthly depending on your flow"
            />
            <FieldError name="salary" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Required loan amount</label>
            <input
              value={form.requiredLoanAmount}
              onChange={(e) => updateField("requiredLoanAmount", e.target.value.replace(/[^0-9]/g, ""))}
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="Numeric value"
            />
            <FieldError name="requiredLoanAmount" />
          </div>

          <div>
            <label className="block text-sm font-medium">Loan purpose</label>
            <input
              value={form.loanPurpose}
              onChange={(e) => updateField("loanPurpose", e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="e.g. Home improvement, education, business capital"
            />
            <FieldError name="loanPurpose" />
          </div>
        </div>

        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {sending ? "Submitting..." : "Submit Application"}
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded border"
            onClick={() => {
              setForm({
                name: "",
                age: "",
                mobile: "",
                address: "",
                pan: "",
                aadhar: "",
                employment: "",
                salary: "",
                requiredLoanAmount: "",
                loanPurpose: "",
              });
              setErrors({});
            }}
          >
            Reset
          </button>
        </div>

        {lastPayload && (
          <div className="mt-4 p-3 rounded bg-gray-50 border">
            <h4 className="font-medium">Payload (JSON) — ready to send</h4>
            <pre className="text-xs overflow-x-auto mt-2">{JSON.stringify(lastPayload, null, 2)}</pre>
          </div>
        )}
      </form>
    </div>
  );
}

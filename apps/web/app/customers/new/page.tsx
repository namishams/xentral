"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, Panel, PanelHeader, PanelBody } from "@xentral/ui";

const TAX: [string, string][] = [
  ["", "— Select tax treatment —"],
  ["vat_registered", "VAT Registered (UAE)"],
  ["vat_not_registered", "VAT Not Registered (UAE)"],
  ["gcc_vat_registered", "GCC VAT Registered"],
  ["gcc_vat_not_registered", "GCC VAT Not Registered"],
  ["non_gcc", "Non-GCC"],
  ["designated_zone", "Designated Zone (VAT Registered)"],
];
const TRN_REQUIRED = ["vat_registered", "gcc_vat_registered", "designated_zone"];
const UAE_SUPPLY = ["vat_registered", "vat_not_registered", "designated_zone"];
const EMIRATES = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];
const TERMS: [string, string][] = [["due_on_receipt", "Due on receipt"], ["net15", "Net 15"], ["net30", "Net 30"], ["net45", "Net 45"], ["net60", "Net 60"]];
const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR"];
const SALUT = ["", "Mr.", "Mrs.", "Ms.", "Dr."];

type F = {
  customerType: string; salutation: string; firstName: string; lastName: string; companyName: string; displayName: string;
  email: string; phone: string; mobile: string; taxTreatment: string; vatNumber: string; placeOfSupply: string;
  currency: string; paymentTerms: string; addressLine1: string; addressLine2: string; city: string; country: string;
  shipAddressLine1: string; shipAddressLine2: string; shipCity: string; shipCountry: string; notes: string;
};
const EMPTY: F = { customerType: "business", salutation: "", firstName: "", lastName: "", companyName: "", displayName: "", email: "", phone: "", mobile: "", taxTreatment: "", vatNumber: "", placeOfSupply: "", currency: "AED", paymentTerms: "due_on_receipt", addressLine1: "", addressLine2: "", city: "", country: "United Arab Emirates", shipAddressLine1: "", shipAddressLine2: "", shipCity: "", shipCountry: "", notes: "" };

const lab: React.CSSProperties = { display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
const inS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

export default function NewCustomerPage() {
  const [f, setF] = React.useState<F>(EMPTY);
  const [sameShip, setSameShip] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const set = (k: keyof F, v: string) => setF((p) => ({ ...p, [k]: v }));

  // function (not component) → inputs keep focus across re-renders
  const field = (k: keyof F, label: string, ph?: string, type?: string) => (
    <div><label style={lab}>{label}</label><input type={type || "text"} value={f[k] ?? ""} placeholder={ph} onChange={(e) => set(k, e.target.value)} style={inS} /></div>
  );

  const trnRequired = TRN_REQUIRED.includes(f.taxTreatment);
  const showSupply = UAE_SUPPLY.includes(f.taxTreatment);
  const autoDisplay = f.displayName || f.companyName || [f.firstName, f.lastName].filter(Boolean).join(" ");

  async function save() {
    setErr("");
    if (!autoDisplay.trim()) { setErr("Enter a company name, contact name or display name."); return; }
    if (trnRequired && !/^\d{15}$/.test(f.vatNumber)) { setErr("TRN must be exactly 15 digits for this tax treatment."); return; }
    if (f.vatNumber && !/^\d{15}$/.test(f.vatNumber)) { setErr("TRN must be exactly 15 digits."); return; }
    setBusy(true);
    const payload: F = { ...f, displayName: autoDisplay };
    if (sameShip) { payload.shipAddressLine1 = f.addressLine1; payload.shipAddressLine2 = f.addressLine2; payload.shipCity = f.city; payload.shipCountry = f.country; }
    const r = await fetch("/api/books/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(d.error || "Could not create customer"); return; }
    window.location.href = `/customers/${d.id}`;
  }

  return (
    <AppShell active="customers">
      <PageTitleRow title="New customer" breadcrumb="Customers · New"
        actions={<span style={{ display: "inline-flex", gap: 8 }}>
          <Button onClick={() => { window.location.href = "/customers"; }}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save customer"}</Button>
        </span>} />

      {err && <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 500, color: color.status.negative, background: "#FEF2F2", border: `1px solid ${color.status.negative}33`, borderRadius: 8, padding: "9px 12px" }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Customer details" />
            <PanelBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <div>
                  <label style={lab}>Customer type</label>
                  <div style={{ display: "inline-flex", border: `1px solid ${color.line.strong}`, borderRadius: 8, overflow: "hidden" }}>
                    {["business", "individual"].map((t) => (
                      <button key={t} onClick={() => set("customerType", t)} style={{ padding: "8px 18px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: f.customerType === t ? color.brand.primary : color.surface.card, color: f.customerType === t ? color.ink.onPrimary : color.ink.mid, textTransform: "capitalize" }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr", gap: 12 }}>
                  <div><label style={lab}>Title</label><select value={f.salutation} onChange={(e) => set("salutation", e.target.value)} style={inS}>{SALUT.map((x) => <option key={x} value={x}>{x || "—"}</option>)}</select></div>
                  {field("firstName", "First name", "Ahmed")}
                  {field("lastName", "Last name", "Al Mansoori")}
                </div>
                {f.customerType === "business" ? field("companyName", "Company name", "Acme Trading LLC") : null}
                <div>
                  <label style={lab}>Display name *</label>
                  <input value={f.displayName} placeholder={autoDisplay || "How this customer appears on invoices"} onChange={(e) => set("displayName", e.target.value)} style={inS} />
                  {!f.displayName && autoDisplay ? <div style={{ fontSize: 11.5, color: color.ink.soft, marginTop: 4 }}>Defaults to &ldquo;{autoDisplay}&rdquo;.</div> : null}
                </div>
                <div style={grid2}>
                  {field("email", "Email", "billing@company.ae", "email")}
                  {field("phone", "Work phone", "+971 4 xxx xxxx")}
                </div>
                {field("mobile", "Mobile", "+971 50 xxx xxxx")}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Billing address" />
            <PanelBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {field("addressLine1", "Address line 1", "Office / building")}
                {field("addressLine2", "Address line 2", "Area / street")}
                <div style={grid2}>{field("city", "City", "Dubai")}{field("country", "Country")}</div>
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Tax treatment" subtitle="UAE VAT — determines how tax is applied on invoices" />
            <PanelBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <div>
                  <label style={lab}>Tax treatment</label>
                  <select value={f.taxTreatment} onChange={(e) => set("taxTreatment", e.target.value)} style={inS}>{TAX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                </div>
                {(trnRequired || f.vatNumber) ? (
                  <div>
                    <label style={lab}>TRN (Tax Registration Number){trnRequired ? " *" : ""}</label>
                    <input value={f.vatNumber} placeholder="15 digits" maxLength={15} onChange={(e) => set("vatNumber", e.target.value.replace(/\D/g, ""))} style={inS} />
                    <div style={{ fontSize: 11.5, color: f.vatNumber && !/^\d{15}$/.test(f.vatNumber) ? color.status.negative : color.ink.soft, marginTop: 4 }}>{f.vatNumber ? `${f.vatNumber.length}/15 digits` : "Required for VAT-registered customers."}</div>
                  </div>
                ) : null}
                {showSupply ? (
                  <div>
                    <label style={lab}>Place of supply (Emirate)</label>
                    <select value={f.placeOfSupply} onChange={(e) => set("placeOfSupply", e.target.value)} style={inS}><option value="">— Select emirate —</option>{EMIRATES.map((x) => <option key={x} value={x}>{x}</option>)}</select>
                  </div>
                ) : null}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Billing preferences" />
            <PanelBody>
              <div style={grid2}>
                <div><label style={lab}>Currency</label><select value={f.currency} onChange={(e) => set("currency", e.target.value)} style={inS}>{CURRENCIES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
                <div><label style={lab}>Payment terms</label><select value={f.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} style={inS}>{TERMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Shipping address" />
            <PanelBody>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: color.ink.mid, cursor: "pointer", marginBottom: sameShip ? 0 : 12 }}>
                <input type="checkbox" checked={sameShip} onChange={(e) => setSameShip(e.target.checked)} /> Same as billing address
              </label>
              {!sameShip ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  {field("shipAddressLine1", "Address line 1")}
                  {field("shipAddressLine2", "Address line 2")}
                  <div style={grid2}>{field("shipCity", "City")}{field("shipCountry", "Country")}</div>
                </div>
              ) : null}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Notes" />
            <PanelBody>
              <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Internal notes about this customer" style={{ width: "100%", boxSizing: "border-box", padding: "8px 11px", borderRadius: 8, border: `1px solid ${color.line.strong}`, fontSize: 13.5, color: color.ink.DEFAULT, resize: "vertical", fontFamily: "inherit" }} />
            </PanelBody>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

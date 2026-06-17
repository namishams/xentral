"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button, StatusBadge, type BadgeTone } from "@xentral/ui";
import { listProducts } from "@xentral/module-erp";

const aed = (n: number) => `AED ${n.toLocaleString()}`;

function stockState(stock: number): { label: string; tone: BadgeTone } {
  if (stock <= 0) return { label: "Out of stock", tone: "critical" };
  if (stock < 10) return { label: "Low stock", tone: "warning" };
  return { label: "In stock", tone: "positive" };
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: 0 }}>{title}</h2>{action}
      </div>
      {children}
    </section>
  );
}
function SumRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
      <span style={{ fontSize: 13, color: color.ink.soft }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT }}>{children}</span>
    </div>
  );
}

export default function ProductRecordPage({ params }: { params: { id: string } }) {
  const products = listProducts();
  const pr = products.find((x) => x.id === params.id) ?? products[0];
  if (!pr) return <AppShell active="products"><p style={{ fontSize: 13, color: color.ink.soft }}>Product not found.</p></AppShell>;
  const ss = stockState(pr.stock);
  const stockLabel = pr.stock >= 999 ? "Unlimited" : String(pr.stock);

  return (
    <AppShell active="products">
      <a href="/products" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Products</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{pr.name}</h1>
            <StatusBadge tone="info" label={pr.category} />
            <StatusBadge tone={ss.tone} label={ss.label} />
          </div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>SKU {pr.sku}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Edit</Button>
          <Button>Duplicate</Button>
          <Button>Adjust stock</Button>
          <Button variant="primary">Add to quote</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Price" value={aed(pr.price)} note={`${pr.currency} · ex VAT`} noteTone={color.ink.soft} />
        <KPICard label="Stock on hand" value={stockLabel} note={ss.label} noteTone={ss.tone === "positive" ? color.status.positive : ss.tone === "warning" ? color.status.critical : color.status.negative} />
        <KPICard label="Category" value={pr.category} note="classification" noteTone={color.ink.soft} />
        <KPICard label="With VAT" value={aed(Math.round(pr.price * 1.05))} note="5% UAE VAT" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Pricing &amp; tax">
            <SumRow label="List price (ex VAT)">{aed(pr.price)}</SumRow>
            <SumRow label="VAT 5%">{aed(Math.round(pr.price * 0.05))}</SumRow>
            <SumRow label="Price incl. VAT">{aed(Math.round(pr.price * 1.05))}</SumRow>
            <SumRow label="Currency">{pr.currency}</SumRow>
          </Panel>
          <Panel title="Recent movement">
            <div style={{ fontSize: 12.5, color: color.ink.soft }}>{pr.stock >= 999 ? "Service item — no stock tracking." : "No stock movements recorded yet."}</div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Details">
            <SumRow label="SKU">{pr.sku}</SumRow>
            <SumRow label="Category">{pr.category}</SumRow>
            <SumRow label="Stock">{stockLabel}</SumRow>
            <SumRow label="Status"><StatusBadge tone={ss.tone} label={ss.label} /></SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — spec sheets, images.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (product) · locked AppShell + KPICard + StatusBadge + Button · tokens only</p>
    </AppShell>
  );
}

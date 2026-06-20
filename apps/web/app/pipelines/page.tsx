"use client";

import * as React from "react";
import { color, pipeline } from "@xentral/config";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";

const aed = (n: number) => `AED ${n.toLocaleString()}`;
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

type Card = { id: string; name: string; account: string; value: number; owner: string };
type Stage = { id: keyof typeof pipeline; label: string; cards: Card[] };

const STAGES: Stage[] = [
  { id: "new", label: "New", cards: [
    { id: "d1", name: "Office relocation", account: "Gulf Trading", value: 12000, owner: "Nami" },
    { id: "d2", name: "Brochure reorder", account: "Al Noor", value: 4200, owner: "Lena" },
  ] },
  { id: "qualified", label: "Qualified", cards: [
    { id: "d3", name: "Fit-out — Skyline Tower", account: "Skyline", value: 86000, owner: "Sara" },
  ] },
  { id: "proposal", label: "Proposal", cards: [
    { id: "d4", name: "Villa portfolio", account: "Damac", value: 142000, owner: "Omar" },
    { id: "d5", name: "Lock supply contract", account: "Bright Interiors", value: 31000, owner: "Sara" },
  ] },
  { id: "negotiation", label: "Negotiation", cards: [
    { id: "d6", name: "Annual retainer", account: "Brokerage Co", value: 90000, owner: "Nami" },
  ] },
  { id: "won", label: "Won", cards: [
    { id: "d7", name: "Reception revamp", account: "Damac", value: 54000, owner: "Omar" },
  ] },
];

function CardTile({ c }: { c: Card }) {
  return (
    <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9, padding: "11px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{c.name}</span>
      <span style={{ fontSize: 12, color: color.ink.soft }}>{c.account}</span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{aed(c.value)}</span>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(c.owner)}</span>
      </div>
    </div>
  );
}

export default function PipelinesPage() {
  return (
    <AppShell active="pipelines">
      <PageTitleRow title="Pipeline" subtitle="Sales pipeline · drag deals across stages" actions={<Button variant="primary">+ New deal</Button>} />
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, alignItems: "flex-start" }}>
        {STAGES.map((s) => {
          const tok = pipeline[s.id];
          const sum = s.cards.reduce((a, c) => a + c.value, 0);
          return (
            <div key={s.id} style={{ width: 244, flexShrink: 0, background: color.surface.page, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 11, padding: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: tok.bg }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{s.label}</span>
                  <span style={{ fontSize: 12, color: color.ink.soft }}>{s.cards.length}</span>
                </span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{aed(sum)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {s.cards.map((c) => <CardTile key={c.id} c={c} />)}
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Kanban pipeline · pastel stage tokens from @xentral/config · tokens only</p>
    </AppShell>
  );
}

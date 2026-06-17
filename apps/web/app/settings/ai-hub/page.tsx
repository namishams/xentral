"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

type Provider = { id: string; name: string; models: string; status: "connected" | "byok" | "off" };
const PROVIDERS: Provider[] = [
  { id: "anthropic", name: "Anthropic (Claude)", models: "Opus, Sonnet, Haiku", status: "connected" },
  { id: "openai", name: "OpenAI", models: "GPT-4o, o-series", status: "byok" },
  { id: "google", name: "Google (Gemini)", models: "1.5 Pro/Flash", status: "byok" },
  { id: "mistral", name: "Mistral", models: "Large, Small", status: "off" },
];
type Agent = { id: string; name: string; role: string; model: string; status: "on" | "off" };
const AGENTS: Agent[] = [
  { id: "wa", name: "WhatsApp Qualifier", role: "Scores & replies to inbound leads", model: "Claude Sonnet", status: "on" },
  { id: "deal", name: "Deal Copilot", role: "Drafts next steps on records", model: "Claude Opus", status: "on" },
  { id: "books", name: "Finance Assistant", role: "Drafts invoices, explains VAT", model: "Claude Sonnet", status: "on" },
  { id: "camp", name: "Campaign Writer", role: "Generates campaign copy", model: "GPT-4o", status: "off" },
];
const P_TONE: Record<Provider["status"], BadgeTone> = { connected: "positive", byok: "info", off: "neutral" };
const A_TONE: Record<Agent["status"], BadgeTone> = { on: "positive", off: "neutral" };

const PCols: Column<Provider>[] = [
  { key: "name", header: "Provider", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "models", header: "Models", render: (r) => <span style={{ color: color.ink.mid }}>{r.models}</span> },
  { key: "status", header: "Status", width: 130, render: (r) => <StatusBadge tone={P_TONE[r.status]} label={r.status === "byok" ? "BYOK" : r.status} /> },
];
const ACols: Column<Agent>[] = [
  { key: "name", header: "Agent", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{r.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.role}</span></span> },
  { key: "model", header: "Model", width: 150, render: (r) => <span style={{ color: color.ink.mid }}>{r.model}</span> },
  { key: "status", header: "", width: 90, render: (r) => <StatusBadge tone={A_TONE[r.status]} label={r.status === "on" ? "active" : "off"} /> },
];

export default function AiHubPage() {
  return (
    <AppShell active="ai-hub">
      <PageTitleRow title="AI Hub" subtitle="Providers, models and agents — one control center" actions={<Button variant="primary">+ Add provider</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Providers" value={String(PROVIDERS.filter((p) => p.status !== "off").length)} note="connected / BYOK" noteTone={color.status.positive} />
        <KPICard label="Active agents" value={String(AGENTS.filter((a) => a.status === "on").length)} note={`of ${AGENTS.length}`} noteTone={color.ink.soft} />
        <KPICard label="Credits used" value="AED 124" note="this month" noteTone={color.ink.soft} />
        <KPICard label="Default model" value="Claude Sonnet" note="workspace" noteTone={color.brand.primary} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 8 }}>Providers</div>
      <DataTable columns={PCols} rows={PROVIDERS} getKey={(r) => r.id} />
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, margin: "20px 0 8px" }}>Agents</div>
      <DataTable columns={ACols} rows={AGENTS} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>AI Hub · providers · models · agents · tokens-only, theme-aware</p>
    </AppShell>
  );
}

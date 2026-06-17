"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, StatusBadge } from "@xentral/ui";

const TIERS = [
  { name: "Affiliate", commission: "15%", reqs: "Refer customers via your link", current: false },
  { name: "Gold", commission: "25%", reqs: "5+ active referrals", current: true },
  { name: "Platinum", commission: "35%", reqs: "20+ active referrals + certification", current: false },
];

export default function PartnerPage() {
  return (
    <AppShell active="partner">
      <PageTitleRow title="Partner Program" subtitle="Grow with Xentral — implementation and referral partners" actions={<Button variant="primary">Apply to upgrade</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Your tier" value="Gold" note="25% lifetime" noteTone={color.brand.primary} />
        <KPICard label="Co-sell leads" value="7" note="shared by Xentral" noteTone={color.status.positive} />
        <KPICard label="Certifications" value="2/3" note="team certified" noteTone={color.ink.soft} />
        <KPICard label="MDF balance" value="AED 5,000" note="marketing fund" noteTone={color.ink.soft} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 14 }}>
        {TIERS.map((t) => (
          <div key={t.name} style={{ background: color.surface.card, border: `1px solid ${t.current ? color.brand.primary : color.line.DEFAULT}`, borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT }}>{t.name}</span>
              {t.current ? <StatusBadge tone="positive" label="current" /> : null}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: color.brand.primary }}>{t.commission}</div>
            <div style={{ fontSize: 12.5, color: color.ink.soft }}>{t.reqs}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Partner program · tiers + co-sell + MDF · tokens-only, theme-aware</p>
    </AppShell>
  );
}

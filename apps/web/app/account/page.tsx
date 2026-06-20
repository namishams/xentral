"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge, Panel, PanelHeader, PanelBody } from "@xentral/ui";

type Me = { userName?: string; email?: string; role?: string; avatar?: string | null; phone?: string; companyName?: string };

const initials = (s: string) => (s || "?").split(/[\s@.]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

export default function AccountPage() {
  const [me, setMe] = React.useState<Me | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [photoBusy, setPhotoBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      setMe(d); setName(d.userName || ""); setPhone(d.phone || ""); setAvatar(d.avatar || null); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setErr(""); setPhotoBusy(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await fetch("/api/me/avatar", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setErr(d.error || "Upload failed"); else { setAvatar(d.avatar); setMsg("Profile photo updated — it now shows in the top bar."); }
    } finally { setPhotoBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }
  async function removePhoto() {
    setPhotoBusy(true); setErr("");
    try { const r = await fetch("/api/me/avatar", { method: "DELETE" }); if (r.ok) { setAvatar(null); setMsg("Profile photo removed."); } } finally { setPhotoBusy(false); }
  }
  async function save() {
    setBusy(true); setErr(""); setMsg("");
    const r = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) });
    setBusy(false);
    if (!r.ok) { const d = await r.json().catch(() => ({})); setErr(d.error || "Save failed"); return; }
    setMsg("Profile saved.");
  }

  const lab: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
  const inS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 14, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };

  if (loading) return <AppShell active="account"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;

  return (
    <AppShell active="account">
      <PageTitleRow title="My profile" breadcrumb="Account · Profile"
        badge={me?.role ? <StatusBadge tone="info" label={me.role} /> : null}
        actions={<Button variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>} />

      {msg && <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 500, color: color.status.positive, background: "#F0FDF4", border: `1px solid ${color.status.positive}33`, borderRadius: 8, padding: "9px 12px" }}>{msg}</div>}
      {err && <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 500, color: color.status.negative, background: "#FEF2F2", border: `1px solid ${color.status.negative}33`, borderRadius: 8, padding: "9px 12px" }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <Panel>
          <PanelHeader title="Profile photo" subtitle="Shown in the top bar and across the app" />
          <PanelBody>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ width: 80, height: 80, flexShrink: 0, borderRadius: "50%", overflow: "hidden", background: avatar ? "transparent" : color.brand.primary, color: color.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, border: `1px solid ${color.line.strong}` }}>
                {avatar ? <img src={avatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(name || me?.userName || "?")}
              </span>
              <div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} style={{ display: "none" }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button variant="primary" onClick={() => fileRef.current?.click()} disabled={photoBusy}>{photoBusy ? "Uploading…" : avatar ? "Replace photo" : "Upload photo"}</Button>
                  {avatar ? <Button onClick={removePhoto} disabled={photoBusy}>Remove</Button> : null}
                </div>
                <div style={{ fontSize: 12, color: color.ink.soft, marginTop: 7 }}>PNG, JPG or WebP · max 2 MB · square works best.</div>
              </div>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Personal details" />
          <PanelBody>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div><label style={lab}>Full name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inS} /></div>
              <div><label style={lab}>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 50 xxx xxxx" style={inS} /></div>
              <div><label style={lab}>Email</label><input value={me?.email || ""} disabled style={{ ...inS, background: color.surface.sunken, color: color.ink.soft }} /><div style={{ fontSize: 12, color: color.ink.soft, marginTop: 4 }}>Sign-in email — change it under Security.</div></div>
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <a href="/security" style={{ textDecoration: "none" }}><Button>Security &amp; password</Button></a>
                <a href="/settings/email" style={{ textDecoration: "none" }}><Button>Email settings</Button></a>
              </div>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}

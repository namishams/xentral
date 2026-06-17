# Xentral Color Palette 2026 — PROPOSED (not yet implemented)

Direction: modern SaaS — Attio · Monday.com · Linear · Mercury. Friendly, bright,
professional, pastel, low-contrast, enterprise-ready. Status: DESIGN IDEA. The live
tokens (`@xentral/config`) are NOT changed yet. When approved, this becomes the
`color` (light) palette; the night palette derives from it via `colorDark`.

## Neutral foundation
- bg.primary #FAFBFC · bg.secondary #F5F7FA · card #FFFFFF · border #E2E8F0
- text.primary #1E293B · text.secondary #64748B · text.muted #94A3B8

## Brand
- primary #4F7CFF · hover #3D6FF5 · light #EEF4FF   (softer than the current Fiori #0064d9)

## Semantic / domain accents (one accent per area)
- AI: #8B5CF6 / light #F5F3FF / border #DDD6FE   (AI is ALWAYS purple)
- Success #22C55E /#ECFDF3 · Warning #F59E0B /#FFF7E6 · Error #EF4444 /#FEF2F2
- CRM (always blue): Leads #60A5FA · Contacts #38BDF8 · Companies #4F7CFF · Deals #818CF8
- Finance (always green): Revenue #10B981 · Invoices #06B6D4 · Receivables #14B8A6 · VAT #0EA5E9
- Marketplace (always orange): #F97316 / #FFF7ED
- Industry clouds: Medical teal #14B8A6 · Recruitment purple #A855F7 · Real Estate gold #EAB308 · Logistics cyan #06B6D4
- Pipeline stages (pastel): Lead #BFDBFE · Qualified #93C5FD · Proposal #A5B4FC · Negotiation #C4B5FD · Won #86EFAC · Lost #FCA5A5

## Design rules
White cards only · no dark sidebar · no saturated colours · pastel backgrounds ·
max one primary colour per screen · AI=purple · Finance=green · CRM=blue ·
Marketplace=orange · industry clouds get their own accent · borders instead of
shadows · large whitespace · soft rounded corners 12–16px.

## Notes from the Design Agent (must hold when implemented)
- **AA contrast is non-negotiable.** Pastels are for backgrounds/accents/tiles only.
  Body text stays high-contrast: text.primary #1E293B on white ≈ 14:1 (great).
  text.muted #94A3B8 on white ≈ 2.6:1 — FAILS AA for body; use only for non-essential
  hints at large sizes, never for real content.
- **Token mapping.** Neutrals → surface/line/ink. Brand → brand.*. Domain accents →
  a new `domain` token group (crm/finance/ai/marketplace + industry clouds), so the
  lifecycle IA colours every area consistently and a screen shows max one primary.
- **Dark night theme.** Derive `colorDark` from this set (deep navy surfaces, same
  semantic keys); accents lighten ~1 step for AA on dark.
- **Update-safe.** Implementing = swap ONE token file via the ThemePort; every screen
  re-skins at once. White-label themes are adapters of this, never edits.

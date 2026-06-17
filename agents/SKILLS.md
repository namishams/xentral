# Agent Skills & Tools Matrix

Each agent is equipped with exactly the skills and tools its role needs — no more
(least privilege). "Skill" = a reusable capability (SKILL.md); "tool" = a direct
capability/connector. Project skills marked _(to author)_ are created with the
`skill-creator` skill during Phase 2 and live in `skills/`.

Everyone shares the project-context skill **leadhero-rules** (Xentral context, design
rules, deploy procedure) and must run **dev-quality-check** before declaring work done.

---

## Architect / Lead
- **Tools:** all (Read/Write/Edit, Bash/SSH, Grep, connectors, Task orchestration).
- **Skills:** `skill-creator` (authors the project skills below), `dev-quality-check`, `leadhero-rules`, `schedule` (recurring jobs/backups).
- **Owns:** review of everything; the kernel governance gate.

## Backend Agent
- **Tools:** Read/Write/Edit, Bash (prisma, build), SSH + pm2 deploy, Grep, the DB.
- **Skills:** `mcp-builder` (integrations/connectors), `dev-quality-check`, `pdf` + `xlsx` (Books documents/exports), `leadhero-rules`.
- **Project skills _(to author)_:** `xentral-deploy` (build→pm2 runbook), `prisma-migrate` (the `db execute` + generate flow, `db push` block), `money-path-smoke-test` (totals, payment idempotency, GL balance), `api-route-conventions` (auth→can→companyId→txn).

## Frontend Agent
- **Tools:** Read/Write/Edit, Bash (build), Grep.
- **Skills:** `dev-quality-check`, `web-artifacts-builder` (complex composed UI), `leadhero-rules`.
- **Project skills _(to author)_:** `ui-governance-check` (the locked-system checklist), `component-migrate` (move a component into `@xentral/ui`), `page-archetype` (apply Action vs Tool template).

## UX Agent
- **Tools:** Read/Write/Edit, Grep; screenshot/visual review.
- **Skills:** `dev-quality-check`, `leadhero-rules`.
- **Project skills _(to author)_:** `state-coverage` (loading/empty/error for every view), `a11y-audit` (focus rings, ARIA labels, contrast), `copy-style` (calm enterprise UAE tone, EN/AR).

## Export / Build Assistant
- **Tools:** Bash (pnpm, turbo, changesets), Read/Write/Edit, Grep, SSH.
- **Skills:** `dev-quality-check`, `leadhero-rules`.
- **Project skills _(to author)_:** `module-extract` (relocate + re-export shim + `contract.ts`), `boundary-check` (eslint-plugin-boundaries warn→error), `changeset-release` (independent per-package versioning), `turbo-gen-architecture` (instantiate a version from a profile).

---

## Authored so far
- skills/add-a-page (frontend) — scaffold + wire + verify a page.
- skills/verify-and-ship (export-assistant) — the safety-net + deploy procedure.

## How the project skills get created
During Phase 2 the Architect uses the **`skill-creator`** skill to author each
_(to author)_ skill as a `SKILL.md` under `skills/`, with a description that triggers
correctly and a competency check. Skills are then attached to the matching agent in its
dossier. This keeps capabilities versioned and reusable across architecture versions
(a new profile renders the same agent + skill set).

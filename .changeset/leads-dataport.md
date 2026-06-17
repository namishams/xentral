---
"@xentral/kernel": minor
"@xentral/module-crm": minor
"@xentral/data-pack": minor
---

Leads migration (Roadmap Phase 1): DataPort listLeads + RawLead; data-pack reads the leads
table (tenant-scoped, probability→score); module-crm loadLeads (port, seed fallback, stage
normalized); /leads is now a session-scoped server component. The CRM trias
(Contacts · Companies · Leads) is complete on the port pattern.

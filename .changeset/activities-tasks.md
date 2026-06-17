---
"@xentral/kernel": minor
"@xentral/module-crm": minor
"@xentral/data-pack": minor
---

Activities & Tasks migration (Roadmap Phase 1, Universal Timeline): DataPort gains
listActivities/listTasks + RawActivity/RawTask; data-pack reads the activities & tasks
tables (tenant-scoped, Date→ISO); module-crm loadActivities/loadTasks (port, seed fallback);
/activities and /tasks are now session-scoped server components.

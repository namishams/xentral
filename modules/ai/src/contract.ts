export type AgentRole = { id: string; label: string };
export function getAgentRoles(): AgentRole[] {
  return [
    { id: "architect", label: "Architect / Lead" },
    { id: "backend", label: "Backend" },
    { id: "frontend", label: "Frontend" },
    { id: "ux", label: "UX" },
    { id: "export-assistant", label: "Export / Build Assistant" },
  ];
}

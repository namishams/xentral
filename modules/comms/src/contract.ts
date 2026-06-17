export type ChannelKind = { id: string; label: string; archetype: "tool" };
export function getChannelKinds(): ChannelKind[] {
  return [
    { id: "whatsapp", label: "WhatsApp", archetype: "tool" },
    { id: "email", label: "Email campaigns", archetype: "tool" },
    { id: "chat", label: "Team chat", archetype: "tool" },
    { id: "calendar", label: "Calendar", archetype: "tool" },
  ];
}

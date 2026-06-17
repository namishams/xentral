export type PortalSection = { id: string; label: string };
export function getPortalSections(): PortalSection[] {
  return [
    { id: "overview", label: "Overview" },
    { id: "quotes", label: "Quotes" },
    { id: "invoices", label: "Invoices" },
    { id: "documents", label: "Documents" },
    { id: "support", label: "Support" },
    { id: "book", label: "Book" },
  ];
}

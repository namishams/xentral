export type ApiScope = { id: string; label: string };
export function getApiScopes(): ApiScope[] {
  return [{ id: "read", label: "Read" }, { id: "write", label: "Write" }, { id: "webhook", label: "Webhooks" }];
}

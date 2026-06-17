export type PermissionKey = string;
export type RoleGrants = Record<string, PermissionKey[]>;

/** Pure permission check: does the role grant the key ("*" = wildcard). */
export function can(grants: RoleGrants, role: string, key: PermissionKey): boolean {
  const keys = grants[role] ?? [];
  return keys.includes("*") || keys.includes(key);
}

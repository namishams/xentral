export type Mailbox = { address: string; name?: string };
/** Build an RFC 5322 From header. Always a per-tenant mailbox, never shared. */
export function formatFrom(box: Mailbox): string {
  return box.name ? `"${box.name}" <${box.address}>` : box.address;
}

/**
 * @xentral/plugin-compliance-uae
 * Region pack. Implements the tax / e-invoice / payroll contributions declared
 * in manifest.json against the kernel's compliance contract. The kernel and
 * shared modules stay region-neutral; swapping this plugin changes the region.
 */
import manifest from "../manifest.json";
export { manifest };
export const COMPLIANCE_PLUGIN = "@xentral/plugin-compliance-uae";
// Implementations migrate here from the live app (PINT-AE, CT 9%, WPS, VAT201).

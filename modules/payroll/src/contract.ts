export type PayrollRegime = { id: string; label: string };
export function getPayrollRegimes(): PayrollRegime[] {
  return [{ id: "wps", label: "WPS (.SIF)" }];
}

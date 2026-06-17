# Architecture Profile — schema

A profile is the single input that makes one architecture version differ from another.
`turbo gen architecture --profile <id>` reads it.

| Field | Meaning |
|---|---|
| `id`, `label` | profile identifier + human label |
| `product.{name,appDomain,marketingDomain,kbDomain}` | product identity |
| `region.{code,compliancePlugin,dataResidency}` | ISO region, the compliance plugin to attach, where data lives |
| `locale.{default,supported[],rtl}` | languages + right-to-left flag |
| `currency.{default,display}` | currency code + display mask |
| `tax.{vatRate,corporateTaxRate,eInvoiceStandard,taxAuthority,vatReturnForm,...}` | tax rules — consumed by the compliance plugin, never hardcoded in modules |
| `payroll.{standard,fileFormat}` | payroll regime (e.g. WPS/SIF) |
| `modules.enabled[]` | which module packages to scaffold |
| `payments.gateways[]` | enabled payment gateways |
| `theme.{tokensRef,language,brandPrimary}` | design-system theme |
| `agents.enabled[]` | which agent dossiers to render |
| `governance.{kernelChangeApproval,boundaryEnforcement}` | governance strictness |

**Rule:** region-specific behaviour lives in `region.compliancePlugin` (a plugin), never in the kernel or shared modules. To add a country, author a new profile + a new `@xentral/plugin-compliance-<code>`.

#!/usr/bin/env node
// Xentral page scaffolder. Usage: pnpm gen:page <slug> <Title...>
// Emits a locked-components list page at apps/web/app/<slug>/page.tsx.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const [slug, ...titleParts] = process.argv.slice(2);
if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error("Usage: pnpm gen:page <slug> <Title...>   (slug = lowercase, dashes)");
  process.exit(1);
}
const title = titleParts.join(" ") || slug.charAt(0).toUpperCase() + slug.slice(1);
const pascal = slug.replace(/(^|[-_])(\w)/g, (_m, _s, ch) => ch.toUpperCase());

const tpl = readFileSync(join(here, "page.template.txt"), "utf8");
const out = tpl.replaceAll("__PASCAL__", pascal).replaceAll("__TITLE__", title);

const dir = join(root, "apps", "web", "app", slug);
if (existsSync(join(dir, "page.tsx"))) {
  console.error("Refusing to overwrite existing page: apps/web/app/" + slug + "/page.tsx");
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "page.tsx"), out);

console.log("created apps/web/app/" + slug + "/page.tsx  (" + pascal + 'Page, title "' + title + '")');
console.log("next: 1) wire a module contract for rows  2) add Sidebar nav  3) pnpm build");

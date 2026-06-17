import boundaries from "eslint-plugin-boundaries";
import tsParser from "@typescript-eslint/parser";

/**
 * Module-boundary enforcement (proven: eslint-plugin-boundaries), flat config.
 * Kernel imports no module. Modules reach other modules only via contracts.
 * Plugins may use kernel/ui/config only. The wall agents (and the watchdog)
 * physically cannot climb — violations fail the build and the pre-commit guard.
 */
export default [
  {
    ignores: [
      "**/node_modules/**", "**/.next/**", "**/dist/**", "**/.turbo/**",
      "**/*.config.*", "**/*.json",
    ],
  },
  {
    files: ["packages/**/*.{ts,tsx}", "modules/**/*.{ts,tsx}", "plugins/**/*.{ts,tsx}", "apps/**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["packages/**/*", "modules/**/*", "plugins/**/*", "apps/**/*"],
      "boundaries/elements": [
        { type: "kernel", pattern: "packages/kernel/**" },
        { type: "ui", pattern: "packages/ui/**" },
        { type: "config", pattern: "packages/config/**" },
        { type: "module", pattern: "modules/*/**", capture: ["name"] },
        { type: "plugin", pattern: "plugins/*/**", capture: ["name"] },
        { type: "locale", pattern: "packages/locale-*/**" },
        { type: "update", pattern: "packages/update-*/**" },
        { type: "data", pattern: "packages/data-*/**" },
        { type: "app", pattern: "apps/*/**" },
      ],
      "import/resolver": { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      "boundaries/element-types": ["error", {
        default: "disallow",
        rules: [
          { from: "kernel", allow: ["kernel", "config"] },
          { from: "ui", allow: ["ui", "config"] },
          { from: "config", allow: ["config"] },
          { from: "module", allow: ["kernel", "ui", "config", "module"] },
          { from: "plugin", allow: ["kernel", "ui", "config", ["plugin", { name: "${from.name}" }]] },
          { from: "locale", allow: ["kernel", "config"] },
          { from: "update", allow: ["kernel", "config"] },
          { from: "data", allow: ["kernel", "config"] },
          { from: "app", allow: ["app", "kernel", "ui", "config", "module", "plugin", "locale", "update", "data"] },
        ],
      }],
    },
  },
];

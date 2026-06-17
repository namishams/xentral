/**
 * Module-boundary enforcement (proven: eslint-plugin-boundaries).
 * Kernel may not import modules. Modules may import another module ONLY
 * via its public contract. Pages import UI only from @xentral/ui.
 */
module.exports = {
  plugins: ["boundaries"],
  settings: {
    "boundaries/elements": [
      { type: "kernel",  pattern: "packages/kernel/*" },
      { type: "ui",      pattern: "packages/ui/*" },
      { type: "config",  pattern: "packages/config/*" },
      { type: "module",  pattern: "modules/*", capture: ["name"] },
      { type: "plugin",  pattern: "plugins/*", capture: ["name"] },
      { type: "app",     pattern: "apps/*" }
    ]
  },
  rules: {
    "boundaries/element-types": ["error", {
      default: "disallow",
      rules: [
        { from: "kernel",  allow: ["kernel", "config"] },
        { from: "ui",      allow: ["ui", "config"] },
        { from: "config",  allow: ["config"] },
        { from: "module",  allow: ["kernel", "ui", "config", "module"] },
        { from: "plugin",  allow: ["kernel", "ui", "config"] },
        { from: "app",     allow: ["kernel", "ui", "config", "module", "plugin"] }
      ]
    }]
  }
};

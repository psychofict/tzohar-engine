import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next. NOTE the `**/` prefixes: a bare
    // `.next/**` anchors at the repo root in flat config, so `studio/.next`
    // was being linted — 153 files of generated build output, ~9000 problems
    // burying the ~40 real ones. It only appears once someone has built Studio
    // locally (the directory is gitignored), which is why it went unnoticed.
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    // Client site checkouts live under clients/ (gitignored, each its own repo).
    // They are whole Next apps; linting them here reports another repo's problems.
    "clients/**",
    // Studio is a separate app with its own eslint config and its own lint run
    // (`cd studio && npm run lint`). Same argument as clients/.
    "studio/**",
    // Documentation tooling: the print kit's vendored helpers and generated figures.
    "docs/**",
  ]),
]);

export default eslintConfig;

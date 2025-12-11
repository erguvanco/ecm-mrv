import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Exclude mobile Expo app (has its own linting)
    "mobile/**",
  ]),
  {
    rules: {
      // Disable overly strict rule that flags common React patterns
      // (SSR hydration, async data loading with cleanup, localStorage restoration)
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;

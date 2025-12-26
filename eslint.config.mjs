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
  ]),
  // Globalne dostosowania reguł
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Złagodzenie reguł dla całego projektu (zachowując bezpieczeństwo)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Wyłączenie problematycznych reguł React hooks (świadome użycie)
      "react-hooks/set-state-in-effect": "off",
      // Wyłączenie fałszywych pozytywów (Date.now() w useRef, Math.random() w Server Component)
      "react-hooks/purity": "off",
    },
  },
  // Wyłączenie restrykcyjnych reguł dla plików testowych
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "e2e/**/*.ts"],
    rules: {
      // Mocki w testach często wymagają any
      "@typescript-eslint/no-explicit-any": "off",
      // Czasem zmienne są zdefiniowane ale używane w mockowaniu
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;

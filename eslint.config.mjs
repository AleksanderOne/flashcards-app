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
    // Generowane pliki (coverage, raporty)
    "coverage/**",
  ]),
  // Ścisłe reguły dla solidnego kodu produkcyjnego
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // BLOKOWANIE any - wymuszenie pełnego typowania
      "@typescript-eslint/no-explicit-any": "error",
      // BLOKOWANIE martwego kodu (zmienne i argumenty z _ są dozwolone)
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      // Pełne zależności w hookach
      "react-hooks/exhaustive-deps": "warn",
      // Wyłączenie fałszywych pozytywów React hooks:
      // - purity: Date.now() w useRef, Math.random() w Server Component są bezpieczne
      // - set-state-in-effect: niektóre synchroniczne setState są świadome i poprawne
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Tylko dla plików testowych - łagodniejsze reguły (mocki wymagają elastyczności)
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "e2e/**/*.ts"],
    rules: {
      // Mocki często wymagają any - akceptowalne tylko w testach
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;

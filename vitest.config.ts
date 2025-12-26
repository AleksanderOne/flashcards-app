import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    alias: {
      "@": resolve(__dirname, "./"),
    },
    exclude: [...configDefaults.exclude, "e2e/**", "tests/**"],

    coverage: {
      provider: "v8",
      enabled: false, // Włączane flagą --coverage
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",

      // Progi pokrycia - celujemy w 100% dla logiki biznesowej
      // TODO: Odkomentuj gdy pokrycie testami wzrośnie
      /*
            thresholds: {
              statements: 100,
              branches: 100,
              functions: 100,
              lines: 100,
              perFile: true,
            },
            */
      include: ["**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/tests/**",
        "**/e2e/**",
        "**/*.config.{ts,js,mjs}",
        "**/schemas/**",
        "**/types/**",
        "**/layout.tsx",
        "**/loading.tsx",
        "**/error.tsx",
        "**/not-found.tsx",
        "**/global-error.tsx",
        "**/app/**/page.tsx",
        "**/app/page.tsx",
        "**/actions/**", // Często trudne do testowania unitowo (server actions)
        "**/auth.ts",
        "**/auth.config.ts",
        "**/middleware.ts",
        "**/proxy.ts",
        "**/components/ui/**",
        "**/theme-provider.tsx",
        "**/mode-toggle.tsx",
        "**/api/**",
        "**/lib/db/**",
        "**/.next/**",
        "**/node_modules/**",
        "**/scripts/**",
      ],
      skipFull: false,
      clean: true,
    },
  },
});

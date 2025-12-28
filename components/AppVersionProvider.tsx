"use client";

import { AppVersionCheck } from "@/lib/use-app-version";

/**
 * Wrapper dla AppVersionCheck do użycia w Server Component layout
 */
export function AppVersionProvider() {
  return <AppVersionCheck />;
}

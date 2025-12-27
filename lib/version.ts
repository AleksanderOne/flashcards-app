/**
 * Wersja aplikacji pobierana z package.json
 *
 * Używaj tej stałej zamiast hardcodować wersję w komponentach.
 */

import packageJson from "../package.json";

export const APP_VERSION: string = packageJson.version;

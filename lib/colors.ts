/**
 * System kolorów dla aplikacji Flashcards
 * 
 * Ten plik zawiera mapowania klas Tailwind na zmienne CSS zdefiniowane w globals.css
 * Używaj tych stałych zamiast hardkodowanych kolorów jak "text-violet-500"
 */

/* ===========================================
   KOLORY SEMANTYCZNE
   =========================================== */

/**
 * Klasy dla stanów semantycznych (success, warning, error, info)
 */
export const semanticColors = {
  success: {
    text: 'text-success',
    bg: 'bg-success',
    bgMuted: 'bg-success-muted',
    foreground: 'text-success-foreground',
    border: 'border-success',
    ring: 'ring-success',
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning',
    bgMuted: 'bg-warning-muted',
    foreground: 'text-warning-foreground',
    border: 'border-warning',
    ring: 'ring-warning',
  },
  error: {
    text: 'text-error',
    bg: 'bg-error',
    bgMuted: 'bg-error-muted',
    foreground: 'text-error-foreground',
    border: 'border-error',
    ring: 'ring-error',
  },
  info: {
    text: 'text-info',
    bg: 'bg-info',
    bgMuted: 'bg-info-muted',
    foreground: 'text-info-foreground',
    border: 'border-info',
    ring: 'ring-info',
  },
} as const;

/* ===========================================
   KOLORY AKCENTOWE
   =========================================== */

/**
 * Kolory akcentowe dla ikon, badge'ów i elementów dekoracyjnych
 * Używane np. w sidebar do kolorowania ikon nawigacji
 */
export const accentColors = {
  violet: {
    text: 'text-accent-violet',
    bg: 'bg-accent-violet',
    bgMuted: 'bg-accent-violet-muted',
    foreground: 'text-accent-violet-foreground',
    border: 'border-accent-violet',
  },
  fuchsia: {
    text: 'text-accent-fuchsia',
    bg: 'bg-accent-fuchsia',
    bgMuted: 'bg-accent-fuchsia-muted',
    foreground: 'text-accent-fuchsia-foreground',
    border: 'border-accent-fuchsia',
  },
  pink: {
    text: 'text-accent-pink',
    bg: 'bg-accent-pink',
    bgMuted: 'bg-accent-pink-muted',
    foreground: 'text-accent-pink-foreground',
    border: 'border-accent-pink',
  },
  amber: {
    text: 'text-accent-amber',
    bg: 'bg-accent-amber',
    bgMuted: 'bg-accent-amber-muted',
    foreground: 'text-accent-amber-foreground',
    border: 'border-accent-amber',
  },
  orange: {
    text: 'text-accent-orange',
    bg: 'bg-accent-orange',
    bgMuted: 'bg-accent-orange-muted',
    foreground: 'text-accent-orange-foreground',
    border: 'border-accent-orange',
  },
  sky: {
    text: 'text-accent-sky',
    bg: 'bg-accent-sky',
    bgMuted: 'bg-accent-sky-muted',
    foreground: 'text-accent-sky-foreground',
    border: 'border-accent-sky',
  },
  emerald: {
    text: 'text-accent-emerald',
    bg: 'bg-accent-emerald',
    bgMuted: 'bg-accent-emerald-muted',
    foreground: 'text-accent-emerald-foreground',
    border: 'border-accent-emerald',
  },
  yellow: {
    text: 'text-accent-yellow',
    bg: 'bg-accent-yellow',
    bgMuted: 'bg-accent-yellow-muted',
    foreground: 'text-accent-yellow-foreground',
    border: 'border-accent-yellow',
  },
  red: {
    text: 'text-accent-red',
    bg: 'bg-accent-red',
    bgMuted: 'bg-accent-red-muted',
    foreground: 'text-accent-red-foreground',
    border: 'border-accent-red',
  },
  slate: {
    text: 'text-accent-slate',
    bg: 'bg-accent-slate',
    bgMuted: 'bg-accent-slate-muted',
    foreground: 'text-accent-slate-foreground',
    border: 'border-accent-slate',
  },
} as const;

export type AccentColorKey = keyof typeof accentColors;

/* ===========================================
   POZIOMY CEFR
   =========================================== */

/**
 * Style dla poziomów językowych CEFR (A1-C1)
 */
export const levelColors = {
  A1: {
    text: 'text-level-a1',
    bg: 'bg-level-a1',
    bgMuted: 'bg-level-a1-muted',
    foreground: 'text-level-a1-foreground',
    border: 'border-level-a1-border',
    // Pełny zestaw klas dla badge'a
    badge: 'bg-level-a1-muted text-level-a1-foreground border-level-a1-border',
  },
  A2: {
    text: 'text-level-a2',
    bg: 'bg-level-a2',
    bgMuted: 'bg-level-a2-muted',
    foreground: 'text-level-a2-foreground',
    border: 'border-level-a2-border',
    badge: 'bg-level-a2-muted text-level-a2-foreground border-level-a2-border',
  },
  B1: {
    text: 'text-level-b1',
    bg: 'bg-level-b1',
    bgMuted: 'bg-level-b1-muted',
    foreground: 'text-level-b1-foreground',
    border: 'border-level-b1-border',
    badge: 'bg-level-b1-muted text-level-b1-foreground border-level-b1-border',
  },
  B2: {
    text: 'text-level-b2',
    bg: 'bg-level-b2',
    bgMuted: 'bg-level-b2-muted',
    foreground: 'text-level-b2-foreground',
    border: 'border-level-b2-border',
    badge: 'bg-level-b2-muted text-level-b2-foreground border-level-b2-border',
  },
  C1: {
    text: 'text-level-c1',
    bg: 'bg-level-c1',
    bgMuted: 'bg-level-c1-muted',
    foreground: 'text-level-c1-foreground',
    border: 'border-level-c1-border',
    badge: 'bg-level-c1-muted text-level-c1-foreground border-level-c1-border',
  },
} as const;

export type LevelKey = keyof typeof levelColors;

/**
 * Helper do pobierania klas dla danego poziomu CEFR
 */
export function getLevelClasses(level: string) {
  const normalizedLevel = level.toUpperCase() as LevelKey;
  return levelColors[normalizedLevel] ?? levelColors.A1;
}

/* ===========================================
   STYLE SIDEBARA
   =========================================== */

/**
 * Klasy dla elementów sidebara
 */
export const sidebarStyles = {
  container: 'bg-sidebar text-sidebar-foreground border-sidebar-border',
  item: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  itemActive: 'bg-sidebar-accent text-sidebar-accent-foreground',
  itemMuted: 'text-sidebar-muted-foreground',
} as const;

/* ===========================================
   STYLE FEEDBACKU
   =========================================== */

/**
 * Style dla feedbacku w sesji nauki (poprawna/niepoprawna odpowiedź)
 */
export const feedbackStyles = {
  correct: {
    card: 'border-success bg-success-muted shadow-success/20 shadow-lg',
    text: 'text-success-foreground',
    badge: 'bg-success-muted text-success-foreground',
  },
  incorrect: {
    card: 'border-error bg-error-muted shadow-error/20 shadow-lg',
    text: 'text-error-foreground',
    badge: 'bg-error-muted text-error-foreground',
  },
  neutral: {
    card: 'border-border bg-card',
    text: 'text-foreground',
    badge: 'bg-muted text-muted-foreground',
  },
} as const;

/* ===========================================
   STYLE ALERTÓW
   =========================================== */

/**
 * Style dla różnych typów alertów/kart informacyjnych
 */
export const alertStyles = {
  info: {
    container: 'border-info bg-info-muted',
    icon: 'text-info',
    title: 'text-info-foreground',
    description: 'text-info-foreground/80',
  },
  success: {
    container: 'border-success bg-success-muted',
    icon: 'text-success',
    title: 'text-success-foreground',
    description: 'text-success-foreground/80',
  },
  warning: {
    container: 'border-warning bg-warning-muted',
    icon: 'text-warning',
    title: 'text-warning-foreground',
    description: 'text-warning-foreground/80',
  },
  error: {
    container: 'border-error bg-error-muted',
    icon: 'text-error',
    title: 'text-error-foreground',
    description: 'text-error-foreground/80',
  },
} as const;

/* ===========================================
   STYLE DLA IKON NAWIGACJI
   =========================================== */

/**
 * Mapowanie kolorów dla ikon w nawigacji sidebar
 */
export const navIconColors = {
  learn: accentColors.violet.text,
  challenge: accentColors.amber.text,
  allWords: accentColors.pink.text,
  myWords: accentColors.sky.text,
  statistics: accentColors.emerald.text,
  print: accentColors.orange.text,
  settings: accentColors.slate.text,
  achievements: accentColors.yellow.text,
  admin: accentColors.red.text,
} as const;


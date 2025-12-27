/**
 * Schematy walidacji Zod dla nauki
 *
 * Centralna definicja schematów używanych w Server Actions nauki.
 * Zapewnia bezpieczną walidację danych wejściowych.
 */

import { z } from "zod";
import { LEVELS } from "@/lib/constants";

// Tryby nauki jako stała
const LEARNING_MODES = [
  "pl_to_en_text",
  "en_to_pl_text",
  "pl_to_en_quiz",
  "en_to_pl_quiz",
] as const;

// Schema dla parametrów submitAnswer
export const submitAnswerSchema = z.object({
  wordEnglish: z
    .string()
    .min(1, "Słówko angielskie jest wymagane")
    .max(200, "Słówko angielskie może mieć maksymalnie 200 znaków")
    .trim(),
  wordPolish: z
    .string()
    .min(1, "Tłumaczenie polskie jest wymagane")
    .max(200, "Tłumaczenie może mieć maksymalnie 200 znaków")
    .trim(),
  isCorrect: z.boolean(),
  mode: z.enum(LEARNING_MODES, {
    message: "Nieprawidłowy tryb nauki",
  }),
  level: z.enum(LEVELS, {
    message: "Nieprawidłowy poziom trudności",
  }),
  category: z
    .string()
    .min(1, "Kategoria jest wymagana")
    .max(50, "Kategoria może mieć maksymalnie 50 znaków")
    .trim(),
  timeSpentMs: z
    .number()
    .int("Czas musi być liczbą całkowitą")
    .min(0, "Czas nie może być ujemny")
    .max(600_000, "Czas nie może przekraczać 10 minut"), // max 10 min na odpowiedź
});

// Typ wynikowy ze schematu
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

// Eksport trybów nauki dla reużycia
export { LEARNING_MODES };

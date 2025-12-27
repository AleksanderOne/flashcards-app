/**
 * Testy dla akcji nauki (learning.ts)
 *
 * Testuje:
 * - Zapisywanie odpowiedzi użytkownika
 * - Integracja z algorytmem SM-2
 * - Aktualizacja statystyk
 * - Sprawdzanie osiągnięć
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mockowanie zależności PRZED importem modułu
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/drizzle", () => {
  return {
    db: {
      query: {
        wordProgress: {
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    },
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/spaced-repetition", () => ({
  calculateSM2: vi.fn().mockReturnValue({
    repetitions: 1,
    easiness: 2.5,
    interval: 1,
  }),
  getQualityFromBoolean: vi.fn().mockReturnValue(4),
}));

// Dynamiczny import w module - mockujemy @/lib/achievements
vi.mock("@/lib/achievements", () => ({
  checkAndUnlockAchievements: vi.fn().mockResolvedValue([]),
}));

import { submitAnswer } from "./learning";
import { type SubmitAnswerInput } from "@/lib/validations/learning";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { calculateSM2, getQualityFromBoolean } from "@/lib/spaced-repetition";
import { checkAndUnlockAchievements } from "@/lib/achievements";

describe("Learning Actions", () => {
  const validParams: SubmitAnswerInput = {
    wordEnglish: "apple",
    wordPolish: "jabłko",
    isCorrect: true,
    mode: "pl_to_en_text",
    level: "A1",
    category: "Food",
    timeSpentMs: 3000,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Wycisz console.error/warn żeby nie zaśmiecać output testów
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // Reset mocków do domyślnych wartości
    (db.query.wordProgress.findFirst as any).mockResolvedValue(null);
    (checkAndUnlockAchievements as any).mockResolvedValue([]);
  });

  describe("submitAnswer", () => {
    it("powinien zwrócić błąd gdy brak sesji", async () => {
      (auth as any).mockResolvedValue(null);

      const result = await submitAnswer(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("powinien zwrócić błąd gdy brak user.id w sesji", async () => {
      (auth as any).mockResolvedValue({ user: {} });

      const result = await submitAnswer(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("powinien użyć algorytmu SM-2 do obliczenia następnego przeglądu", async () => {
      (auth as any).mockResolvedValue({
        user: { id: "user-123" },
      });

      await submitAnswer(validParams);

      expect(getQualityFromBoolean).toHaveBeenCalledWith(true, 3000);
      expect(calculateSM2).toHaveBeenCalled();
    });

    it("powinien utworzyć nowy postęp dla nowego słówka", async () => {
      (auth as any).mockResolvedValue({
        user: { id: "user-123" },
      });
      (db.query.wordProgress.findFirst as any).mockResolvedValue(null);

      const result = await submitAnswer(validParams);

      expect(result.success).toBe(true);
      expect(db.insert).toHaveBeenCalled();
    });

    it("powinien zaktualizować istniejący postęp", async () => {
      (auth as any).mockResolvedValue({
        user: { id: "user-123" },
      });
      (db.query.wordProgress.findFirst as any).mockResolvedValue({
        id: "progress-123",
        repetitions: 2,
        easinessFactor: 2.5,
        interval: 6,
      });

      const result = await submitAnswer(validParams);

      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it("powinien sprawdzić osiągnięcia po zapisaniu odpowiedzi", async () => {
      (auth as any).mockResolvedValue({
        user: { id: "user-123" },
      });

      await submitAnswer(validParams);

      expect(checkAndUnlockAchievements).toHaveBeenCalledWith("user-123");
    });

    it("powinien zwrócić nowe osiągnięcia jeśli zostały odblokowane", async () => {
      (auth as any).mockResolvedValue({
        user: { id: "user-123" },
      });
      (checkAndUnlockAchievements as any).mockResolvedValue(["first_10_words"]);

      const result = await submitAnswer(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newAchievements).toEqual(["first_10_words"]);
      }
    });

    it("powinien zwrócić datę następnego przeglądu", async () => {
      (auth as any).mockResolvedValue({
        user: { id: "user-123" },
      });

      const result = await submitAnswer(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.nextReviewDate).toBeInstanceOf(Date);
      }
    });

    it("powinien obsłużyć błędną odpowiedź", async () => {
      (auth as any).mockResolvedValue({
        user: { id: "user-123" },
      });

      const incorrectParams: SubmitAnswerInput = {
        ...validParams,
        isCorrect: false,
      };

      const result = await submitAnswer(incorrectParams);

      expect(result.success).toBe(true);
      expect(getQualityFromBoolean).toHaveBeenCalledWith(false, 3000);
    });

    it("powinien zwrócić błąd przy wyjątku bazodanowym", async () => {
      (auth as any).mockResolvedValue({
        user: { id: "user-123" },
      });
      (db.query.wordProgress.findFirst as any).mockRejectedValue(
        new Error("Database error"),
      );

      const result = await submitAnswer(validParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to save progress");
      }
    });
  });
});

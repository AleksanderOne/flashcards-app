/**
 * Testy dla modułu osiągnięć (achievements)
 *
 * Testuje:
 * - Definicje osiągnięć i stałe
 * - Funkcje pomocnicze (calculateTotalPoints, getNextAchievement)
 * - Logikę sprawdzania i odblokowywania osiągnięć (checkAndUnlockAchievements)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ACHIEVEMENTS_LIST,
  ACHIEVEMENT_CATEGORIES,
  RARITY_COLORS,
  RARITY_LABELS,
  calculateTotalPoints,
  getNextAchievement,
  checkAndUnlockAchievements,
} from "./achievements";

// Mockowanie zależności bazodanowych
vi.mock("@/lib/db/drizzle", () => ({
  db: {
    query: {
      userStats: { findFirst: vi.fn() },
      achievements: { findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
  },
}));

import { db } from "@/lib/db/drizzle";

describe("Achievements (System Osiągnięć)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ACHIEVEMENTS_LIST", () => {
    it("powinien zawierać przynajmniej jedno osiągnięcie", () => {
      expect(ACHIEVEMENTS_LIST.length).toBeGreaterThan(0);
    });

    it("każde osiągnięcie powinno mieć wymagane pola", () => {
      ACHIEVEMENTS_LIST.forEach((achievement) => {
        expect(achievement).toHaveProperty("id");
        expect(achievement).toHaveProperty("title");
        expect(achievement).toHaveProperty("description");
        expect(achievement).toHaveProperty("icon");
        expect(achievement).toHaveProperty("threshold");
        expect(achievement).toHaveProperty("type");
        expect(achievement).toHaveProperty("rarity");
        expect(achievement).toHaveProperty("category");
        expect(achievement).toHaveProperty("points");
      });
    });

    it("każde osiągnięcie powinno mieć unikalne ID", () => {
      const ids = ACHIEVEMENTS_LIST.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("każde osiągnięcie powinno mieć prawidłowy typ", () => {
      const validTypes = [
        "words_learned",
        "streak",
        "sessions",
        "accuracy",
        "special",
      ];
      ACHIEVEMENTS_LIST.forEach((achievement) => {
        expect(validTypes).toContain(achievement.type);
      });
    });

    it("każde osiągnięcie powinno mieć prawidłową rzadkość", () => {
      const validRarities = ["common", "uncommon", "rare", "epic", "legendary"];
      ACHIEVEMENTS_LIST.forEach((achievement) => {
        expect(validRarities).toContain(achievement.rarity);
      });
    });
  });

  describe("calculateTotalPoints", () => {
    it("powinien zwrócić 0 dla pustej listy", () => {
      const result = calculateTotalPoints([]);
      expect(result).toBe(0);
    });

    it("powinien poprawnie sumować punkty za odblokowane osiągnięcia", () => {
      const unlockedIds = ACHIEVEMENTS_LIST.slice(0, 2).map((a) => a.id);
      const expectedPoints = ACHIEVEMENTS_LIST.slice(0, 2).reduce(
        (sum, a) => sum + a.points,
        0,
      );

      const result = calculateTotalPoints(unlockedIds);

      expect(result).toBe(expectedPoints);
    });
  });

  describe("getNextAchievement", () => {
    it("powinien zwrócić pierwsze osiągnięcie gdy currentValue = 0", () => {
      const result = getNextAchievement("words_learned", 0);

      expect(result).not.toBeNull();
      expect(result?.type).toBe("words_learned");
    });

    it("powinien zwrócić następne osiągnięcie powyżej currentValue", () => {
      const result = getNextAchievement("words_learned", 15);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.threshold).toBeGreaterThan(15);
      }
    });

    it("powinien zwrócić null gdy wszystkie osiągnięcia typu są już odblokowane", () => {
      const result = getNextAchievement("words_learned", 999999);
      expect(result).toBeNull();
    });
  });

  describe("checkAndUnlockAchievements", () => {
    const userId = "user-123";

    it("nie powinien nic robić gdy brak statystyk użytkownika", async () => {
      (db.query.userStats.findFirst as any).mockResolvedValue(null);

      const result = await checkAndUnlockAchievements(userId);

      expect(result).toBeUndefined();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('powinien odblokować osiągnięcie "first_10_words" gdy nauczono 10 słówek', async () => {
      (db.query.userStats.findFirst as any).mockResolvedValue({
        totalWordsLearned: 10,
        currentStreak: 0,
        totalSessions: 0,
      });
      // Użytkownik nie ma jeszcze żadnych osiągnięć
      (db.query.achievements.findMany as any).mockResolvedValue([]);

      const result = await checkAndUnlockAchievements(userId);

      expect(db.insert).toHaveBeenCalled();
      expect(result).toContain("Pierwsze Kroki"); // Tytuł dla first_10_words
    });

    it("nie powinien odblokować osiągnięcia jeśli już je posiada", async () => {
      (db.query.userStats.findFirst as any).mockResolvedValue({
        totalWordsLearned: 15,
        currentStreak: 0,
        totalSessions: 0,
      });
      // Użytkownik ma już to osiągnięcie
      (db.query.achievements.findMany as any).mockResolvedValue([
        { type: "first_10_words" }, // Uwaga: w kodzie sprawdzane jest achievement.id vs row.type
      ]);

      const result = await checkAndUnlockAchievements(userId);

      expect(db.insert).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("powinien odblokować osiągnięcie za streak", async () => {
      (db.query.userStats.findFirst as any).mockResolvedValue({
        totalWordsLearned: 0,
        currentStreak: 3, // Wymagane 3 dni
        totalSessions: 0,
      });
      (db.query.achievements.findMany as any).mockResolvedValue([]);

      const result = await checkAndUnlockAchievements(userId);

      expect(db.insert).toHaveBeenCalled();
      expect(result).toContain("Systematyczność"); // Tytuł dla streak_3_days
    });

    it("powinien odblokować wiele osiągnięć naraz", async () => {
      (db.query.userStats.findFirst as any).mockResolvedValue({
        totalWordsLearned: 10,
        currentStreak: 3,
        totalSessions: 1,
      });
      (db.query.achievements.findMany as any).mockResolvedValue([]);

      const result = await checkAndUnlockAchievements(userId);

      // Spodziewamy się: first_10_words, streak_3_days, first_session
      expect(db.insert).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });
  });
});

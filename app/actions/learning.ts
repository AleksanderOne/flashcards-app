"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { wordProgress, learningSessions, userStats } from "@/lib/db/schema";
import { calculateSM2, getQualityFromBoolean } from "@/lib/spaced-repetition";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  submitAnswerSchema,
  SubmitAnswerInput,
} from "@/lib/validations/learning";

export type LearningResult =
  | { success: true; nextReviewDate: Date; newAchievements?: string[] }
  | { success: false; error: string };

export async function submitAnswer(params: unknown): Promise<LearningResult> {
  // Walidacja inputu przez Zod
  const parsed = submitAnswerSchema.safeParse(params);
  if (!parsed.success) {
    console.warn(
      "[submitAnswer] Nieprawidłowe dane wejściowe:",
      parsed.error.flatten(),
    );
    return { success: false, error: "Nieprawidłowe dane wejściowe" };
  }

  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;
  const {
    wordEnglish,
    wordPolish,
    isCorrect,
    mode,
    level,
    category,
    timeSpentMs,
  }: SubmitAnswerInput = parsed.data;

  try {
    // 1. Pobranie aktualnego stanu nauki dla danego słówka
    const existingProgress = await db.query.wordProgress.findFirst({
      where: and(
        eq(wordProgress.userId, userId),
        eq(wordProgress.wordEnglish, wordEnglish),
      ),
    });

    // 2. Obliczenie nowych parametrów algorytmu SuperMemo-2
    const quality = getQualityFromBoolean(isCorrect, timeSpentMs);

    // Wartości domyślne dla nowych słówek
    let repetitions = 0;
    let easinessFactor = 2.5;
    let interval = 0;

    if (existingProgress) {
      repetitions = existingProgress.repetitions;
      easinessFactor = existingProgress.easinessFactor;
      interval = existingProgress.interval;
    }

    const sm2Result = calculateSM2({
      quality,
      repetitions,
      easiness: easinessFactor,
      interval,
    });

    // Obliczenie daty następnej powtórki
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + sm2Result.interval);

    // 3. Zapis lub aktualizacja postępu w bazie danych
    if (existingProgress) {
      await db
        .update(wordProgress)
        .set({
          repetitions: sm2Result.repetitions,
          easinessFactor: sm2Result.easiness,
          interval: sm2Result.interval,
          nextReviewDate,
          lastReviewed: new Date(),
          difficultyRating: 5 - quality, // uproszczone przybliżenie
          updatedAt: new Date(),
        })
        .where(eq(wordProgress.id, existingProgress.id));
    } else {
      await db.insert(wordProgress).values({
        userId,
        wordEnglish,
        repetitions: sm2Result.repetitions,
        easinessFactor: sm2Result.easiness,
        interval: sm2Result.interval,
        nextReviewDate,
        lastReviewed: new Date(),
        difficultyRating: 5 - quality,
      });
    }

    // 4. Zapisanie historii sesji nauki
    await db.insert(learningSessions).values({
      userId,
      wordEnglish,
      wordPolish,
      isCorrect,
      learningMode: mode,
      level: level, // Bez rzutowania, level jest już LevelType
      category,
      timeSpentMs,
    });

    // 5. Aktualizacja statystyk użytkownika
    // Aktualizacja lub wstawienie (upsert) statystyk
    await db
      .insert(userStats)
      .values({
        userId,
        totalWordsLearned: isCorrect ? 1 : 0,
        totalTimeMs: timeSpentMs,
        lastActiveDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: {
          totalWordsLearned: sql`${userStats.totalWordsLearned} + ${isCorrect ? 1 : 0}`,
          totalTimeMs: sql`${userStats.totalTimeMs} + ${timeSpentMs}`,
          lastActiveDate: new Date().toISOString().split("T")[0],
        },
      });

    // 6. Sprawdzenie i odblokowanie osiągnięć
    // Dynamiczny import w celu uniknięcia cyklicznych zależności
    const { checkAndUnlockAchievements } = await import("@/lib/achievements");
    const newAchievements = await checkAndUnlockAchievements(userId);

    revalidatePath("/learn");
    revalidatePath("/statistics");
    revalidatePath("/achievements");

    return { success: true, nextReviewDate, newAchievements };
  } catch (error) {
    console.error("Błąd podczas zapisywania odpowiedzi:", error);
    return { success: false, error: "Failed to save progress" };
  }
}

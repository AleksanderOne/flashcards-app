import { pgTable, text, timestamp, uuid, varchar, integer, boolean, real, date, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';

// Enums
export const levelEnum = pgEnum('level', ['A1', 'A2', 'B1', 'B2', 'C1']);
export const learningModeEnum = pgEnum('learning_mode', [
    'pl_to_en_text',
    'en_to_pl_text',
    'pl_to_en_quiz',
    'en_to_pl_quiz'
]);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// Users - NextAuth tabele
export const users = pgTable('users', {
    id: varchar('id', { length: 255 }).primaryKey(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('email_verified'),
    image: text('image'),
    password: text('password'), // dla email/password auth
    role: userRoleEnum('role').default('user').notNull(),
    isBlocked: boolean('is_blocked').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
});

export const sessions = pgTable('sessions', {
    id: varchar('id', { length: 255 }).primaryKey(),
    sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expires: timestamp('expires').notNull(),
});

// Słówka systemowe (baza aplikacji) i słówka dodane przez użytkowników po zatwierdzeniu
export const words = pgTable('words', {
    id: uuid('id').defaultRandom().primaryKey(),
    english: text('english').notNull(),
    polish: text('polish').notNull(),
    level: levelEnum('level').notNull(),
    category: text('category').notNull(),
    imageUrl: text('image_url'),
    createdBy: varchar('created_by', { length: 255 }).references(() => users.id, { onDelete: 'set null' }), // null = system, userId = user-created
    isApproved: boolean('is_approved').default(true).notNull(), // domyślnie true dla słówek systemowych
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    // Indeksy dla często używanych kolumn w wyszukiwaniu i filtrowaniu
    levelIdx: index('words_level_idx').on(table.level),
    categoryIdx: index('words_category_idx').on(table.category),
    approvedIdx: index('words_approved_idx').on(table.isApproved),
    englishIdx: index('words_english_idx').on(table.english),
}));

// Własne słówka użytkownika (prywatna kolekcja)
export const customWords = pgTable('custom_words', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    english: text('english').notNull(),
    polish: text('polish').notNull(),
    level: levelEnum('level').notNull(),
    category: text('category').notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Statystyki nauki - każda odpowiedź
export const learningSessions = pgTable('learning_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    wordEnglish: text('word_english').notNull(),
    wordPolish: text('word_polish').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    learningMode: learningModeEnum('learning_mode').notNull(),
    level: levelEnum('level').notNull(),
    category: text('category').notNull(),
    timeSpentMs: integer('time_spent_ms').notNull(), // czas na odpowiedź w ms
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Spaced repetition tracking
export const wordProgress = pgTable('word_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    wordEnglish: text('word_english').notNull(),
    repetitions: integer('repetitions').default(0).notNull(), // ile razy powtórzone
    easinessFactor: real('easiness_factor').default(2.5).notNull(), // SM-2 algorithm
    interval: integer('interval').default(0).notNull(), // dni do następnej powtórki
    nextReviewDate: timestamp('next_review_date'),
    lastReviewed: timestamp('last_reviewed'),
    difficultyRating: integer('difficulty_rating'), // 1-5 (1=bardzo łatwe, 5=bardzo trudne)
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Osiągnięcia
export const achievements = pgTable('achievements', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // "category_completed", "100_words", "7_day_streak", etc.
    level: text('level'),
    category: text('category'),
    metadata: jsonb('metadata'), // dodatkowe dane (score, czas, etc.)
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Daily streak tracking
export const userStats = pgTable('user_stats', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
    currentStreak: integer('current_streak').default(0).notNull(),
    longestStreak: integer('longest_streak').default(0).notNull(),
    totalWordsLearned: integer('total_words_learned').default(0).notNull(),
    totalTimeMs: integer('total_time_ms').default(0).notNull(), // całkowity czas nauki w ms
    lastActiveDate: date('last_active_date'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

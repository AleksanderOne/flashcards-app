"use server";

import { db } from "@/lib/db/drizzle";
import { appSettings, contactMessages } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Typy
export type AppSettings = {
  id: string;
  contactEmail: string;
  emailNotificationsEnabled: boolean;
  updatedAt: Date;
};

export type ContactMessage = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  emailSent: boolean;
  createdAt: Date;
};

// Schemat walidacji ustawień
const settingsSchema = z.object({
  contactEmail: z.string().email("Podaj prawidłowy adres email"),
  emailNotificationsEnabled: z.boolean(),
});

// Pobierz ustawienia aplikacji
export async function getAppSettings(): Promise<AppSettings> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Brak uprawnień");
  }

  const result = await db.select().from(appSettings).limit(1);

  if (result.length === 0) {
    // Utwórz domyślne ustawienia jeśli nie istnieją
    const newSettings = await db
      .insert(appSettings)
      .values({
        contactEmail: "kontakt@flashcards.pl",
        emailNotificationsEnabled: true,
      })
      .returning();

    return {
      id: newSettings[0].id,
      contactEmail: newSettings[0].contactEmail,
      emailNotificationsEnabled: newSettings[0].emailNotificationsEnabled,
      updatedAt: newSettings[0].updatedAt,
    };
  }

  return {
    id: result[0].id,
    contactEmail: result[0].contactEmail,
    emailNotificationsEnabled: result[0].emailNotificationsEnabled,
    updatedAt: result[0].updatedAt,
  };
}

// Pobierz ustawienia aplikacji (publiczne - do użycia w contact-actions)
export async function getPublicAppSettings(): Promise<{
  contactEmail: string;
  emailNotificationsEnabled: boolean;
} | null> {
  try {
    const result = await db
      .select({
        contactEmail: appSettings.contactEmail,
        emailNotificationsEnabled: appSettings.emailNotificationsEnabled,
      })
      .from(appSettings)
      .limit(1);

    if (result.length === 0) {
      // Zwracamy wartości domyślne zamiast null, aby nie blokować builda jeśli baza jest pusta
      return {
        contactEmail: "kontakt@flashcards.pl",
        emailNotificationsEnabled: true,
      };
    }

    return result[0];
  } catch (error) {
    console.warn(
      "Nie udało się pobrać ustawień aplikacji (możliwy brak połączenia z bazą w trakcie builda). Używam domyślnych.",
      error,
    );
    // Fallback dla builda / awarii bazy
    return {
      contactEmail: "kontakt@flashcards.pl",
      emailNotificationsEnabled: true,
    };
  }
}

// Zaktualizuj ustawienia
export async function updateAppSettings(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Brak uprawnień" };
  }

  const rawData = {
    contactEmail: formData.get("contactEmail") as string,
    emailNotificationsEnabled:
      formData.get("emailNotificationsEnabled") === "true",
  };

  const validated = settingsSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const existing = await db.select().from(appSettings).limit(1);

    if (existing.length === 0) {
      await db.insert(appSettings).values({
        contactEmail: validated.data.contactEmail,
        emailNotificationsEnabled: validated.data.emailNotificationsEnabled,
        updatedBy: session.user.id,
      });
    } else {
      await db
        .update(appSettings)
        .set({
          contactEmail: validated.data.contactEmail,
          emailNotificationsEnabled: validated.data.emailNotificationsEnabled,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        })
        .where(eq(appSettings.id, existing[0].id));
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Błąd podczas zapisywania ustawień" };
  }
}

// Pobierz wiadomości kontaktowe
export async function getContactMessages(): Promise<ContactMessage[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Brak uprawnień");
  }

  const result = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(50);

  return result;
}

// Oznacz wiadomość jako przeczytaną
export async function markMessageAsRead(
  messageId: string,
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false };
  }

  try {
    await db
      .update(contactMessages)
      .set({ isRead: true })
      .where(eq(contactMessages.id, messageId));

    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false };
  }
}

// Usuń wiadomość
export async function deleteContactMessage(
  messageId: string,
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false };
  }

  try {
    await db.delete(contactMessages).where(eq(contactMessages.id, messageId));

    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false };
  }
}

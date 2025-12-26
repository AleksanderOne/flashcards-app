'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { contactMessages, appSettings } from '@/lib/db/schema';
import { Resend } from 'resend';

// Inicjalizacja Resend (tylko jeśli klucz API jest dostępny)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Schemat walidacji formularza kontaktowego
const contactFormSchema = z.object({
    firstName: z
        .string()
        .min(2, 'Imię musi mieć minimum 2 znaki')
        .max(50, 'Imię może mieć maksymalnie 50 znaków'),
    lastName: z
        .string()
        .min(2, 'Nazwisko musi mieć minimum 2 znaki')
        .max(50, 'Nazwisko może mieć maksymalnie 50 znaków'),
    email: z
        .string()
        .email('Podaj prawidłowy adres email'),
    phone: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^[\d\s+()-]{9,15}$/.test(val),
            'Podaj prawidłowy numer telefonu'
        ),
    message: z
        .string()
        .min(10, 'Wiadomość musi mieć minimum 10 znaków')
        .max(2000, 'Wiadomość może mieć maksymalnie 2000 znaków'),
});

export type ContactFormState = {
    success?: boolean;
    message?: string;
    errors?: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        phone?: string[];
        message?: string[];
    };
};

// Pobierz ustawienia aplikacji
async function getSettings() {
    try {
        const result = await db.select({
            contactEmail: appSettings.contactEmail,
            emailNotificationsEnabled: appSettings.emailNotificationsEnabled,
        }).from(appSettings).limit(1);
        
        if (result.length === 0) {
            return {
                contactEmail: 'kontakt@flashcards.pl',
                emailNotificationsEnabled: true,
            };
        }
        return result[0];
    } catch {
        return {
            contactEmail: 'kontakt@flashcards.pl',
            emailNotificationsEnabled: true,
        };
    }
}

// Wyślij email przez Resend
async function sendEmail(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    message: string;
}, toEmail: string): Promise<boolean> {
    if (!resend) {
        console.log('⚠️ Resend nie jest skonfigurowany (brak RESEND_API_KEY)');
        return false;
    }

    try {
        const { error } = await resend.emails.send({
            from: 'Flashcards <onboarding@resend.dev>', // Zmień na swoją domenę po weryfikacji w Resend
            to: toEmail,
            subject: `Nowa wiadomość kontaktowa od ${data.firstName} ${data.lastName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Flashcards</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Nowa wiadomość kontaktowa</p>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
                        <h2 style="color: #1e293b; margin: 0 0 20px;">Dane kontaktowe</h2>
                        
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 120px;">Imię i nazwisko:</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;">${data.firstName} ${data.lastName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Email:</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                    <a href="mailto:${data.email}" style="color: #8b5cf6; text-decoration: none;">${data.email}</a>
                                </td>
                            </tr>
                            ${data.phone ? `
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Telefon:</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                    <a href="tel:${data.phone}" style="color: #8b5cf6; text-decoration: none;">${data.phone}</a>
                                </td>
                            </tr>
                            ` : ''}
                        </table>
                        
                        <h3 style="color: #1e293b; margin: 25px 0 15px;">Treść wiadomości:</h3>
                        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <p style="color: #334155; margin: 0; white-space: pre-wrap; line-height: 1.6;">${data.message}</p>
                        </div>
                    </div>
                    
                    <div style="background: #1e293b; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
                        <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                            Ta wiadomość została wysłana z formularza kontaktowego na stronie Flashcards
                        </p>
                    </div>
                </div>
            `,
            replyTo: data.email,
        });

        if (error) {
            console.error('❌ Błąd wysyłania emaila:', error);
            return false;
        }

        console.log('✅ Email wysłany pomyślnie do:', toEmail);
        return true;
    } catch (error) {
        console.error('❌ Błąd wysyłania emaila:', error);
        return false;
    }
}

export async function submitContactForm(
    _prevState: ContactFormState,
    formData: FormData
): Promise<ContactFormState> {
    const rawData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
    };

    // Walidacja danych
    const validatedFields = contactFormSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors as ContactFormState['errors'],
        };
    }

    const data = validatedFields.data;

    try {
        // Pobierz ustawienia
        const settings = await getSettings();
        
        let emailSent = false;

        // Wyślij email jeśli włączone
        if (settings.emailNotificationsEnabled) {
            emailSent = await sendEmail({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone || undefined,
                message: data.message,
            }, settings.contactEmail);
        }

        // Zapisz wiadomość do bazy danych
        await db.insert(contactMessages).values({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || null,
            message: data.message,
            emailSent,
        });

        console.log('📧 Nowa wiadomość kontaktowa zapisana:', {
            from: `${data.firstName} ${data.lastName}`,
            email: data.email,
            emailSent,
        });

        return {
            success: true,
            message: 'Dziękujemy za wiadomość! Odpowiemy najszybciej jak to możliwe.',
        };
    } catch (error) {
        console.error('❌ Błąd podczas przetwarzania formularza:', error);
        
        return {
            success: false,
            message: 'Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie później.',
        };
    }
}

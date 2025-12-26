import { PageLayout } from '@/components/page-layout';
import { Settings } from 'lucide-react';
import { EmailSettingsCard } from './_components/email-settings-card';
import { ContactMessagesCard } from './_components/contact-messages-card';
import { getAppSettings, getContactMessages } from './actions';
import { AdminNav } from '../_components/admin-nav';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
    const [settings, messages] = await Promise.all([
        getAppSettings(),
        getContactMessages(),
    ]);

    return (
        <PageLayout
            title="Panel Administratora"
            description="Zarządzaj ustawieniami aplikacji i formularzem kontaktowym"
            actions={<AdminNav />}
        >
            <div className="grid gap-6 lg:grid-cols-2">
                <EmailSettingsCard settings={settings} />
                <ContactMessagesCard messages={messages} />
            </div>
        </PageLayout>
    );
}


import { Metadata } from "next";
import { SSOSetupForm } from "./_components/sso-setup-form";
import { SSOStatusCard } from "./_components/sso-status-card";

export const metadata: Metadata = {
  title: "Konfiguracja SSO | Admin",
  description: "Konfiguracja połączenia z Centrum Logowania",
};

export default function SSOSetupPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Konfiguracja SSO</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-4">
          <SSOStatusCard />
        </div>
        <div className="col-span-3 lg:col-span-3">
          <SSOSetupForm />
        </div>
      </div>
    </div>
  );
}

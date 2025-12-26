import { PageLoader } from "@/components/ui/page-loader";

export default function SettingsLoading() {
    return (
        <div className="container mx-auto px-8">
            <PageLoader message="Ładuję ustawienia..." />
        </div>
    );
}

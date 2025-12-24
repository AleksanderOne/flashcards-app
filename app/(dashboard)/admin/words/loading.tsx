import { PageLoader } from "@/components/ui/page-loader";

export default function AdminWordsLoading() {
    return (
        <div className="container mx-auto px-8">
            <PageLoader message="Ładuję zarządzanie słówkami..." />
        </div>
    );
}

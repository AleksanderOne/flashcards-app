import { PageLoader } from "@/components/ui/page-loader";

export default function AchievementsLoading() {
    return (
        <div className="container mx-auto px-8">
            <PageLoader message="Ładuję osiągnięcia..." />
        </div>
    );
}

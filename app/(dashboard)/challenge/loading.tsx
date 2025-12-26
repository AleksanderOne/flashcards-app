import { PageLoader } from "@/components/ui/page-loader";

export default function ChallengeLoading() {
    return (
        <div className="container mx-auto px-8">
            <PageLoader message="Przygotowuję wyzwanie..." />
        </div>
    );
}

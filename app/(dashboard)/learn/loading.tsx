import { PageLoader } from "@/components/ui/page-loader";

export default function LearnLoading() {
    return (
        <div className="container mx-auto px-8">
            <PageLoader message="Przygotowuję materiały..." />
        </div>
    );
}

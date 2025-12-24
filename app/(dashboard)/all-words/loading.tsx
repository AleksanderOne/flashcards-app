import { PageLoader } from "@/components/ui/page-loader";

export default function AllWordsLoading() {
    return (
        <div className="container mx-auto px-8">
            <PageLoader message="Ładuję bazę słówek..." />
        </div>
    );
}

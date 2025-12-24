import { PageLoader } from "@/components/ui/page-loader";

export default function MyWordsLoading() {
    return (
        <div className="container mx-auto px-8">
            <PageLoader message="Ładuję postępy..." />
        </div>
    );
}

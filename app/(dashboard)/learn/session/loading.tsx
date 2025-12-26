import { PageLoader } from "@/components/ui/page-loader";

export default function SessionLoading() {
    return (
        <div className="container mx-auto px-8">
            <PageLoader message="Przygotowuję sesję nauki..." />
        </div>
    );
}

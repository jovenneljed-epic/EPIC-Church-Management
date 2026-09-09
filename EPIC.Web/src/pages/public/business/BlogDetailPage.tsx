import BlogPage from "../BlogPage";

interface BlogDetailPageProps {
    onBack?: () => void;
    onNavigate?: (page: string) => void;
}

export default function BlogDetailPage({ onNavigate }: BlogDetailPageProps) {
    return (
        <BlogPage
            onNavigate={onNavigate}
            initialSlug="5-ways-to-strengthen-your-family-faith"
        />
    );
}


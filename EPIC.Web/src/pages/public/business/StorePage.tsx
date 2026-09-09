import { useState } from "react";
import PublicHeader from "../../../components/PublicHeader";
import {
    ShoppingBag,
    FileText,
    Check,
    ArrowRight,
    Star,
    ShieldCheck,
    Sparkles,
    Search,
    Zap,
} from "lucide-react";
import "./StorePage.css";

interface StorePageProps {
    onNavigate?: (page: string) => void;
}

interface Product {
    id: string;
    title: string;
    category: "admin" | "media" | "financial" | "books" | "bundles";
    categoryLabel: string;
    price: number;
    badge?: string;
    rating: number;
    downloadsCount: number;
    fileFormat: string;
    description: string;
    highlights: string[];
}

const PRODUCTS: Product[] = [
    {
        id: "product-launch-bundle",
        title: "Complete Church Starter Launch Kit",
        category: "bundles",
        categoryLabel: "ALL-IN-ONE BUNDLE",
        price: 1999,
        badge: "BESTSELLER &bull; SAVE 35%",
        rating: 5.0,
        downloadsCount: 142,
        fileFormat: "ZIP Archive (DOCX, PPTX, XLSX, PDF)",
        description: "The ultimate digital ministry toolkit. Includes Church Administration Suite, Worship Media Pack, and Financial Ledgers all in one package.",
        highlights: [
            "Church Constitution & Bylaws Templates",
            "150+ Motion Video Loops & Slide Decks",
            "Automated Tithes & Offering Calculator",
            "Volunteer Safety & Child Protection Manuals",
            "90-Day Church Launch Implementation Blueprint",
        ],
    },
    {
        id: "product-financial-suite",
        title: "Church Financial Ledgers & Stewardship Suite",
        category: "financial",
        categoryLabel: "ACCOUNTING & STEWARDSHIP",
        price: 1299,
        badge: "EXCEL & SHEETS",
        rating: 4.9,
        downloadsCount: 88,
        fileFormat: "Excel (.XLSX) & Google Sheets",
        description: "Automated church accounting spreadsheets. Reconcile Sunday tithes, track departmental budgets, and generate donor annual statements automatically.",
        highlights: [
            "Automated Tithe & Offering Deposit Calculator",
            "GCash & Maya Giving Reconciliation Dashboard",
            "Departmental Budget vs. Actual Expenditure Tab",
            "Annual Donor Giving Certificate Generator",
            "Year-End Financial Audit & Statement Template",
        ],
    },
    {
        id: "product-media-pack",
        title: "Worship Media & Sermon Slide Pack",
        category: "media",
        categoryLabel: "MEDIA & GRAPHICS",
        price: 999,
        badge: "150+ HIGH-RES ASSETS",
        rating: 5.0,
        downloadsCount: 215,
        fileFormat: "1080p MP4, PowerPoint (.PPTX), Canva Links",
        description: "Elevate your Sunday service presentations with 150+ motion video backgrounds, service countdowns, offering slides, and sermon title templates.",
        highlights: [
            "150+ Loopable Motion Backgrounds in 1080p HD",
            "20 Complete Sermon Series Slide Decks",
            "5-Minute Pre-Service Countdown Videos",
            "Offering, Communion & Welcome Title Cards",
            "Editable in Canva & Microsoft PowerPoint",
        ],
    },
    {
        id: "product-admin-suite",
        title: "Church Administration & Policy Master Suite",
        category: "admin",
        categoryLabel: "GOVERNANCE & LEGAL",
        price: 799,
        badge: "PASTOR APPROVED",
        rating: 4.9,
        downloadsCount: 164,
        fileFormat: "Microsoft Word (.DOCX) & PDF",
        description: "Customizable church legal documents, pastoral employment agreements, usher guidelines, and child protection protocols ready for your board.",
        highlights: [
            "Official Church Constitution & Bylaws Template",
            "Pastoral Staff & Ministry Worker Agreements",
            "Child Protection & Volunteer Safety Policies",
            "Usher, Greeter & Security Protocols",
            "Ministry Team Performance Job Descriptions",
        ],
    },
    {
        id: "product-pastor-guide",
        title: "Pastoral Ministry & Leadership Guidebook",
        category: "books",
        categoryLabel: "PASTORAL EBOOK",
        price: 399,
        rating: 4.8,
        downloadsCount: 97,
        fileFormat: "PDF E-Book & Printable Study Guide",
        description: "Practical pastoral guidance on preaching preparation, hospital visitations, counseling protocols, and church board management.",
        highlights: [
            "Biblical Preaching & Expository Sermon Outlines",
            "Hospital & Bereavement Care Visit Protocols",
            "Church Governance & Elder Meeting Agendas",
            "Pastoral Self-Care & Burnout Prevention Guide",
        ],
    },
    {
        id: "product-discipleship-workbook",
        title: "Cell Group & Discipleship Leaders Workbook",
        category: "books",
        categoryLabel: "DISCIPLESHIP WORKBOOK",
        price: 449,
        rating: 4.9,
        downloadsCount: 120,
        fileFormat: "Printable PDF & Editable Word Doc",
        description: "A plug-and-play 12-week small group curriculum with facilitator discussion guides, weekly scripture studies, and icebreaker activities.",
        highlights: [
            "12-Week Structured Small Group Curriculum",
            "Leader Discussion Prompts & Reflection Notes",
            "Cell Group Multiplication Strategies",
            "Member Accountability & Prayer Journal Pages",
        ],
    },
];

export default function StorePage({ onNavigate }: StorePageProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProducts = PRODUCTS.filter((p) => {
        const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
        const matchesSearch =
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleBuyNow = (product: Product) => {
        localStorage.setItem("epicSelectedPlan", product.id);
        localStorage.setItem("epicSelectedPlanName", product.title);
        localStorage.setItem("epicBillingCycle", "one-time");
        localStorage.setItem("epicCheckoutAmount", String(product.price));
        localStorage.setItem("epicSelectedItemType", "product");
        localStorage.setItem("epicSelectedItemBadge", product.badge || "DIGITAL DOWNLOAD");
        onNavigate?.("checkout");
    };

    const formatCurrency = (val: number) => {
        return "₱" + val.toLocaleString("en-PH");
    };

    return (
        <div className="epic-store-page">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO */}
            <section className="store-hero">
                <div className="store-hero-inner">
                    <div className="store-eyebrow">
                        <Sparkles size={15} />
                        <span>EPIC DIGITAL STORE &bull; INSTANT MINISTRY TOOLKITS</span>
                    </div>

                    <h1>
                        Curated Digital Resources for <span>Pastors &amp; Church Teams</span>
                    </h1>

                    <p className="store-subtitle">
                        Instantly downloadable administration toolkits, worship media collections, automated bookkeeping spreadsheets, and leadership handbooks designed for Philippine churches.
                    </p>

                    {/* SEARCH BAR */}
                    <div className="store-search-bar">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search templates, media packs, spreadsheets, or books..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="store-search-input"
                        />
                        {searchQuery && (
                            <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
                                Clear
                            </button>
                        )}
                    </div>

                    {/* FILTER TABS */}
                    <div className="store-filter-tabs">
                        <button
                            type="button"
                            className={`filter-tab ${selectedCategory === "all" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("all")}
                        >
                            All Resources ({PRODUCTS.length})
                        </button>
                        <button
                            type="button"
                            className={`filter-tab ${selectedCategory === "bundles" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("bundles")}
                        >
                            All-in-One Bundles
                        </button>
                        <button
                            type="button"
                            className={`filter-tab ${selectedCategory === "admin" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("admin")}
                        >
                            Administration &amp; Policies
                        </button>
                        <button
                            type="button"
                            className={`filter-tab ${selectedCategory === "media" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("media")}
                        >
                            Worship &amp; Media Packs
                        </button>
                        <button
                            type="button"
                            className={`filter-tab ${selectedCategory === "financial" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("financial")}
                        >
                            Financial Ledgers
                        </button>
                        <button
                            type="button"
                            className={`filter-tab ${selectedCategory === "books" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("books")}
                        >
                            Workbooks &amp; E-Books
                        </button>
                    </div>
                </div>
            </section>

            {/* PRODUCT CATALOG */}
            <main className="store-catalog-container">
                {filteredProducts.length === 0 ? (
                    <div className="store-empty-state">
                        <ShoppingBag size={48} className="empty-icon" />
                        <h3>No resources found</h3>
                        <p>Try clearing your search query or selecting a different category.</p>
                        <button type="button" className="reset-btn" onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}>
                            View All Resources
                        </button>
                    </div>
                ) : (
                    <div className="store-products-grid">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="store-product-card">
                                {product.badge && (
                                    <div
                                        className="store-card-badge"
                                        dangerouslySetInnerHTML={{ __html: product.badge }}
                                    />
                                )}

                                <div className="product-card-top">
                                    <span className="product-category-tag">{product.categoryLabel}</span>
                                    <div className="product-rating-row">
                                        <div className="stars-wrap">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={13} className="star-filled" />
                                            ))}
                                        </div>
                                        <span className="rating-num">{product.rating.toFixed(1)}</span>
                                        <span className="download-count">({product.downloadsCount} downloads)</span>
                                    </div>
                                    <h3>{product.title}</h3>
                                    <p className="product-description">{product.description}</p>
                                </div>

                                <div className="product-format-box">
                                    <FileText size={14} className="format-icon" />
                                    <span>{product.fileFormat}</span>
                                </div>

                                <div className="product-card-highlights">
                                    <div className="highlights-title">Templates Included:</div>
                                    <ul>
                                        {product.highlights.map((item, idx) => (
                                            <li key={idx}>
                                                <Check size={14} className="check-green" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="product-card-bottom">
                                    <div className="product-price-box">
                                        <span className="price-amount">{formatCurrency(product.price)}</span>
                                        <span className="price-type">One-Time Download</span>
                                    </div>

                                    <button
                                        type="button"
                                        className="product-buy-btn"
                                        onClick={() => handleBuyNow(product)}
                                    >
                                        <span>Buy &amp; Download</span>
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TRUST BAR */}
                <section className="store-trust-bar">
                    <div className="store-trust-item">
                        <Zap size={22} className="trust-icon" />
                        <div>
                            <strong>Instant Digital Delivery</strong>
                            <p>Download link available immediately on receipt and sent to your email.</p>
                        </div>
                    </div>
                    <div className="store-trust-item">
                        <Check size={22} className="trust-icon" />
                        <div>
                            <strong>100% Editable Files</strong>
                            <p>Customize easily in Microsoft Word, PowerPoint, Excel, or Google Docs.</p>
                        </div>
                    </div>
                    <div className="store-trust-item">
                        <ShieldCheck size={22} className="trust-icon" />
                        <div>
                            <strong>Philippine Payment Verified</strong>
                            <p>Direct official GCash &amp; Maya processing with zero credit card required.</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="store-footer">
                <div className="store-footer-inner">
                    <span>&copy; 2026 EPIC Church Management Platform &bull; All Rights Reserved</span>
                    <div className="store-footer-links">
                        <button type="button" onClick={() => onNavigate?.("offer")}>Plans &amp; Pricing</button>
                        <button type="button" onClick={() => onNavigate?.("learning")}>EPIC Academy</button>
                        <button type="button" onClick={() => onNavigate?.("contact")}>Contact Support</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

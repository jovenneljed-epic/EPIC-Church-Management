import React, { useState, useEffect, useRef, useMemo } from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    Camera,
    Heart,
    ArrowRight,
    Search,
    LayoutGrid,
    Newspaper,
    Plus,
    Share2,
    ZoomIn,
    ZoomOut,
    ChevronLeft,
    ChevronRight,
    Check,
    UploadCloud,
    MapPin,
    Clock,
    Flame,
    Radio,
    Calendar,
    Trash2,
    Lock,
    Unlock
} from "lucide-react";
import {
    type GalleryPhotoStory,
    type CreateGalleryStoryRequest,
    fetchGalleryStories,
    submitGalleryStory,
    likeGalleryStory,
    compressImage,
    adminDeleteGalleryStory
} from "../../services/galleryService";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { AdminAuthModal, AdminToast } from "../../components/AdminAuthModal";
import "../../components/AdminAuthModal.css";
import "./GalleryPage.css";
import "./PublicUnisonTheme.css";

interface GalleryPageProps {
    onNavigate?: (page: string) => void;
}

const CATEGORIES = [
    "ALL",
    "WORSHIP",
    "TECHNOLOGY",
    "YOUTH",
    "DISCIPLESHIP",
    "OUTREACH",
    "FAMILY",
    "LEADERSHIP",
    "NEWS"
] as const;

const BADGES = [
    "FEATURED STORY",
    "BREAKING STORY",
    "PRAISE REPORT",
    "TECH SPOTLIGHT",
    "MISSION DISPATCH",
    "COMMUNITY CHRONICLE",
    "BEHIND THE SCENES",
    "MOMENT"
] as const;

const GalleryPage: React.FC<GalleryPageProps> = ({ onNavigate }) => {
    // Admin vs Member Role & Authentication Hook
    const {
        userRole,
        isAdmin,
        isAdminAuthModalOpen,
        adminAuthError,
        adminAuthLoading,
        toastNotification,
        handleRequestAdminMode,
        handleAdminLogin,
        closeAdminAuthModal,
        showToast
    } = useAdminAuth();

    // Stories state
    const [stories, setStories] = useState<GalleryPhotoStory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [viewMode, setViewMode] = useState<"wall" | "chronicle">("wall");

    // Lightbox state
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [isZoomed, setIsZoomed] = useState<boolean>(false);
    const [shareCopied, setShareCopied] = useState<boolean>(false);

    // Upload modal state
    const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
    const [uploadCompressing, setUploadCompressing] = useState<boolean>(false);
    const [uploadSubmitting, setUploadSubmitting] = useState<boolean>(false);
    const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Upload form state
    const [newTitle, setNewTitle] = useState<string>("");
    const [newDescription, setNewDescription] = useState<string>("");
    const [newImageUrl, setNewImageUrl] = useState<string>("");
    const [newCategory, setNewCategory] = useState<string>("WORSHIP");
    const [newEventLocation, setNewEventLocation] = useState<string>("Main Sanctuary");
    const [newCapturedBy, setNewCapturedBy] = useState<string>("");
    const [newBadge, setNewBadge] = useState<string>("MOMENT");

    // Delete photo story handler (Admin moderation)
    const handleDeleteStory = (e: React.MouseEvent, storyId: number, storyTitle: string) => {
        e.stopPropagation();
        if (!isAdmin) return;
        const confirmed = window.confirm(
            `Admin Moderation Confirmation:\n\nAre you sure you want to delete this photo story?\n"${storyTitle}"\n\nThis will remove it from the church gallery chronicle.`
        );
        if (!confirmed) return;

        adminDeleteGalleryStory(storyId);
        setStories((prev) => prev.filter((s) => s.id !== storyId));
        if (lightboxIndex !== null && filteredStories[lightboxIndex]?.id === storyId) {
            setLightboxIndex(null);
        }
        showToast(`🗑️ Photo story "${storyTitle.slice(0, 30)}..." deleted by Administrator.`);
    };

    // Load stories on mount
    useEffect(() => {
        let mounted = true;
        fetchGalleryStories().then((items) => {
            if (mounted) {
                setStories(items);
                setLoading(false);
            }
        });
        return () => {
            mounted = false;
        };
    }, []);

    // Filtered stories
    const filteredStories = useMemo(() => {
        return stories.filter((story) => {
            const matchesCat =
                selectedCategory === "ALL" ||
                story.category.toUpperCase() === selectedCategory.toUpperCase();
            const q = searchQuery.trim().toLowerCase();
            const matchesSearch =
                q === "" ||
                story.title.toLowerCase().includes(q) ||
                story.description.toLowerCase().includes(q) ||
                story.eventLocation.toLowerCase().includes(q) ||
                story.capturedBy.toLowerCase().includes(q) ||
                story.badge.toLowerCase().includes(q);
            return matchesCat && matchesSearch;
        });
    }, [stories, selectedCategory, searchQuery]);

    // Top Lead story for the spotlight billboard
    const spotlightStory = useMemo(() => {
        return (
            stories.find((s) => s.badge === "FEATURED STORY") ||
            stories[0] ||
            null
        );
    }, [stories]);

    // Lightbox story
    const currentLightboxStory =
        lightboxIndex !== null ? filteredStories[lightboxIndex] : null;

    // Keyboard navigation for Lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setLightboxIndex(null);
                setIsZoomed(false);
            } else if (e.key === "ArrowLeft") {
                setLightboxIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : filteredStories.length - 1
                );
                setIsZoomed(false);
            } else if (e.key === "ArrowRight") {
                setLightboxIndex((prev) =>
                    prev !== null && prev < filteredStories.length - 1 ? prev + 1 : 0
                );
                setIsZoomed(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, filteredStories.length]);

    // Like handler
    const handleLike = async (e: React.MouseEvent, storyId: number) => {
        e.stopPropagation();
        const res = await likeGalleryStory(storyId);
        setStories((prev) =>
            prev.map((s) =>
                s.id === storyId
                    ? {
                          ...s,
                          likes: res.likes,
                          userLiked: !s.userLiked
                      }
                    : s
            )
        );
    };

    // File selection & compression
    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file (JPEG, PNG, WebP).");
            return;
        }

        try {
            setUploadCompressing(true);
            const compressed = await compressImage(file, 1600, 1200, 0.85);
            setNewImageUrl(compressed);
        } catch (err) {
            console.error("Compression error:", err);
            alert("Failed to process image. Please try another file.");
        } finally {
            setUploadCompressing(false);
        }
    };

    // Reset upload form
    const resetUploadForm = () => {
        setNewTitle("");
        setNewDescription("");
        setNewImageUrl("");
        setNewCategory("WORSHIP");
        setNewEventLocation("Main Sanctuary");
        setNewCapturedBy("");
        setNewBadge("MOMENT");
        setUploadSuccess(false);
    };

    // Submit new story
    const handleSubmitStory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) {
            alert("Please enter a title for your photo story.");
            return;
        }
        if (!newDescription.trim()) {
            alert("Please enter a description or testimony.");
            return;
        }
        if (!newImageUrl) {
            alert("Please upload an image for your story.");
            return;
        }

        try {
            setUploadSubmitting(true);
            const req: CreateGalleryStoryRequest = {
                title: newTitle.trim(),
                description: newDescription.trim(),
                imageUrl: newImageUrl,
                category: newCategory,
                eventLocation: newEventLocation.trim() || "Main Sanctuary",
                capturedBy: newCapturedBy.trim() || "Church Member",
                badge: newBadge
            };

            const created = await submitGalleryStory(req);
            setStories((prev) => [created, ...prev]);
            setUploadSuccess(true);
            setTimeout(() => {
                setIsUploadOpen(false);
                resetUploadForm();
            }, 1200);
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Failed to publish story. Please try again.");
        } finally {
            setUploadSubmitting(false);
        }
    };

    // Share link copy
    const handleShare = (story: GalleryPhotoStory) => {
        const shareData = {
            title: story.title,
            text: `${story.title} — EPIC Church Visual Kingdom Chronicle`,
            url: window.location.href
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            navigator.share(shareData).catch(() => {});
        } else {
            navigator.clipboard?.writeText(window.location.href);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2200);
        }
    };

    const getBadgeClass = (badge: string) => {
        const b = badge.toUpperCase();
        if (b.includes("BREAKING")) return "breaking";
        if (b.includes("PRAISE")) return "praise";
        if (b.includes("TECH")) return "tech";
        return "";
    };

    return (
        <div className="epic-public-gallery">
            <PublicHeader onNavigate={onNavigate} />

            {/* EPIC Gallery Role Bar (Admin vs Member Mode - Just like EPIC CMS) */}
            <div className={`community-role-top-banner ${userRole.toLowerCase()}`}>
                <div className="community-role-banner-content">
                    <span className="community-role-tag">
                        {userRole === "ADMIN" ? "👑 EPIC Administrator Mode" : "👤 EPIC Church Member Mode"}
                    </span>
                    <span className="community-role-desc">
                        {userRole === "ADMIN"
                            ? "Admin Moderation Active: You can delete inappropriate photos, curate gallery chronicles, and preserve fellowship culture."
                            : "Church Family Archive: Explore faith moments, submit photo stories, and celebrate what God is doing."}
                    </span>
                </div>
                <button
                    type="button"
                    className={`community-role-switch-pill ${userRole.toLowerCase()}`}
                    onClick={handleRequestAdminMode}
                    title={userRole === "ADMIN" ? "Exit Admin Mode" : "Authenticate as Admin"}
                >
                    {userRole === "ADMIN" ? (
                        <>
                            <Unlock size={13} style={{ display: "inline", marginRight: 4 }} />
                            <span>Exit Admin Mode</span>
                        </>
                    ) : (
                        <>
                            <Lock size={13} style={{ display: "inline", marginRight: 4 }} />
                            <span>Admin Login</span>
                        </>
                    )}
                </button>
            </div>

            {/* 1. LIVE KINGDOM CHRONICLE TICKER */}
            {stories.length > 0 && (
                <div className="live-chronicle-ticker-wrap">
                    <div className="live-chronicle-ticker-inner">
                        <span className="live-ticker-badge">
                            <span className="live-ticker-dot"></span> LIVE KINGDOM CHRONICLE
                        </span>
                        <div className="live-ticker-track">
                            {stories.slice(0, 6).map((story, i) => (
                                <span
                                    key={story.id || i}
                                    className="live-ticker-item"
                                    onClick={() => {
                                        const idx = filteredStories.findIndex((s) => s.id === story.id);
                                        if (idx !== -1) setLightboxIndex(idx);
                                    }}
                                >
                                    <strong>[{story.category}]</strong> {story.title} •{" "}
                                    <span style={{ color: "#38bdf8" }}>{story.eventLocation}</span>
                                </span>
                            ))}
                            {/* Duplicate loop for seamless marquee */}
                            {stories.slice(0, 6).map((story, i) => (
                                <span
                                    key={`dup-${story.id || i}`}
                                    className="live-ticker-item"
                                    onClick={() => {
                                        const idx = filteredStories.findIndex((s) => s.id === story.id);
                                        if (idx !== -1) setLightboxIndex(idx);
                                    }}
                                >
                                    <strong>[{story.category}]</strong> {story.title} •{" "}
                                    <span style={{ color: "#38bdf8" }}>{story.eventLocation}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. FUTURISTIC HERO SECTION */}
            <section className="gallery-hero">
                <div className="gallery-hero-content">
                    <span className="gallery-eyebrow">
                        <Camera size={14} /> VISUAL KINGDOM CHRONICLE &amp; PHOTO ARCHIVES
                    </span>
                    <h1>
                        Moments. People. <span>Living Purpose.</span>
                    </h1>
                    <p>
                        Witness the tangible move of God at EPIC Church. From electrifying Sunday worship
                        and mobile QR check-in kiosks to vibrant youth camps, community outreaches, and
                        miraculous testimonies captured by our church family.
                    </p>

                    {/* Stats HUD Strip */}
                    <div className="gallery-stats-hud">
                        <div className="gallery-stat-item">
                            <span className="gallery-stat-num">{stories.length}</span>
                            <span className="gallery-stat-label">Stories Archived</span>
                        </div>
                        <div className="gallery-stat-item">
                            <span className="gallery-stat-num">
                                {new Set(stories.map((s) => s.category)).size || 8}
                            </span>
                            <span className="gallery-stat-label">Active Ministries</span>
                        </div>
                        <div className="gallery-stat-item">
                            <span className="gallery-stat-num">
                                {stories.reduce((acc, s) => acc + (s.likes || 0), 0)}
                            </span>
                            <span className="gallery-stat-label">Praise Reactions</span>
                        </div>
                        <div className="gallery-stat-item">
                            <span className="gallery-stat-num">100%</span>
                            <span className="gallery-stat-label">Open Community</span>
                        </div>
                    </div>

                    {/* Hero Actions */}
                    <div className="gallery-hero-actions">
                        <button
                            type="button"
                            className="gallery-btn-primary"
                            onClick={() => {
                                const el = document.getElementById("gallery-controls-dock");
                                el?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Explore Chronicle <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            className="gallery-btn-upload"
                            onClick={() => setIsUploadOpen(true)}
                        >
                            <Plus size={16} /> Submit Photo Story
                        </button>
                    </div>
                </div>
            </section>

            {/* 3. FEATURED LEAD STORY BILLBOARD (Spotlight Showcase) */}
            {spotlightStory && (
                <section className="gallery-spotlight-section">
                    <div className="gallery-container">
                        <article
                            className="featured-story-billboard"
                            onClick={() => {
                                const idx = filteredStories.findIndex((s) => s.id === spotlightStory.id);
                                if (idx !== -1) setLightboxIndex(idx);
                            }}
                        >
                            <div className="featured-billboard-img-wrap">
                                <img
                                    src={spotlightStory.imageUrl}
                                    alt={spotlightStory.title}
                                    className="featured-billboard-img"
                                    loading="eager"
                                />
                                <div className="featured-billboard-overlay">
                                    <div className="featured-billboard-meta-top">
                                        <span className="featured-badge-pill">
                                            <Flame size={12} style={{ display: "inline", marginRight: 4 }} />
                                            {spotlightStory.badge}
                                        </span>
                                        <span className="featured-cat-pill">{spotlightStory.category}</span>
                                        <span className="featured-location-pill">
                                            <MapPin size={13} /> {spotlightStory.eventLocation}
                                        </span>
                                    </div>

                                    <h2 className="featured-billboard-title">{spotlightStory.title}</h2>
                                    <p className="featured-billboard-desc">{spotlightStory.description}</p>

                                    <div className="featured-billboard-footer">
                                        <div className="featured-photographer-strip">
                                            <div className="photographer-avatar">
                                                {spotlightStory.capturedBy.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="photographer-info">
                                                <strong>{spotlightStory.capturedBy}</strong>
                                                <span>
                                                    <Clock size={11} style={{ display: "inline", marginRight: 4 }} />
                                                    {new Date(spotlightStory.createdDate).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric"
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="featured-billboard-actions">
                                            <button
                                                type="button"
                                                className={`billboard-reaction-btn ${
                                                    spotlightStory.userLiked ? "liked" : ""
                                                }`}
                                                onClick={(e) => handleLike(e, spotlightStory.id)}
                                            >
                                                <Heart
                                                    size={16}
                                                    fill={spotlightStory.userLiked ? "#f43f5e" : "none"}
                                                />
                                                <span>{spotlightStory.likes} Amen &amp; Praise</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="billboard-open-btn"
                                                onClick={() => {
                                                    const idx = filteredStories.findIndex(
                                                        (s) => s.id === spotlightStory.id
                                                    );
                                                    if (idx !== -1) setLightboxIndex(idx);
                                                }}
                                            >
                                                View Story <ArrowRight size={14} />
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    className="moderation-delete-pill"
                                                    onClick={(e) => handleDeleteStory(e, spotlightStory.id, spotlightStory.title)}
                                                    title="Admin: Delete Story from Chronicle"
                                                >
                                                    <Trash2 size={13} /> Delete Story
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>
            )}

            {/* 4. CONTROLS HUD & GALLERY FEED */}
            <main className="gallery-main-section" id="gallery-controls-dock">
                <div className="gallery-container">
                    {/* Controls HUD */}
                    <div className="gallery-controls-hud">
                        <div className="gallery-controls-top-row">
                            {/* Dual View Mode Switcher */}
                            <div className="gallery-view-switcher">
                                <button
                                    type="button"
                                    className={`view-switch-btn ${viewMode === "wall" ? "active" : ""}`}
                                    onClick={() => setViewMode("wall")}
                                >
                                    <LayoutGrid size={15} /> Photo Wall
                                </button>
                                <button
                                    type="button"
                                    className={`view-switch-btn ${viewMode === "chronicle" ? "active" : ""}`}
                                    onClick={() => setViewMode("chronicle")}
                                >
                                    <Newspaper size={15} /> News Chronicle
                                </button>
                            </div>

                            {/* Search HUD */}
                            <div className="gallery-search-hud">
                                <Search size={16} className="gallery-search-hud-icon" />
                                <input
                                    type="text"
                                    placeholder="Search moments, ministries, keywords..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        className="gallery-search-hud-clear"
                                        onClick={() => setSearchQuery("")}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Submit Button on Dock */}
                            <button
                                type="button"
                                className="gallery-submit-btn-dock"
                                onClick={() => setIsUploadOpen(true)}
                            >
                                <Plus size={15} /> Submit Story
                            </button>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="gallery-categories-hud-row">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`gallery-cat-pill ${selectedCategory === cat ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat === "ALL" ? "All Moments" : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* VIEW A: PHOTO WALL (Adaptive Grid) */}
                    {viewMode === "wall" && (
                        <div className="gallery-photo-wall">
                            {filteredStories.map((story, index) => (
                                <article
                                    key={story.id}
                                    className="photo-wall-card"
                                    onClick={() => setLightboxIndex(index)}
                                >
                                    <div className="photo-wall-media">
                                        <img
                                            src={story.imageUrl}
                                            alt={story.title}
                                            className="photo-wall-img"
                                            loading="lazy"
                                        />
                                        <div className="photo-wall-gradient"></div>

                                        <span
                                            className={`photo-wall-floating-badge ${getBadgeClass(
                                                story.badge
                                            )}`}
                                        >
                                            {story.badge}
                                        </span>

                                        {isAdmin && (
                                            <button
                                                type="button"
                                                className="moderation-card-trash-btn"
                                                onClick={(e) => handleDeleteStory(e, story.id, story.title)}
                                                title="Admin: Delete Photo Story"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className={`photo-wall-floating-like ${
                                                story.userLiked ? "liked" : ""
                                            }`}
                                            onClick={(e) => handleLike(e, story.id)}
                                            title="Amen & Praise"
                                        >
                                            <Heart
                                                size={13}
                                                fill={story.userLiked ? "#f43f5e" : "none"}
                                            />
                                            <span>{story.likes}</span>
                                        </button>
                                    </div>

                                    <div className="photo-wall-body">
                                        <div className="photo-wall-location-row">
                                            <MapPin size={12} />
                                            <span>{story.eventLocation}</span>
                                            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                                            <span>{story.category}</span>
                                        </div>

                                        <h3 className="photo-wall-title">{story.title}</h3>
                                        <p className="photo-wall-caption">{story.description}</p>

                                        <div className="photo-wall-footer">
                                            <div className="photo-wall-author">
                                                <span>{story.capturedBy}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="photo-wall-view-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLightboxIndex(index);
                                                }}
                                            >
                                                View Story <ArrowRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {/* VIEW B: NEWS CHRONICLE (Editorial Journalism Stream) */}
                    {viewMode === "chronicle" && (
                        <div className="gallery-news-stream">
                            {filteredStories.map((story, index) => (
                                <article
                                    key={story.id}
                                    className="news-chronicle-card"
                                    onClick={() => setLightboxIndex(index)}
                                >
                                    <div className="news-chronicle-media">
                                        <img
                                            src={story.imageUrl}
                                            alt={story.title}
                                            className="news-chronicle-img"
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className="news-chronicle-body">
                                        <div className="news-chronicle-meta-row">
                                            <span
                                                className={`news-badge ${getBadgeClass(story.badge)}`}
                                            >
                                                {story.badge}
                                            </span>
                                            <span className="news-badge" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                                                {story.category}
                                            </span>
                                            <span className="news-location">
                                                <MapPin size={12} /> {story.eventLocation}
                                            </span>
                                        </div>

                                        <h3 className="news-chronicle-title">{story.title}</h3>
                                        <p className="news-chronicle-excerpt">{story.description}</p>

                                        <div className="news-chronicle-footer">
                                            <div className="news-byline">
                                                <div className="news-byline-avatar">
                                                    {story.capturedBy.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="news-byline-text">
                                                    <strong>{story.capturedBy}</strong>
                                                    <span>
                                                        {new Date(story.createdDate).toLocaleDateString(undefined, {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric"
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="news-actions">
                                                <button
                                                    type="button"
                                                    className={`billboard-reaction-btn ${
                                                        story.userLiked ? "liked" : ""
                                                    }`}
                                                    onClick={(e) => handleLike(e, story.id)}
                                                >
                                                    <Heart
                                                        size={14}
                                                        fill={story.userLiked ? "#f43f5e" : "none"}
                                                    />
                                                    <span>{story.likes}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="billboard-open-btn"
                                                    onClick={() => setLightboxIndex(index)}
                                                >
                                                    Read Chronicle <ArrowRight size={13} />
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        className="moderation-delete-pill"
                                                        onClick={(e) => handleDeleteStory(e, story.id, story.title)}
                                                        title="Admin: Delete Story from Chronicle"
                                                    >
                                                        <Trash2 size={13} /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredStories.length === 0 && !loading && (
                        <div className="gallery-empty-box" style={{ textAlign: "center", padding: "60px 20px" }}>
                            <Camera size={48} style={{ color: "#38bdf8", margin: "0 auto 16px" }} />
                            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "8px" }}>
                                No stories match your search criteria
                            </h3>
                            <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
                                Try adjusting your keywords, selecting "All Moments", or submit a new photo story!
                            </p>
                            <button
                                type="button"
                                className="gallery-btn-primary"
                                onClick={() => {
                                    setSelectedCategory("ALL");
                                    setSearchQuery("");
                                }}
                            >
                                Reset Filter
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* 5. COMMUNITY UPLOAD MODAL (Hologram Studio) */}
            {isUploadOpen && (
                <div className="upload-modal-overlay" onClick={() => setIsUploadOpen(false)}>
                    <div className="upload-modal-hud" onClick={(e) => e.stopPropagation()}>
                        <div className="upload-modal-header">
                            <div>
                                <h2>
                                    <UploadCloud size={24} color="#38bdf8" /> Submit Photo Story
                                </h2>
                                <p>Share what God is doing in your ministry, group, or service.</p>
                            </div>
                            <button
                                type="button"
                                className="upload-modal-close"
                                onClick={() => setIsUploadOpen(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {uploadSuccess ? (
                            <div style={{ textAlign: "center", padding: "50px 20px" }}>
                                <Check size={56} style={{ color: "#34d399", margin: "0 auto 16px" }} />
                                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>
                                    Story Published!
                                </h3>
                                <p style={{ color: "#94a3b8" }}>
                                    Your photo story is now live and synchronized with the church chronicle.
                                </p>
                            </div>
                        ) : (
                            <div className="upload-grid-layout">
                                {/* Left Form Column */}
                                <form onSubmit={handleSubmitStory}>
                                    {/* Dropzone */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: "none" }}
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e.target.files)}
                                    />

                                    {!newImageUrl ? (
                                        <div
                                            className={`photo-dropzone ${isDragOver ? "dragover" : ""}`}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setIsDragOver(true);
                                            }}
                                            onDragLeave={() => setIsDragOver(false)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setIsDragOver(false);
                                                handleFileSelect(e.dataTransfer.files);
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="dropzone-icon-circle">
                                                <UploadCloud size={24} />
                                            </div>
                                            <div className="dropzone-title">
                                                {uploadCompressing
                                                    ? "Optimizing Image..."
                                                    : "Click or Drag & Drop Photo Here"}
                                            </div>
                                            <div className="dropzone-desc">
                                                High-res photos are automatically optimized for fast cloud loading
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="photo-preview-box">
                                            <img src={newImageUrl} alt="Preview" />
                                            <button
                                                type="button"
                                                className="photo-preview-remove"
                                                onClick={() => setNewImageUrl("")}
                                            >
                                                Change Photo
                                            </button>
                                        </div>
                                    )}

                                    {/* Title */}
                                    <div className="upload-form-group">
                                        <label>Story Title *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sunday Youth Encounter & Praise"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Description / Testimony */}
                                    <div className="upload-form-group">
                                        <label>Story Description / Testimony *</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Describe what took place, the scriptures preached, or how lives were touched..."
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Category & Badge */}
                                    <div className="upload-form-row">
                                        <div className="upload-form-group">
                                            <label>Ministry Category</label>
                                            <select
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                            >
                                                {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="upload-form-group">
                                            <label>Story Badge / Highlight</label>
                                            <select
                                                value={newBadge}
                                                onChange={(e) => setNewBadge(e.target.value)}
                                            >
                                                {BADGES.map((b) => (
                                                    <option key={b} value={b}>
                                                        {b}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Location & Photographer */}
                                    <div className="upload-form-row">
                                        <div className="upload-form-group">
                                            <label>Event Location</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Main Sanctuary, Youth Hall"
                                                value={newEventLocation}
                                                onChange={(e) => setNewEventLocation(e.target.value)}
                                            />
                                        </div>

                                        <div className="upload-form-group">
                                            <label>Photographer / Contributor</label>
                                            <input
                                                type="text"
                                                placeholder="Your name or ministry role"
                                                value={newCapturedBy}
                                                onChange={(e) => setNewCapturedBy(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Action */}
                                    <button
                                        type="submit"
                                        className="gallery-btn-primary"
                                        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                                        disabled={uploadSubmitting || uploadCompressing}
                                    >
                                        {uploadSubmitting ? "Publishing to Chronicle..." : "Publish Photo Story"}
                                    </button>
                                </form>

                                {/* Right Hologram Card Live Preview */}
                                <div className="hologram-preview-pane">
                                    <div className="hologram-preview-title">
                                        <Radio size={14} /> Live Card Preview
                                    </div>

                                    <div className="photo-wall-card" style={{ cursor: "default" }}>
                                        <div className="photo-wall-media">
                                            {newImageUrl ? (
                                                <img
                                                    src={newImageUrl}
                                                    alt="Preview"
                                                    className="photo-wall-img"
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: "#64748b"
                                                    }}
                                                >
                                                    <Camera size={40} />
                                                </div>
                                            )}
                                            <div className="photo-wall-gradient"></div>
                                            <span className="photo-wall-floating-badge">{newBadge}</span>
                                        </div>

                                        <div className="photo-wall-body">
                                            <div className="photo-wall-location-row">
                                                <MapPin size={12} />
                                                <span>{newEventLocation || "Main Sanctuary"}</span>
                                                <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                                                <span>{newCategory}</span>
                                            </div>

                                            <h3 className="photo-wall-title">
                                                {newTitle || "Your Inspiring Story Title"}
                                            </h3>
                                            <p className="photo-wall-caption">
                                                {newDescription ||
                                                    "Your story description or testimony will appear right here..."}
                                            </p>

                                            <div className="photo-wall-footer">
                                                <div className="photo-wall-author">
                                                    <span>{newCapturedBy || "Church Member"}</span>
                                                </div>
                                                <span style={{ color: "#38bdf8", fontWeight: 700 }}>Just Now</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 6. CINEMATIC LIGHTBOX THEATER (Fullscreen Glass Modal) */}
            {currentLightboxStory && lightboxIndex !== null && (
                <div className="lightbox-backdrop" onClick={() => setLightboxIndex(null)}>
                    {/* Top Bar */}
                    <div className="lightbox-top-bar" onClick={(e) => e.stopPropagation()}>
                        <div className="lightbox-top-left">
                            <span className="featured-badge-pill">{currentLightboxStory.badge}</span>
                            <span className="featured-cat-pill">{currentLightboxStory.category}</span>
                            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                                Story {lightboxIndex + 1} of {filteredStories.length}
                            </span>
                        </div>

                        <div className="lightbox-top-actions">
                            <button
                                type="button"
                                className="lightbox-action-btn"
                                onClick={() => setIsZoomed(!isZoomed)}
                                title="Toggle Zoom"
                            >
                                {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                                <span>{isZoomed ? "Zoom Out" : "Zoom In"}</span>
                            </button>

                            <button
                                type="button"
                                className="lightbox-action-btn"
                                onClick={() => handleShare(currentLightboxStory)}
                                title="Share Story"
                            >
                                <Share2 size={16} />
                                <span>{shareCopied ? "Link Copied!" : "Share"}</span>
                            </button>

                            {isAdmin && (
                                <button
                                    type="button"
                                    className="moderation-delete-pill"
                                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                                    onClick={(e) => handleDeleteStory(e, currentLightboxStory.id, currentLightboxStory.title)}
                                    title="Admin: Delete Story from Chronicle"
                                >
                                    <Trash2 size={14} /> Delete Story
                                </button>
                            )}

                            <button
                                type="button"
                                className="lightbox-close-btn"
                                onClick={() => setLightboxIndex(null)}
                                aria-label="Close Lightbox"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Main Body: Stage + Sidebar */}
                    <div className="lightbox-main-body" onClick={(e) => e.stopPropagation()}>
                        {/* Image Stage */}
                        <div className="lightbox-image-stage">
                            {/* Prev Arrow */}
                            <button
                                type="button"
                                className="lightbox-nav-arrow prev"
                                onClick={() => {
                                    setLightboxIndex((prev) =>
                                        prev !== null && prev > 0 ? prev - 1 : filteredStories.length - 1
                                    );
                                    setIsZoomed(false);
                                }}
                                title="Previous Story (Left Arrow)"
                            >
                                <ChevronLeft size={24} />
                            </button>

                            {/* Full Image */}
                            <img
                                src={currentLightboxStory.imageUrl}
                                alt={currentLightboxStory.title}
                                className="lightbox-full-img"
                                style={{
                                    transform: isZoomed ? "scale(1.45)" : "scale(1)",
                                    cursor: isZoomed ? "zoom-out" : "zoom-in"
                                }}
                                onClick={() => setIsZoomed(!isZoomed)}
                            />

                            {/* Next Arrow */}
                            <button
                                type="button"
                                className="lightbox-nav-arrow next"
                                onClick={() => {
                                    setLightboxIndex((prev) =>
                                        prev !== null && prev < filteredStories.length - 1 ? prev + 1 : 0
                                    );
                                    setIsZoomed(false);
                                }}
                                title="Next Story (Right Arrow)"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        {/* Lightbox Sidebar */}
                        <aside className="lightbox-sidebar">
                            <h2>{currentLightboxStory.title}</h2>
                            <p>{currentLightboxStory.description}</p>

                            <div className="lightbox-meta-box">
                                <div className="lightbox-meta-line">
                                    <MapPin size={15} style={{ color: "#38bdf8" }} />
                                    <span>
                                        Location: <strong>{currentLightboxStory.eventLocation}</strong>
                                    </span>
                                </div>
                                <div className="lightbox-meta-line">
                                    <Camera size={15} style={{ color: "#38bdf8" }} />
                                    <span>
                                        Captured By: <strong>{currentLightboxStory.capturedBy}</strong>
                                    </span>
                                </div>
                                <div className="lightbox-meta-line">
                                    <Clock size={15} style={{ color: "#38bdf8" }} />
                                    <span>
                                        Date:{" "}
                                        <strong>
                                            {new Date(currentLightboxStory.createdDate).toLocaleDateString(
                                                undefined,
                                                {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric"
                                                }
                                            )}
                                        </strong>
                                    </span>
                                </div>
                            </div>

                            {/* Reactions and Actions */}
                            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                                <button
                                    type="button"
                                    className={`billboard-reaction-btn ${
                                        currentLightboxStory.userLiked ? "liked" : ""
                                    }`}
                                    style={{ justifyContent: "center", padding: "12px 20px" }}
                                    onClick={(e) => handleLike(e, currentLightboxStory.id)}
                                >
                                    <Heart
                                        size={18}
                                        fill={currentLightboxStory.userLiked ? "#f43f5e" : "none"}
                                    />
                                    <span>{currentLightboxStory.likes} Amen &amp; Praise Reactions</span>
                                </button>

                                <button
                                    type="button"
                                    className="events-secondary-button"
                                    style={{ justifyContent: "center" }}
                                    onClick={() => {
                                        setLightboxIndex(null);
                                        onNavigate?.("events");
                                    }}
                                >
                                    <Calendar size={16} /> View Upcoming Gatherings
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            )}

            {/* 7. CTA SECTION */}
            <section className="gallery-cta">
                <div className="gallery-container">
                    <div className="gallery-cta-card">
                        <span className="gallery-section-label">YOUR STORY MATTERS</span>
                        <h2>Be Part of What God Is Doing at EPIC</h2>
                        <p>
                            Every smile, volunteer, and testimony represents a life transformed by the Gospel.
                            We would love to welcome you to our church family this Sunday.
                        </p>
                        <div className="events-hero-actions">
                            <button
                                type="button"
                                className="events-primary-button"
                                onClick={() => onNavigate?.("contact")}
                            >
                                Plan Your Sunday Visit <ArrowRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="events-secondary-button"
                                onClick={() => onNavigate?.("about")}
                            >
                                Learn About Our Mission
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Admin Auth Modal & Toast */}
            <AdminAuthModal
                isOpen={isAdminAuthModalOpen}
                onClose={closeAdminAuthModal}
                onSubmit={handleAdminLogin}
                error={adminAuthError}
                loading={adminAuthLoading}
                title="EPIC Gallery Admin Moderation"
                description="Only authorized church administrators and media coordinators can delete photo stories to maintain a pure, Christ-exalting chronicle."
            />
            <AdminToast message={toastNotification} />
        </div>
    );
};

export default GalleryPage;

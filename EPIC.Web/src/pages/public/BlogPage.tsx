import { useState, useMemo, useEffect, useRef } from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    Heart,
    MessageSquare,
    Share2,
    Search,
    Calendar,
    Clock,
    ArrowRight,
    ArrowLeft,
    Copy,
    Sparkles,
    Send,
    CornerDownRight,
    Check,
    Download,
    BookOpen,
    Tag as TagIcon,
    FileText,
    Mail,
    ThumbsUp,
} from "lucide-react";
import {
    CHURCH_ARTICLES,
    type ChurchArticle,
    type ContentBlock,
} from "./churchArticles";
import {
    getArticleReactions,
    setArticleReaction,
    recordArticleShare,
    getTotalReactions,
    getArticleComments,
    addArticleComment,
    addCommentReply,
    toggleCommentLike,
    type ReactionType,
    type ArticleReactions,
    type BlogComment,
} from "../../services/blogEngagementService";
import { getAdminBlogs } from "../../services/blogService";
import type { BlogPost } from "../../services/blogService";
import "./BlogPage.css";

interface BlogPageProps {
    onNavigate?: (page: string) => void;
    initialSlug?: string;
    initialSubpath?: string;
}

export default function BlogPage({ onNavigate, initialSlug, initialSubpath }: BlogPageProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [activeArticle, setActiveArticle] = useState<ChurchArticle | null>(null);
    
    // CMS Published Articles
    const [cmsBlogs, setCmsBlogs] = useState<BlogPost[]>([]);

    // Facebook Reactions & Real-Time Engagement
    const [reactionsMap, setReactionsMap] = useState<Record<string, ArticleReactions>>({});
    const [commentsMap, setCommentsMap] = useState<Record<string, BlogComment[]>>({});
    const [activeDockArticleId, setActiveDockArticleId] = useState<string | null>(null);
    const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);
    const [shareModalArticle, setShareModalArticle] = useState<ChurchArticle | null>(null);
    const [newlyAddedCommentId, setNewlyAddedCommentId] = useState<string | null>(null);
    
    // Comment Form State
    const [commentName, setCommentName] = useState("");
    const [commentRole, setCommentRole] = useState("Church Member");
    const [commentText, setCommentText] = useState("");
    
    // Inline Reply Form State
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyName, setReplyName] = useState("");
    const [replyText, setReplyText] = useState("");

    // Newsletter State
    const [newsletterEmail, setNewsletterEmail] = useState("");

    // Toast Notification
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Refs
    const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
    const commentsSectionRef = useRef<HTMLElement>(null);

    const categories = [
        { id: "all", label: "All Topics" },
        { id: "faith-life", label: "Faith & Life" },
        { id: "foundations", label: "Biblical Foundations" },
        { id: "leadership", label: "Pastoral Leadership" },
        { id: "prayer", label: "Prayer & Revival" },
        { id: "family", label: "Marriage & Family" },
        { id: "youth", label: "Youth & Next Gen" },
        { id: "worship", label: "Worship" },
        { id: "mental-health", label: "Pastoral Care" },
        { id: "evangelism", label: "Evangelism" },
        { id: "discipleship", label: "Discipleship" },
        { id: "church-news", label: "Church News & Investigations" },
        { id: "technology", label: "Technology" },
    ];

    // Convert CMS BlogPost into ChurchArticle
    const convertCmsBlogToChurchArticle = (b: BlogPost): ChurchArticle => ({
        id: String(b.blogPostId),
        title: b.title,
        slug: b.slug,
        category: "faith-life",
        categoryLabel: b.category || "Faith & Life",
        subtitle: b.subtitle || b.excerpt || "",
        author: {
            id: "pastor-ronnel",
            name: b.author || "Pastor Ronnel M. Aviguetero",
            position: "Lead Pastor & Founder",
            avatarText: (b.author || "PR").split(" ").map((w) => w[0]).slice(0, 2).join(""),
            avatarColor: "#0284c7",
            bio: "Equipping the global body of Christ with apostolic vision, pastoral truth, and church management intelligence.",
            social: { facebook: "https://facebook.com/epicchurch" }
        },
        publishDate: b.publishDate
            ? new Date(b.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "Recently Published",
        updatedDate: "Recently",
        readTime: `${Math.max(1, Math.ceil((b.content.length / 500)))} min read`,
        featuredImage: b.coverImage || "/images/og/epic-main-tagline.jpg",
        ogImage: b.coverImage || "/images/og/epic-main-tagline.jpg",
        featuredImageCaption: b.subtitle || b.title,
        featuredScripture: {
            verse: "Your word is a lamp to my feet and a light to my path.",
            reference: "Psalm 119:105"
        },
        tags: ["BiblicalTruth", "ChurchLeadership", "Discipleship"],
        defaultLikes: 68,
        allowComments: true,
        seo: {
            metaTitle: `${b.title} | EPIC Church`,
            metaDescription: b.subtitle || b.excerpt || b.title,
            canonicalUrl: `https://epic-cms.vercel.app/blog/${b.slug}`,
            keywords: ["Faith", "Church", "Leadership", "Discipleship"],
        },
        blocks: [
            { type: "paragraph", text: b.content }
        ]
    });

    // Merge standard articles and custom CMS articles
    const allArticles = useMemo(() => {
        const map = new Map<string, ChurchArticle>();
        CHURCH_ARTICLES.forEach((a) => map.set(a.slug, a));
        cmsBlogs.filter((b) => b.isPublished).forEach((b) => {
            const converted = convertCmsBlogToChurchArticle(b);
            if (!map.has(converted.slug)) {
                map.set(converted.slug, converted);
            }
        });
        return Array.from(map.values());
    }, [cmsBlogs]);

    // Read URL param or initialSlug or subpath on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let slug = initialSlug || params.get("article") || params.get("slug");
        
        // Handle subpath (e.g. /blog/category/faith-life or /blog/church-news or /blog/article-slug)
        if (!slug && initialSubpath) {
            const cleanSub = initialSubpath.replace(/^\/+|\/+$/g, "");
            if (cleanSub.startsWith("category/")) {
                const cat = cleanSub.replace("category/", "");
                setSelectedCategory(cat);
            } else if (cleanSub.startsWith("tag/")) {
                const tg = cleanSub.replace("tag/", "");
                setSelectedTag(tg);
            } else {
                const isCat = categories.some((c) => c.id === cleanSub);
                if (isCat) {
                    setSelectedCategory(cleanSub);
                } else {
                    slug = cleanSub;
                }
            }
        }

        if (slug) {
            const found = allArticles.find(
                (a) => a.slug === slug || a.id === slug
            );
            if (found) {
                setActiveArticle(found);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        }

        // Check category query param (e.g., ?category=church-news or ?cat=faith-life)
        const catParam = params.get("category") || params.get("cat");
        if (catParam) {
            setSelectedCategory(catParam);
        }

        // Check tag query param (e.g., ?tag=SpiritualAbuse)
        const tagParam = params.get("tag");
        if (tagParam) {
            setSelectedTag(tagParam);
        }
    }, [initialSlug, initialSubpath, allArticles]);

    // Dynamically update document title and meta tags when activeArticle changes
    useEffect(() => {
        if (activeArticle) {
            document.title = `${activeArticle.title} | EPIC Church`;
            const updateMeta = (prop: string, val: string, isName = false) => {
                let el = document.querySelector(isName ? `meta[name="${prop}"]` : `meta[property="${prop}"]`);
                if (!el) {
                    el = document.createElement("meta");
                    if (isName) el.setAttribute("name", prop);
                    else el.setAttribute("property", prop);
                    document.head.appendChild(el);
                }
                el.setAttribute("content", val);
            };

            const fullImageUrl = activeArticle.ogImage?.startsWith("http")
                ? activeArticle.ogImage
                : `https://epic-cms.vercel.app${activeArticle.ogImage?.startsWith("/") ? "" : "/"}${activeArticle.ogImage || "images/og/epic-main-tagline.jpg"}`;
            const canonicalUrl = `https://epic-cms.vercel.app/blog?article=${encodeURIComponent(activeArticle.slug)}`;

            updateMeta("og:title", activeArticle.title);
            updateMeta("og:description", activeArticle.subtitle);
            updateMeta("og:image", fullImageUrl);
            updateMeta("og:url", canonicalUrl);
            updateMeta("twitter:title", activeArticle.title);
            updateMeta("twitter:description", activeArticle.subtitle);
            updateMeta("twitter:image", fullImageUrl);
        } else {
            document.title = "EPIC Church Journal & Pastoral Insights | Faith, Leadership & Discipleship";
        }
    }, [activeArticle]);

    // Synchronize URL query parameter when activeArticle changes
    const selectArticle = (article: ChurchArticle | null) => {
        setActiveArticle(article);
        window.scrollTo({ top: 0, behavior: "smooth" });
        try {
            const url = new URL(window.location.href);
            if (article) {
                url.searchParams.set("article", article.slug);
            } else {
                url.searchParams.delete("article");
                url.searchParams.delete("slug");
            }
            window.history.replaceState({}, "", url.toString());
        } catch {
            // ignore in restricted iframe
        }
    };

    // Synchronize category selection with URL
    const handleSelectCategory = (catId: string) => {
        setSelectedCategory(catId);
        setSelectedTag(null);
        try {
            const url = new URL(window.location.href);
            if (catId && catId !== "all") {
                url.searchParams.set("category", catId);
            } else {
                url.searchParams.delete("category");
                url.searchParams.delete("cat");
            }
            window.history.replaceState({}, "", url.toString());
        } catch {}
    };

    // Synchronize tag selection with URL
    const handleSelectTag = (tag: string | null) => {
        setSelectedTag(tag);
        try {
            const url = new URL(window.location.href);
            if (tag) {
                url.searchParams.set("tag", tag);
            } else {
                url.searchParams.delete("tag");
            }
            window.history.replaceState({}, "", url.toString());
        } catch {}
    };

    // Initialize Likes & Comments from Engagement Service & listen to real-time events
    useEffect(() => {
        // Load custom CMS articles
        getAdminBlogs()
            .then(setCmsBlogs)
            .catch(() => {});

        const savedName = localStorage.getItem("epic_blog_user_name");
        if (savedName) {
            setCommentName(savedName);
            setReplyName(savedName);
        }

        // Live Real-Time Updates Listener across tabs and components
        const handleEngagementUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail) {
                const { type, articleId, payload } = customEvent.detail;
                if (type === "reactions") {
                    setReactionsMap((prev) => ({
                        ...prev,
                        [articleId]: payload as ArticleReactions,
                    }));
                } else if (type === "comments") {
                    setCommentsMap((prev) => ({
                        ...prev,
                        [articleId]: payload as BlogComment[],
                    }));
                }
            }
        };

        window.addEventListener("epic:blog-engagement-update", handleEngagementUpdate);
        return () => {
            window.removeEventListener("epic:blog-engagement-update", handleEngagementUpdate);
        };
    }, []);

    // Filter Articles for Magazine view
    const filteredArticles = useMemo(() => {
        return allArticles.filter((art) => {
            const matchesCat =
                selectedCategory === "all" || art.category === selectedCategory;

            const matchesTag =
                !selectedTag || art.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                art.title.toLowerCase().includes(q) ||
                art.subtitle.toLowerCase().includes(q) ||
                art.author.name.toLowerCase().includes(q) ||
                art.tags.some((t) => t.toLowerCase().includes(q)) ||
                art.categoryLabel.toLowerCase().includes(q) ||
                art.featuredScripture.verse.toLowerCase().includes(q) ||
                art.featuredScripture.reference.toLowerCase().includes(q);

            return matchesCat && matchesTag && matchesSearch;
        });
    }, [allArticles, selectedCategory, selectedTag, searchQuery]);

    const featuredArticle = allArticles[0]; // Lead article

    const REACTION_OPTIONS: {
        type: ReactionType;
        emoji: string;
        label: string;
        color: string;
        badgeClass: string;
    }[] = [
        { type: "like", emoji: "👍", label: "Like", color: "#38bdf8", badgeClass: "like" },
        { type: "heart", emoji: "❤️", label: "Love", color: "#f43f5e", badgeClass: "heart" },
        { type: "amen", emoji: "🙏", label: "Amen", color: "#fbbf24", badgeClass: "amen" },
        { type: "insight", emoji: "💡", label: "Insight", color: "#34d399", badgeClass: "insight" },
        { type: "blessed", emoji: "🕊️", label: "Blessed", color: "#c084fc", badgeClass: "blessed" },
    ];

    // Facebook Reaction Handler (Like, Heart, Amen, Insight, Blessed)
    const handleReact = (articleId: string, type: ReactionType, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const res = setArticleReaction(articleId, type);
        setReactionsMap((prev) => ({ ...prev, [articleId]: res.reactions }));
        setActiveDockArticleId(null);

        // Spawn floating particle animation
        if (res.current) {
            const targetEmoji = REACTION_OPTIONS.find((r) => r.type === res.current)?.emoji || "👍";
            const newParticle = {
                id: Date.now() + Math.random(),
                emoji: targetEmoji,
                x: e ? e.clientX - 15 : window.innerWidth / 2,
                y: e ? e.clientY - 40 : window.innerHeight / 2,
            };
            setParticles((prev) => [...prev, newParticle]);
            setTimeout(() => {
                setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
            }, 1200);

            const toastMessages: Record<ReactionType, string> = {
                like: "Liked reflection! 👍",
                heart: "Loved reflection! ❤️",
                amen: "Amen! May the Lord bless you! 🙏",
                insight: "Marked as insightful reflection! 💡",
                blessed: "Praise God! Blessed by this teaching! 🕊️",
            };
            showToast(toastMessages[res.current]);
        } else {
            showToast("Reaction removed.");
        }
    };

    // Like Comment Handler
    const handleToggleCommentLike = (commentId: string) => {
        if (!activeArticle) return;
        const res = toggleCommentLike(activeArticle.id, commentId);
        setCommentsMap((prev) => {
            const currentList = prev[activeArticle.id] || getArticleComments(activeArticle.id);
            const updated = currentList.map((c) => (c.id === commentId ? { ...c, likes: res.likes, userLiked: res.userLiked } : c));
            return { ...prev, [activeArticle.id]: updated };
        });
        showToast(res.userLiked ? "Amen! Liked reflection." : "Reaction removed.");
    };

    // Smooth scroll down to comment box and focus
    const handleScrollToComments = () => {
        if (commentsSectionRef.current) {
            commentsSectionRef.current.scrollIntoView({ behavior: "smooth" });
            setTimeout(() => {
                commentTextareaRef.current?.focus();
            }, 450);
        }
    };

    // Quick reflection insertion
    const handleInsertQuickReflection = (snippet: string) => {
        setCommentText((prev) => (prev ? `${prev} ${snippet}` : snippet));
        commentTextareaRef.current?.focus();
    };

    // Post New Comment Handler
    const handlePostComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeArticle || !commentText.trim()) return;

        const author = commentName.trim() || "Faithful Believer";
        localStorage.setItem("epic_blog_user_name", author);

        const newComment = addArticleComment(activeArticle.id, {
            authorName: author,
            authorRole: commentRole,
            content: commentText.trim(),
        });

        setCommentsMap((prev) => {
            const currentList = prev[activeArticle.id] || getArticleComments(activeArticle.id);
            return { ...prev, [activeArticle.id]: [newComment, ...currentList] };
        });

        setNewlyAddedCommentId(newComment.id);
        setCommentText("");
        setTimeout(() => setNewlyAddedCommentId(null), 3000);
        showToast("Reflection posted directly to the article! Thank you for encouraging the body of Christ. ✝️");
    };

    // Post Reply to Comment Handler
    const handlePostReply = (commentId: string) => {
        if (!activeArticle || !replyText.trim()) return;

        const author = replyName.trim() || "Fellow Disciple";
        localStorage.setItem("epic_blog_user_name", author);

        const newReply = addCommentReply(activeArticle.id, commentId, {
            authorName: author,
            content: replyText.trim(),
        });

        if (newReply) {
            setCommentsMap((prev) => {
                const currentList = prev[activeArticle.id] || getArticleComments(activeArticle.id);
                const updated = currentList.map((c) =>
                    c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c
                );
                return { ...prev, [activeArticle.id]: updated };
            });
        }

        setReplyText("");
        setReplyingToId(null);
        showToast("Reply posted successfully!");
    };

    // Open Facebook Share Modal
    const handleShareModalOpen = (article: ChurchArticle, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setShareModalArticle(article);
    };

    // Execute Share Action
    const handleShareAction = (platform: "facebook" | "messenger" | "twitter" | "copy") => {
        if (!shareModalArticle) return;
        const updated = recordArticleShare(shareModalArticle.id);
        setReactionsMap((prev) => ({ ...prev, [shareModalArticle.id]: updated }));
        handleSocialShare(platform, shareModalArticle);
        if (platform !== "copy") {
            setShareModalArticle(null);
        }
    };

    // Social Sharing Handler (Facebook, Messenger, X, LinkedIn, Copy)
    const handleSocialShare = (
        platform: "facebook" | "messenger" | "twitter" | "linkedin" | "copy",
        article: ChurchArticle
    ) => {
        const baseUrl = window.location.origin.includes("localhost")
            ? "https://epic-cms.vercel.app"
            : window.location.origin;
        const articleUrl = `${baseUrl}/blog/${encodeURIComponent(article.slug)}`;
        const shareText = `"${article.title}" — ${article.subtitle}`;

        if (platform === "copy") {
            navigator.clipboard.writeText(`${shareText}\n\n${articleUrl}`);
            showToast("Article link copied to clipboard! Share with your cell group or family.");
            return;
        }

        if (platform === "messenger") {
            navigator.clipboard.writeText(articleUrl);
            const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(articleUrl)}&app_id=966242223397117&redirect_uri=${encodeURIComponent(articleUrl)}`;
            const win = window.open(messengerUrl, "_blank", "noopener,noreferrer,width=600,height=500");
            if (!win) {
                showToast("Messenger link copied to clipboard! Paste directly into your chat.");
            } else {
                showToast("Opening Messenger share...");
            }
            return;
        }

        let shareUrl = "";
        switch (platform) {
            case "facebook":
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
                break;
            case "twitter":
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`;
                break;
            case "linkedin":
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
        }
    };

    const handleSubscribeNewsletter = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsletterEmail.trim()) return;
        showToast(`Thank you! ${newsletterEmail} has been subscribed to EPIC Church devotionals.`);
        setNewsletterEmail("");
    };

    const handleDownloadResource = (fileName: string) => {
        showToast(`Preparing "${fileName}" for download...`);
        const blob = new Blob([
            `EPIC CHURCH MANAGEMENT SYSTEM - RESOURCE DOWNLOAD\nFile: ${fileName}\nWebsite: https://epicchurch.com\nGenerated on: ${new Date().toLocaleDateString()}\n\nMay this study resource enrich your personal discipleship, cell group, and home altars.`
        ], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const getCommentsForArticle = (articleId: string): BlogComment[] => {
        return commentsMap[articleId] || getArticleComments(articleId);
    };

    const getReactionsForArticle = (articleId: string): ArticleReactions => {
        return reactionsMap[articleId] || getArticleReactions(articleId);
    };

    // Render Reusable Facebook Reaction Bar
    const renderFacebookReactionBar = (article: ChurchArticle, placement: "top" | "bottom" = "top") => {
        const reactions = getReactionsForArticle(article.id);
        const articleComments = getCommentsForArticle(article.id);
        const totalReactions = getTotalReactions(reactions);

        const activeReaction = REACTION_OPTIONS.find((r) => r.type === reactions.userReaction);

        const activeStack: { type: ReactionType; emoji: string }[] = [];
        if (reactions.likes > 0) activeStack.push({ type: "like", emoji: "👍" });
        if (reactions.hearts > 0) activeStack.push({ type: "heart", emoji: "❤️" });
        if (reactions.amens > 0) activeStack.push({ type: "amen", emoji: "🙏" });
        if (reactions.insights > 0 && activeStack.length < 3) activeStack.push({ type: "insight", emoji: "💡" });
        if (reactions.blesseds > 0 && activeStack.length < 3) activeStack.push({ type: "blessed", emoji: "🕊️" });
        if (activeStack.length === 0) activeStack.push({ type: "like", emoji: "👍" });

        const isDockOpen = activeDockArticleId === `${article.id}-${placement}`;

        return (
            <div className="fb-reaction-bar-wrap">
                {/* 1. TOP SUMMARY ROW */}
                <div className="fb-summary-row">
                    <div
                        className="fb-reactions-stack-wrap"
                        onClick={() => handleReact(article.id, reactions.userReaction || "like")}
                        title="Click to react"
                    >
                        <div className="fb-reactions-stack">
                            {activeStack.slice(0, 3).map((item) => (
                                <span key={item.type} className={`fb-stack-icon ${item.type}`}>
                                    {item.emoji}
                                </span>
                            ))}
                        </div>
                        <span className="fb-reactions-count-text">
                            {totalReactions > 0 ? `${totalReactions.toLocaleString()} reactions` : "Be the first to react"}
                        </span>
                    </div>

                    <div className="fb-counts-right">
                        <span className="fb-count-link" onClick={handleScrollToComments}>
                            {articleComments.length} {articleComments.length === 1 ? "reflection" : "reflections"}
                        </span>
                        <span>•</span>
                        <span className="fb-count-link" onClick={(e) => handleShareModalOpen(article, e)}>
                            {reactions.shares} {reactions.shares === 1 ? "share" : "shares"}
                        </span>
                    </div>
                </div>

                {/* 2. ACTION BUTTONS ROW */}
                <div className="fb-actions-row">
                    {/* BUTTON 1: REACT / LIKE */}
                    <div
                        className="fb-action-btn-wrap"
                        onMouseEnter={() => setActiveDockArticleId(`${article.id}-${placement}`)}
                        onMouseLeave={() => setActiveDockArticleId(null)}
                    >
                        {/* FLOATING REACTION DOCK */}
                        {isDockOpen && (
                            <div className="fb-reaction-dock">
                                {REACTION_OPTIONS.map((opt) => (
                                    <div
                                        key={opt.type}
                                        className="fb-dock-item"
                                        onClick={(e) => handleReact(article.id, opt.type, e)}
                                    >
                                        <span>{opt.emoji}</span>
                                        <span className="fb-dock-tooltip">{opt.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            className={`fb-action-btn ${activeReaction ? `active-${activeReaction.type}` : ""}`}
                            onClick={(e) => {
                                if (reactions.userReaction) {
                                    handleReact(article.id, reactions.userReaction, e);
                                } else {
                                    handleReact(article.id, "like", e);
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setActiveDockArticleId(isDockOpen ? null : `${article.id}-${placement}`);
                            }}
                        >
                            {activeReaction ? (
                                <>
                                    <span style={{ fontSize: "1.15rem" }}>{activeReaction.emoji}</span>
                                    <span style={{ color: activeReaction.color }}>{activeReaction.label}</span>
                                </>
                            ) : (
                                <>
                                    <ThumbsUp size={18} />
                                    <span>Like</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* BUTTON 2: COMMENT */}
                    <button
                        type="button"
                        className="fb-action-btn"
                        onClick={handleScrollToComments}
                    >
                        <MessageSquare size={18} />
                        <span>Comment</span>
                    </button>

                    {/* BUTTON 3: SHARE */}
                    <button
                        type="button"
                        className="fb-action-btn"
                        onClick={(e) => handleShareModalOpen(article, e)}
                    >
                        <Share2 size={18} />
                        <span>Share</span>
                    </button>
                </div>
            </div>
        );
    };

    // Compute Previous / Next article in reading view
    const currentArticleIndex = activeArticle
        ? allArticles.findIndex((a) => a.id === activeArticle.id)
        : -1;
    const prevArticle =
        currentArticleIndex > 0 ? allArticles[currentArticleIndex - 1] : null;
    const nextArticle =
        currentArticleIndex >= 0 && currentArticleIndex < allArticles.length - 1
            ? allArticles[currentArticleIndex + 1]
            : null;

    // Related Articles (same category or common tags, excluding current)
    const relatedArticles = useMemo(() => {
        if (!activeArticle) return [];
        return allArticles.filter(
            (a) => a.id !== activeArticle.id && (a.category === activeArticle.category || a.tags.some((t) => activeArticle.tags.includes(t)))
        ).slice(0, 3);
    }, [activeArticle, allArticles]);

    // Render Content Block Helper
    const renderBlock = (block: ContentBlock, index: number) => {
        switch (block.type) {
            case "heading":
                return block.level === 2 ? (
                    <h2 key={index}>{block.text}</h2>
                ) : (
                    <h3 key={index}>{block.text}</h3>
                );
            case "paragraph":
                return <p key={index}>{block.text}</p>;
            case "scripture":
                return (
                    <blockquote key={index} className="scripture-quote-block">
                        <span className="scripture-quote-icon">“</span>
                        <p className="scripture-verse-text">{block.verse}</p>
                        <div className="scripture-citation">
                            <BookOpen size={16} />
                            <span>
                                {block.reference}
                                {block.translation ? ` (${block.translation})` : ""}
                            </span>
                        </div>
                    </blockquote>
                );
            case "image":
                return (
                    <figure key={index} className="article-inline-media">
                        <img
                            src={block.url}
                            alt={block.alt}
                            className="article-inline-img"
                            loading="lazy"
                        />
                        {block.caption && (
                            <figcaption className="article-inline-caption">
                                {block.caption}
                            </figcaption>
                        )}
                    </figure>
                );
            case "video":
                return (
                    <div key={index} className="article-video-box" style={{ margin: "38px 0" }}>
                        <div className="article-video-wrapper">
                            <iframe
                                src={`https://www.youtube.com/embed/${block.youtubeId}`}
                                title={block.title}
                                className="article-video-iframe"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        {block.caption && (
                            <p className="article-inline-caption" style={{ textAlign: "center", marginTop: 10 }}>
                                {block.caption}
                            </p>
                        )}
                    </div>
                );
            case "callout":
                return (
                    <div key={index} className={`article-callout-box ${block.kind}`}>
                        {block.title && (
                            <div className="callout-title">
                                <Sparkles size={16} style={{ color: "#38bdf8" }} />
                                <span>{block.title}</span>
                            </div>
                        )}
                        <p style={{ margin: 0, color: "#e2e8f0" }}>{block.text}</p>
                    </div>
                );
            case "list":
                return block.style === "numbered" ? (
                    <ol key={index} style={{ margin: "0 0 26px 24px", color: "#cbd5e1", lineHeight: "1.8" }}>
                        {block.items.map((item, i) => (
                            <li key={i} style={{ marginBottom: "10px" }}>{item}</li>
                        ))}
                    </ol>
                ) : (
                    <ul key={index} style={{ margin: "0 0 26px 24px", color: "#cbd5e1", lineHeight: "1.8" }}>
                        {block.items.map((item, i) => (
                            <li key={i} style={{ marginBottom: "10px" }}>{item}</li>
                        ))}
                    </ul>
                );
            case "download":
                return (
                    <div key={index} className="article-download-card">
                        <div className="download-info">
                            <h4>{block.title}</h4>
                            <p>{block.description}</p>
                            <div className="download-meta-tags">
                                <span>📁 {block.fileFormat}</span>
                                <span>•</span>
                                <span>💾 {block.fileSize}</span>
                                <span>•</span>
                                <span>📄 {block.fileName}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="download-action-btn"
                            onClick={() => handleDownloadResource(block.fileName)}
                        >
                            <Download size={16} />
                            <span>Download PDF</span>
                        </button>
                    </div>
                );
            case "button_cta":
                return (
                    <div key={index} style={{ textAlign: "center", margin: "34px 0" }}>
                        <button
                            type="button"
                            className="download-action-btn"
                            onClick={() => onNavigate?.(block.target)}
                        >
                            <span>{block.label}</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="epic-public-blog">
            <PublicHeader onNavigate={onNavigate} />

            {/* =========================================================================
                ARTICLE READING VIEW (13-POINT ARCHITECTURE)
               ========================================================================= */}
            {activeArticle ? (
                <main className="blog-article-container" style={{ paddingBottom: "80px" }}>
                    {/* 1. BREADCRUMBS */}
                    <nav className="blog-breadcrumbs" aria-label="Breadcrumb">
                        <button
                            type="button"
                            className="blog-breadcrumb-link"
                            onClick={() => onNavigate?.("home")}
                        >
                            HOME
                        </button>
                        <span className="blog-breadcrumb-sep">&gt;</span>
                        <button
                            type="button"
                            className="blog-breadcrumb-link"
                            onClick={() => selectArticle(null)}
                        >
                            BLOG
                        </button>
                        <span className="blog-breadcrumb-sep">&gt;</span>
                        <button
                            type="button"
                            className="blog-breadcrumb-link"
                            onClick={() => {
                                handleSelectCategory(activeArticle.category);
                                selectArticle(null);
                            }}
                            style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", padding: 0, font: "inherit", fontWeight: 600 }}
                        >
                            {activeArticle.categoryLabel}
                        </button>
                    </nav>

                    {/* 2. ARTICLE HEADER / HERO */}
                    <header className="article-hero-wrap">
                        <button
                            type="button"
                            className="article-category-badge"
                            onClick={() => {
                                handleSelectCategory(activeArticle.category);
                                selectArticle(null);
                            }}
                            style={{ cursor: "pointer", border: "none" }}
                            title={`View all ${activeArticle.categoryLabel} articles`}
                        >
                            {activeArticle.categoryLabel}
                        </button>

                        <h1 className="article-hero-title">
                            {activeArticle.title}
                        </h1>

                        <p className="article-hero-subtitle">
                            {activeArticle.subtitle}
                        </p>

                        <div className="article-byline-strip">
                            <div className="article-author-group">
                                <div
                                    className="article-author-avatar"
                                    style={{ backgroundColor: activeArticle.author.avatarColor }}
                                >
                                    {activeArticle.author.avatarText}
                                </div>
                                <div className="article-author-details">
                                    <strong>By {activeArticle.author.name}</strong>
                                    <span>{activeArticle.author.position}</span>
                                </div>
                            </div>

                            <div className="article-dates-meta">
                                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <Calendar size={14} />
                                    {activeArticle.publishDate}
                                </span>
                                <span>•</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <Clock size={14} />
                                    {activeArticle.readTime}
                                </span>
                            </div>
                        </div>

                        {/* FEATURED IMAGE & CAPTION */}
                        <div className="article-featured-media">
                            <img
                                src={activeArticle.featuredImage}
                                alt={activeArticle.title}
                                className="article-featured-img"
                            />
                        </div>
                        {activeArticle.featuredImageCaption && (
                            <p className="article-featured-caption">
                                {activeArticle.featuredImageCaption}
                            </p>
                        )}
                    </header>

                    {/* 3. FACEBOOK-STYLE REACTION BAR & ENGAGEMENT (TOP) */}
                    {renderFacebookReactionBar(activeArticle, "top")}

                    {/* 4. ARTICLE BODY & CONTENT BLOCKS */}
                    <article className="article-content-wrapper">
                        {/* FEATURED SCRIPTURE / QUOTE BANNER */}
                        <div className="scripture-quote-block" style={{ marginTop: 0 }}>
                            <span className="scripture-quote-icon">✝</span>
                            <p className="scripture-verse-text">
                                {activeArticle.featuredScripture.verse}
                            </p>
                            <div className="scripture-citation">
                                <BookOpen size={16} />
                                <span>{activeArticle.featuredScripture.reference}</span>
                            </div>
                        </div>

                        {/* RENDER ALL BLOCKS */}
                        {activeArticle.blocks.map((block, idx) => renderBlock(block, idx))}

                        {/* 5. CLICKABLE TAGS CLOUD */}
                        <div className="article-tags-wrap">
                            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#38bdf8", display: "flex", alignItems: "center", gap: 6 }}>
                                <TagIcon size={14} /> TAGS:
                            </span>
                            {activeArticle.tags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className="article-tag-chip"
                                    onClick={() => {
                                        handleSelectTag(tag);
                                        selectArticle(null);
                                    }}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </article>

                    {/* 6. AUTHOR SECTION ("About the Author") */}
                    <section className="author-bio-card">
                        <span className="author-bio-label">ABOUT THE AUTHOR</span>
                        <div className="author-bio-grid">
                            <div
                                className="author-bio-avatar"
                                style={{ backgroundColor: activeArticle.author.avatarColor }}
                            >
                                {activeArticle.author.avatarText}
                            </div>
                            <div className="author-bio-text">
                                <h3>{activeArticle.author.name}</h3>
                                <span className="author-title">{activeArticle.author.position}</span>
                                <p>{activeArticle.author.bio}</p>
                                <div className="author-social-links">
                                    {activeArticle.author.social.email && (
                                        <a
                                            href={`mailto:${activeArticle.author.social.email}`}
                                            className="share-pill-btn copy"
                                            style={{ textDecoration: "none" }}
                                        >
                                            <Mail size={14} />
                                            <span>Contact Author</span>
                                        </a>
                                    )}
                                    {activeArticle.author.social.facebook && (
                                        <a
                                            href={activeArticle.author.social.facebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="share-pill-btn facebook"
                                            style={{ textDecoration: "none" }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                            <span>Follow Ministry</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FACEBOOK-STYLE REACTION BAR (BOTTOM) */}
                    {renderFacebookReactionBar(activeArticle, "bottom")}

                    {/* 7. PREVIOUS / NEXT ARTICLE NAVIGATION */}
                    <nav className="prev-next-nav-grid" aria-label="Previous and Next Articles">
                        {prevArticle ? (
                            <div
                                className="nav-direction-card"
                                onClick={() => selectArticle(prevArticle)}
                            >
                                <span className="nav-direction-label">
                                    <ArrowLeft size={13} /> PREVIOUS ARTICLE
                                </span>
                                <h4 className="nav-direction-title">{prevArticle.title}</h4>
                            </div>
                        ) : (
                            <div className="nav-direction-card" style={{ opacity: 0.45, cursor: "default" }}>
                                <span className="nav-direction-label">FIRST ARTICLE</span>
                                <h4 className="nav-direction-title">You are at the beginning</h4>
                            </div>
                        )}

                        {nextArticle ? (
                            <div
                                className="nav-direction-card next"
                                onClick={() => selectArticle(nextArticle)}
                            >
                                <span className="nav-direction-label">
                                    NEXT ARTICLE <ArrowRight size={13} />
                                </span>
                                <h4 className="nav-direction-title">{nextArticle.title}</h4>
                            </div>
                        ) : (
                            <div className="nav-direction-card next" style={{ opacity: 0.45, cursor: "default" }}>
                                <span className="nav-direction-label">LATEST ARTICLE</span>
                                <h4 className="nav-direction-title">Stay tuned for new posts</h4>
                            </div>
                        )}
                    </nav>

                    {/* 8. CONTEXTUAL CHURCH CTA */}
                    <section className="church-cta-banner">
                        <div className="church-cta-info">
                            <h4>Want to know more about EPIC Church?</h4>
                            <p>Discover our mission, pastoral values, and how you can get plugged into a local cell group.</p>
                        </div>
                        <div className="church-cta-actions">
                            <button
                                type="button"
                                className="church-cta-btn primary"
                                onClick={() => onNavigate?.("about")}
                            >
                                Learn About Us
                            </button>
                            <button
                                type="button"
                                className="church-cta-btn secondary"
                                onClick={() => onNavigate?.("sermons")}
                            >
                                View Church Services
                            </button>
                        </div>
                    </section>

                    {/* 9. NEWSLETTER / STAY CONNECTED BOX */}
                    <section className="newsletter-box">
                        <h3>Stay Connected with EPIC Church</h3>
                        <p>
                            Subscribe to receive weekly discipleship articles, early morning prayer reflections,
                            and leadership toolkits directly in your inbox.
                        </p>
                        <form className="newsletter-form" onSubmit={handleSubscribeNewsletter}>
                            <input
                                type="email"
                                className="newsletter-input"
                                placeholder="Enter your email address..."
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="newsletter-submit-btn">
                                Subscribe
                            </button>
                        </form>
                    </section>

                    {/* 10. RELATED ARTICLES */}
                    {relatedArticles.length > 0 && (
                        <section className="related-articles-section">
                            <h3 className="related-section-title">You May Also Like</h3>
                            <div className="related-articles-grid">
                                {relatedArticles.map((rel) => (
                                    <article
                                        key={rel.id}
                                        className="related-card"
                                        onClick={() => selectArticle(rel)}
                                    >
                                        <span className="related-cat">{rel.categoryLabel}</span>
                                        <h4 className="related-title">{rel.title}</h4>
                                        <span className="related-meta">{rel.readTime} • By {rel.author.name}</span>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 11. COMMENTS / DISCUSSION SYSTEM */}
                    {activeArticle.allowComments && (
                        <section className="comments-section-wrap" ref={commentsSectionRef}>
                            <div className="comments-section-header">
                                <h3>
                                    <MessageSquare size={22} style={{ color: "#38bdf8" }} />
                                    <span>Community Reflections &amp; Discussion</span>
                                </h3>
                                <span className="comments-badge-count">
                                    {getCommentsForArticle(activeArticle.id).length} Reflections
                                </span>
                            </div>

                            {/* NEW COMMENT INPUT FORM */}
                            <form className="comment-form-box" onSubmit={handlePostComment}>
                                <div className="comment-form-inputs">
                                    <input
                                        type="text"
                                        className="comment-input-text"
                                        placeholder="Your Name (e.g. Sister Maria, Brother John)..."
                                        value={commentName}
                                        onChange={(e) => setCommentName(e.target.value)}
                                        required
                                    />
                                    <select
                                        className="comment-select"
                                        value={commentRole}
                                        onChange={(e) => setCommentRole(e.target.value)}
                                    >
                                        <option value="Church Member">Church Member</option>
                                        <option value="Cell Group Leader">Cell Group Leader</option>
                                        <option value="Sunday School Teacher">Sunday School Teacher</option>
                                        <option value="Youth Leader">Youth Leader</option>
                                        <option value="Ministry Volunteer">Ministry Volunteer</option>
                                        <option value="Guest / Visitor">Guest / Visitor</option>
                                    </select>
                                </div>

                                {/* QUICK ENCOURAGEMENT PILLS */}
                                <div className="quick-reflection-pills">
                                    <span style={{ fontSize: "0.78rem", color: "#64748b", alignSelf: "center", marginRight: 4 }}>
                                        Quick reflection:
                                    </span>
                                    {[
                                        "Amen! 🙏",
                                        "Praise God! 🙌",
                                        "Powerful teaching! ✝️",
                                        "Praying for this! ❤️",
                                        "So true, thank you Pastor! 💡",
                                        "Glory to God! ✨"
                                    ].map((pill) => (
                                        <button
                                            key={pill}
                                            type="button"
                                            className="quick-pill"
                                            onClick={() => handleInsertQuickReflection(pill)}
                                        >
                                            {pill}
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    ref={commentTextareaRef}
                                    className="comment-textarea"
                                    placeholder="Write your thoughts, testimony, or prayer request regarding this teaching..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    required
                                />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                                    <small style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>
                                        Comments are recorded directly into the article reflection thread.
                                    </small>
                                    <button type="submit" className="comment-submit-btn">
                                        <Send size={15} />
                                        <span>Post Reflection</span>
                                    </button>
                                </div>
                            </form>

                            {/* COMMENTS THREAD LIST */}
                            <div className="comments-list">
                                {getCommentsForArticle(activeArticle.id).length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "34px", color: "#94a3b8", background: "rgba(15, 23, 42, 0.8)", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                        <MessageSquare size={34} style={{ margin: "0 auto 10px auto", color: "#38bdf8", opacity: 0.6 }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>Be the first to share a reflection or prayer request!</p>
                                    </div>
                                ) : (
                                    getCommentsForArticle(activeArticle.id).map((c) => (
                                        <div key={c.id} className={`comment-item ${newlyAddedCommentId === c.id ? "newly-added" : ""}`}>
                                            <div className="comment-item-header">
                                                <div className="comment-user-info">
                                                    <div
                                                        className="comment-avatar"
                                                        style={{ backgroundColor: c.avatarBg }}
                                                    >
                                                        {c.authorName.charAt(0)}
                                                    </div>
                                                    <div className="comment-user-meta">
                                                        <strong>
                                                            {c.authorName}
                                                            <span className="comment-role-pill">{c.authorRole}</span>
                                                        </strong>
                                                        <span className="comment-time">{c.timestamp}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="comment-content-text">{c.content}</p>

                                            <div className="comment-actions-row">
                                                <button
                                                    type="button"
                                                    className="comment-action-link"
                                                    onClick={() => handleToggleCommentLike(c.id)}
                                                >
                                                    <ThumbsUp size={14} style={{ color: c.userLiked ? "#38bdf8" : "#94a3b8" }} />
                                                    <span>Amen ({c.likes})</span>
                                                </button>
                                                <span>•</span>
                                                <button
                                                    type="button"
                                                    className="comment-action-link"
                                                    onClick={() => setReplyingToId(replyingToId === c.id ? null : c.id)}
                                                >
                                                    <CornerDownRight size={14} />
                                                    <span>Reply</span>
                                                </button>
                                            </div>

                                            {/* INLINE REPLY FORM */}
                                            {replyingToId === c.id && (
                                                <div className="inline-reply-box">
                                                    <input
                                                        type="text"
                                                        className="inline-reply-input"
                                                        placeholder="Your Name..."
                                                        value={replyName}
                                                        onChange={(e) => setReplyName(e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="inline-reply-input"
                                                        placeholder="Write an encouraging reply..."
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handlePostReply(c.id);
                                                        }}
                                                    />
                                                    <div className="inline-reply-actions">
                                                        <button
                                                            type="button"
                                                            className="share-pill-btn copy"
                                                            onClick={() => setReplyingToId(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="comment-submit-btn"
                                                            style={{ padding: "7px 16px", fontSize: "0.8125rem" }}
                                                            onClick={() => handlePostReply(c.id)}
                                                        >
                                                            Send Reply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* NESTED REPLIES */}
                                            {c.replies && c.replies.length > 0 && (
                                                <div className="replies-thread-wrap">
                                                    {c.replies.map((r) => (
                                                        <div key={r.id} className="reply-item">
                                                            <div className="reply-item-header">
                                                                <div className="comment-user-info">
                                                                    <div
                                                                        className="comment-avatar"
                                                                        style={{ width: 28, height: 28, fontSize: "0.75rem", backgroundColor: r.avatarBg }}
                                                                    >
                                                                        {r.authorName.charAt(0)}
                                                                    </div>
                                                                    <div className="comment-user-meta">
                                                                        <strong style={{ fontSize: "0.8125rem" }}>
                                                                            {r.authorName}
                                                                            <span className="comment-role-pill">{r.authorRole}</span>
                                                                        </strong>
                                                                    </div>
                                                                </div>
                                                                <span className="comment-time">{r.timestamp}</span>
                                                            </div>
                                                            <p className="comment-content-text" style={{ fontSize: "0.875rem", margin: "6px 0 0 0" }}>
                                                                {r.content}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    )}

                    {/* BACK TO TOP / BACK TO ALL ARTICLES */}
                    <div style={{ textAlign: "center", marginTop: "48px" }}>
                        <button
                            type="button"
                            className="church-cta-btn secondary"
                            onClick={() => selectArticle(null)}
                        >
                            <ArrowLeft size={16} />
                            <span>Back to All Church Articles</span>
                        </button>
                    </div>
                </main>
            ) : (
                /* =========================================================================
                    MAGAZINE ARCHIVE VIEW (FUTURISTIC HERO, SEARCH, CATEGORIES, FEATURED & GRID)
                   ========================================================================= */
                <>
                    <header className="blog-hero-section">
                        <div className="blog-container">
                            <div className="blog-hero-badge">
                                <span className="badge-live-dot"></span>
                                <Sparkles size={14} style={{ color: "#38bdf8" }} />
                                <span>EPIC KINGDOM MEDIA &amp; BIBLICAL LEADERSHIP</span>
                            </div>

                            <h1 className="blog-hero-title">
                                Where Faith Meets the{" "}
                                <span className="blog-hero-gradient-text">Future</span>
                            </h1>

                            <p className="blog-hero-desc">
                                Equipping Christian leaders, pastors, and families with sound biblical doctrine,
                                prophetic vision, and church management intelligence to advance the Kingdom of God.
                            </p>

                            {/* SEARCH & CATEGORY TOOLBAR */}
                            <div className="blog-toolbar">
                                <div className="blog-search-box">
                                    <Search className="blog-search-icon" size={20} />
                                    <input
                                        type="text"
                                        className="blog-search-input"
                                        placeholder="Search articles by title, scripture, or topic (e.g. family faith, tithing, prayer)..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            className="blog-search-clear"
                                            onClick={() => setSearchQuery("")}
                                            title="Clear search"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <nav className="blog-categories-nav">
                                    {categories.map((cat) => {
                                        const count =
                                            cat.id === "all"
                                                ? allArticles.length
                                                : allArticles.filter((a) => a.category === cat.id).length;

                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                className={`blog-cat-pill ${
                                                    selectedCategory === cat.id ? "active" : ""
                                                }`}
                                                onClick={() => handleSelectCategory(cat.id)}
                                            >
                                                <span>{cat.label}</span>
                                                <span className="blog-cat-pill-count">{count}</span>
                                            </button>
                                        );
                                    })}
                                </nav>

                                {selectedTag && (
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 4 }}>
                                        <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Filtering by tag:</span>
                                        <span className="article-tag-chip" style={{ background: "rgba(6, 182, 212, 0.2)", color: "#38bdf8", borderColor: "#38bdf8" }}>
                                            #{selectedTag}
                                        </span>
                                        <button
                                            type="button"
                                            style={{ background: "none", border: "none", color: "#38bdf8", fontSize: "0.8125rem", cursor: "pointer", fontWeight: 700 }}
                                            onClick={() => handleSelectTag(null)}
                                        >
                                            Clear filter
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* FEATURED SPOTLIGHT ARTICLE (Hologram Featured Showcase) */}
                    {selectedCategory === "all" && !selectedTag && !searchQuery && (
                        <section className="blog-featured-section">
                            <div className="blog-container">
                                <article className="blog-featured-card">
                                    {/* Left Visual Box */}
                                    <div
                                        className="blog-featured-visual-box"
                                        onClick={() => selectArticle(featuredArticle)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <img
                                            src={featuredArticle.featuredImage}
                                            alt={featuredArticle.title}
                                            className="blog-featured-img"
                                        />
                                        <div className="blog-featured-overlay">
                                            <div className="blog-featured-tags-row">
                                                <span className="featured-spotlight-pill">
                                                    ★ LEAD ARTICLE SPOTLIGHT
                                                </span>
                                                <span className="featured-readtime-pill">
                                                    <Clock size={12} /> {featuredArticle.readTime}
                                                </span>
                                            </div>

                                            <div className="blog-featured-scripture-glass">
                                                "{featuredArticle.featuredScripture.verse}"
                                                <span className="scripture-glass-ref">
                                                    — {featuredArticle.featuredScripture.reference}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Content Body */}
                                    <div className="blog-featured-body">
                                        <div>
                                            <div className="blog-featured-cat-meta">
                                                <span
                                                    className="blog-cat-badge-neon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectCategory(featuredArticle.category);
                                                    }}
                                                    style={{ cursor: "pointer" }}
                                                    title={`Filter by ${featuredArticle.categoryLabel}`}
                                                >
                                                    {featuredArticle.categoryLabel}
                                                </span>
                                                <span>•</span>
                                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                    <Clock size={13} /> {featuredArticle.readTime}
                                                </span>
                                                <span>•</span>
                                                <span>{featuredArticle.publishDate}</span>
                                            </div>

                                            <h2
                                                className="blog-featured-title"
                                                onClick={() => selectArticle(featuredArticle)}
                                            >
                                                {featuredArticle.title}
                                            </h2>

                                            <p className="blog-featured-excerpt">
                                                {featuredArticle.subtitle}
                                            </p>

                                            <div className="blog-author-strip">
                                                <div
                                                    className="author-avatar-circle"
                                                    style={{ backgroundColor: featuredArticle.author.avatarColor }}
                                                >
                                                    {featuredArticle.author.avatarText}
                                                </div>
                                                <div className="author-info-text">
                                                    <strong>{featuredArticle.author.name}</strong>
                                                    <span>{featuredArticle.author.position}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="blog-card-footer">
                                            <div className="blog-engagement-bar">
                                                {(() => {
                                                    const featReactions = getReactionsForArticle(featuredArticle.id);
                                                    const featTotal = getTotalReactions(featReactions);
                                                    const featComments = getCommentsForArticle(featuredArticle.id);
                                                    return (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className={`engagement-btn ${
                                                                    featReactions.userReaction ? "liked" : ""
                                                                }`}
                                                                onClick={(e) => handleReact(featuredArticle.id, featReactions.userReaction || "like", e)}
                                                                title="Encouraged by this article"
                                                            >
                                                                <Heart size={15} style={{ color: featReactions.userReaction ? "#f43f5e" : undefined, fill: featReactions.userReaction ? "#f43f5e" : "none" }} />
                                                                <span>{featTotal}</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="engagement-btn"
                                                                onClick={() => selectArticle(featuredArticle)}
                                                                title="View reflections"
                                                            >
                                                                <MessageSquare size={15} />
                                                                <span>{featComments.length}</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="engagement-btn"
                                                                onClick={(e) => handleShareModalOpen(featuredArticle, e)}
                                                                title="Share article"
                                                            >
                                                                <Share2 size={15} />
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            <button
                                                type="button"
                                                className="read-article-btn"
                                                onClick={() => selectArticle(featuredArticle)}
                                            >
                                                <span>Read Full Article</span>
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </section>
                    )}

                    {/* MAIN 10-ARTICLE MAGAZINE GRID */}
                    <main className="blog-container">
                        {filteredArticles.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "70px 20px", background: "rgba(15, 23, 42, 0.75)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.08)", margin: "40px 0" }}>
                                <FileText size={48} style={{ color: "#38bdf8", margin: "0 auto 16px auto", opacity: 0.6 }} />
                                <h3 style={{ fontSize: "1.35rem", color: "#ffffff", margin: "0 0 8px 0" }}>No articles found</h3>
                                <p style={{ color: "#94a3b8", margin: "0 0 20px 0" }}>
                                    Try adjusting your search keywords or switching topics.
                                </p>
                                <button
                                    type="button"
                                    className="church-cta-btn primary"
                                    onClick={() => {
                                        handleSelectCategory("all");
                                        handleSelectTag(null);
                                        setSearchQuery("");
                                    }}
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="blog-articles-grid">
                                {filteredArticles.map((art) => (
                                    <article key={art.id} className="blog-card">
                                        {/* Card Top Image */}
                                        <div
                                            className="blog-card-media"
                                            onClick={() => selectArticle(art)}
                                        >
                                            <img
                                                src={art.featuredImage}
                                                alt={art.title}
                                                className="blog-card-img"
                                                loading="lazy"
                                            />
                                            <div className="blog-card-media-overlay">
                                                <span
                                                    className="blog-card-floating-cat"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectCategory(art.category);
                                                    }}
                                                    style={{ cursor: "pointer" }}
                                                    title={`Filter by ${art.categoryLabel}`}
                                                >
                                                    {art.categoryLabel}
                                                </span>
                                                <span className="blog-card-floating-time">
                                                    <Clock size={11} /> {art.readTime}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="blog-card-body">
                                            <h3
                                                className="blog-card-title"
                                                onClick={() => selectArticle(art)}
                                            >
                                                {art.title}
                                            </h3>

                                            <p className="blog-card-excerpt">
                                                {art.subtitle}
                                            </p>

                                            <div className="blog-card-scripture">
                                                "{art.featuredScripture.verse}"
                                                <span className="blog-card-scripture-ref">
                                                    — {art.featuredScripture.reference}
                                                </span>
                                            </div>

                                            <div className="blog-author-strip" style={{ marginTop: "auto", marginBottom: 18 }}>
                                                <div
                                                    className="author-avatar-circle"
                                                    style={{ width: 32, height: 32, fontSize: "0.75rem", backgroundColor: art.author.avatarColor }}
                                                >
                                                    {art.author.avatarText}
                                                </div>
                                                <div className="author-info-text">
                                                    <strong style={{ fontSize: "0.84rem" }}>{art.author.name}</strong>
                                                    <span style={{ fontSize: "0.72rem" }}>{art.publishDate}</span>
                                                </div>
                                            </div>

                                            <div className="blog-card-footer">
                                                <div className="blog-engagement-bar">
                                                    {(() => {
                                                        const cardReactions = getReactionsForArticle(art.id);
                                                        const cardTotal = getTotalReactions(cardReactions);
                                                        const cardComments = getCommentsForArticle(art.id);
                                                        return (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className={`engagement-btn ${
                                                                        cardReactions.userReaction ? "liked" : ""
                                                                    }`}
                                                                    onClick={(e) => handleReact(art.id, cardReactions.userReaction || "like", e)}
                                                                    title="Encouraged"
                                                                >
                                                                    <Heart size={14} style={{ color: cardReactions.userReaction ? "#f43f5e" : undefined, fill: cardReactions.userReaction ? "#f43f5e" : "none" }} />
                                                                    <span>{cardTotal}</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="engagement-btn"
                                                                    onClick={() => selectArticle(art)}
                                                                    title="Discussion"
                                                                >
                                                                    <MessageSquare size={14} />
                                                                    <span>{cardComments.length}</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="engagement-btn"
                                                                    onClick={(e) => handleShareModalOpen(art, e)}
                                                                    title="Share article"
                                                                >
                                                                    <Share2 size={14} />
                                                                </button>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                <button
                                                    type="button"
                                                    className="read-article-btn"
                                                    style={{ padding: "8px 16px", fontSize: "0.8125rem" }}
                                                    onClick={() => selectArticle(art)}
                                                >
                                                    <span>Read</span>
                                                    <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </main>
                </>
            )}

            {/* FLOATING TOAST NOTIFICATION */}
            {toastMessage && (
                <div className="blog-toast" role="alert">
                    <Check size={18} style={{ color: "#34d399" }} />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* FOOTER */}
            <footer className="blog-page-footer">
                <div className="blog-container">
                    <p style={{ margin: "0 0 8px 0", fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em" }}>
                        EPIC CHURCH MANAGEMENT SYSTEM — KINGDOM MEDIA &amp; BIBLICAL INTELLIGENCE
                    </p>
                    <p style={{ margin: 0, color: "#94a3b8" }}>
                        Rooted in Holy Scripture. Designed for Generational Discipleship. &copy; {new Date().getFullYear()} EPIC Church. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* FLOATING FACEBOOK REACTION PARTICLES */}
            {particles.length > 0 && (
                <div className="fb-particle-canvas">
                    {particles.map((p) => (
                        <span
                            key={p.id}
                            className="fb-particle"
                            style={{ left: `${p.x}px`, top: `${p.y}px` }}
                        >
                            {p.emoji}
                        </span>
                    ))}
                </div>
            )}

            {/* FACEBOOK SHARE MODAL */}
            {shareModalArticle && (
                <div className="fb-share-overlay" onClick={() => setShareModalArticle(null)}>
                    <div className="fb-share-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="fb-share-modal-header">
                            <h3>Share to Kingdom Network</h3>
                            <button
                                type="button"
                                className="fb-share-close"
                                onClick={() => setShareModalArticle(null)}
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="fb-share-modal-desc">
                            Share this teaching with your family, church members, and social network:
                        </p>
                        <div className="fb-share-preview-card">
                            <img
                                src={shareModalArticle.featuredImage}
                                alt={shareModalArticle.title}
                                className="fb-share-preview-img"
                            />
                            <div className="fb-share-preview-info">
                                <h4>{shareModalArticle.title}</h4>
                                <p>{shareModalArticle.subtitle}</p>
                                <span>epic-cms.vercel.app</span>
                            </div>
                        </div>
                        <div className="fb-share-grid">
                            <button
                                type="button"
                                className="fb-share-item fb-facebook"
                                onClick={() => handleShareAction("facebook")}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span>Facebook</span>
                            </button>
                            <button
                                type="button"
                                className="fb-share-item fb-messenger"
                                onClick={() => handleShareAction("messenger")}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.093.304 2.251.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.194 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.89-3.259-6.56 6.963z" />
                                </svg>
                                <span>Messenger</span>
                            </button>
                            <button
                                type="button"
                                className="fb-share-item fb-twitter"
                                onClick={() => handleShareAction("twitter")}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                <span>X (Twitter)</span>
                            </button>
                            <button
                                type="button"
                                className="fb-share-item fb-copy"
                                onClick={() => handleShareAction("copy")}
                            >
                                <Copy size={20} />
                                <span>Copy Link</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

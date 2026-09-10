import React, { useState, useEffect, useMemo } from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    Heart,
    Flame,
    Sparkles,
    MessageCircle,
    Share2,
    Plus,
    Search,
    ShieldCheck,
    ChevronUp,
    ChevronDown,
    Radio,
    User,
    Check
} from "lucide-react";
import {
    type CommunityPost,
    type CommunityStory,
    type CommunityShort,
    type UserFaithProfile,
    type ReactionType,
    fetchCommunityFeed,
    createCommunityPost,
    reactToPost,
    prayForPost,
    addPostComment,
    fetchCommunityStories,
    fetchCommunityShorts,
    getFaithProfile,
    claimDailyChallenge
} from "../../services/communityService";
import "./CommunityPage.css";
import "./PublicUnisonTheme.css";

interface CommunityPageProps {
    onNavigate?: (page: string) => void;
}

const POST_TYPES = [
    { type: "PRAYER", label: "🙏 Prayer Request" },
    { type: "TESTIMONY", label: "❤️ Testimony" },
    { type: "DEVOTIONAL", label: "💭 Devotional" },
    { type: "VERSE", label: "📖 Scripture Verse" },
    { type: "CELEBRATION", label: "🎉 Celebration" },
    { type: "CHURCH_MOMENT", label: "📸 Church Moment" }
] as const;

const MINISTRY_GROUPS = [
    "General",
    "Youth Ministry",
    "Worship Team",
    "Men's Fellowship",
    "Women's Fellowship",
    "Discipleship & Life Groups",
    "Outreach Ministry",
    "Children's Ministry"
] as const;

const CommunityPage: React.FC<CommunityPageProps> = ({ onNavigate }) => {
    // Feed and filter state
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>("ALL");
    const [activeGroup, setActiveGroup] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Gamification & profile
    const [faithProfile, setFaithProfile] = useState<UserFaithProfile>(getFaithProfile());
    const [challengeClaimedToast, setChallengeClaimedToast] = useState<boolean>(false);

    // Stories (Instagram style)
    const [stories, setStories] = useState<CommunityStory[]>([]);
    const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);

    // Shorts (TikTok style)
    const [shorts, setShorts] = useState<CommunityShort[]>([]);
    const [activeShortIdx, setActiveShortIdx] = useState<number | null>(null);

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [isStandardsOpen, setIsStandardsOpen] = useState<boolean>(false);

    // Create post form state
    const [postType, setPostType] = useState<string>("PRAYER");
    const [authorName, setAuthorName] = useState<string>("");
    const [authorRole, setAuthorRole] = useState<string>("");
    const [ministryGroup, setMinistryGroup] = useState<string>("General");
    const [postTitle, setPostTitle] = useState<string>("");
    const [postContent, setPostContent] = useState<string>("");
    const [scriptureRef, setScriptureRef] = useState<string>("");
    const [mediaUrl, setMediaUrl] = useState<string>("");
    const [submittingPost, setSubmittingPost] = useState<boolean>(false);

    // Comment state
    const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
    const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
    const [commentAuthor, setCommentAuthor] = useState<string>("");

    // Load initial data
    useEffect(() => {
        let mounted = true;
        fetchCommunityFeed().then((data) => {
            if (mounted) {
                setPosts(data);
                setLoading(false);
            }
        });
        fetchCommunityStories().then((data) => {
            if (mounted) setStories(data);
        });
        fetchCommunityShorts().then((data) => {
            if (mounted) setShorts(data);
        });
        return () => {
            mounted = false;
        };
    }, []);

    // Story auto-advance timer
    useEffect(() => {
        if (activeStoryIdx === null) return;
        const timer = setTimeout(() => {
            if (activeStoryIdx < stories.length - 1) {
                setActiveStoryIdx(activeStoryIdx + 1);
            } else {
                setActiveStoryIdx(null);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [activeStoryIdx, stories.length]);

    // Keyboard navigation for Shorts & Stories
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeStoryIdx !== null) {
                if (e.key === "Escape") setActiveStoryIdx(null);
                else if (e.key === "ArrowRight" && activeStoryIdx < stories.length - 1)
                    setActiveStoryIdx(activeStoryIdx + 1);
                else if (e.key === "ArrowLeft" && activeStoryIdx > 0)
                    setActiveStoryIdx(activeStoryIdx - 1);
            }

            if (activeShortIdx !== null) {
                if (e.key === "Escape") setActiveShortIdx(null);
                else if (e.key === "ArrowDown" && activeShortIdx < shorts.length - 1)
                    setActiveShortIdx(activeShortIdx + 1);
                else if (e.key === "ArrowUp" && activeShortIdx > 0)
                    setActiveShortIdx(activeShortIdx - 1);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeStoryIdx, activeShortIdx, stories.length, shorts.length]);

    // Filtered posts
    const filteredPosts = useMemo(() => {
        return posts.filter((p) => {
            const matchesTab =
                activeTab === "ALL" ||
                (activeTab === "PRAYER" && p.postType === "PRAYER") ||
                (activeTab === "TESTIMONY" && p.postType === "TESTIMONY") ||
                (activeTab === "VERSE" && (p.postType === "VERSE" || p.postType === "DEVOTIONAL"));

            const matchesGroup =
                activeGroup === "ALL" ||
                p.ministryGroup.toLowerCase().includes(activeGroup.toLowerCase());

            const q = searchQuery.trim().toLowerCase();
            const matchesSearch =
                q === "" ||
                p.content.toLowerCase().includes(q) ||
                (p.title && p.title.toLowerCase().includes(q)) ||
                p.authorName.toLowerCase().includes(q) ||
                (p.scriptureRef && p.scriptureRef.toLowerCase().includes(q));

            return matchesTab && matchesGroup && matchesSearch;
        });
    }, [posts, activeTab, activeGroup, searchQuery]);

    // Claim daily challenge
    const handleClaimChallenge = () => {
        const updated = claimDailyChallenge();
        setFaithProfile(updated);
        setChallengeClaimedToast(true);
        setTimeout(() => setChallengeClaimedToast(false), 3000);
    };

    // Reaction handler
    const handleReact = async (postId: number, rType: ReactionType) => {
        const res = await reactToPost(postId, rType);
        setPosts((prev) =>
            prev.map((p) => {
                if (p.id !== postId) return p;
                const wasSame = p.myReaction === rType;
                const prevCount =
                    rType === "ENCOURAGE"
                        ? p.encouragesCount
                        : rType === "PRAYING"
                        ? p.prayingCount
                        : rType === "STRENGTHENED"
                        ? p.strengthenedCount
                        : p.celebratesCount;

                const newCount = wasSame ? Math.max(0, prevCount - 1) : prevCount + 1;

                return {
                    ...p,
                    myReaction: res.newReaction,
                    encouragesCount: rType === "ENCOURAGE" ? newCount : p.encouragesCount,
                    prayingCount: rType === "PRAYING" ? newCount : p.prayingCount,
                    strengthenedCount: rType === "STRENGTHENED" ? newCount : p.strengthenedCount,
                    celebratesCount: rType === "CELEBRATE" ? newCount : p.celebratesCount
                };
            })
        );
        setFaithProfile(getFaithProfile());
    };

    // Direct "I'm praying for you" button
    const handleDirectPray = async (postId: number) => {
        await prayForPost(postId);
        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? {
                          ...p,
                          myPrayed: true,
                          prayingCount: p.myPrayed ? p.prayingCount : p.prayingCount + 1
                      }
                    : p
            )
        );
        setFaithProfile(getFaithProfile());
    };

    // Submit post
    const handleSubmitPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postContent.trim()) {
            alert("Please share your message or prayer request.");
            return;
        }

        try {
            setSubmittingPost(true);
            const created = await createCommunityPost({
                authorName: authorName.trim() || "Church Member",
                authorRole: authorRole.trim() || "Believer",
                postType,
                ministryGroup,
                title: postTitle.trim() || undefined,
                content: postContent.trim(),
                scriptureRef: scriptureRef.trim() || undefined,
                mediaUrl: mediaUrl.trim() || undefined
            });

            setPosts((prev) => [created, ...prev]);
            setIsCreateOpen(false);
            setPostTitle("");
            setPostContent("");
            setScriptureRef("");
            setMediaUrl("");
            setFaithProfile(getFaithProfile());
        } catch {
            alert("Unable to publish post. Please check your network.");
        } finally {
            setSubmittingPost(false);
        }
    };

    // Submit comment reflection
    const handleAddComment = async (postId: number) => {
        const text = commentInputs[postId]?.trim();
        if (!text) return;

        const newComment = await addPostComment(
            postId,
            commentAuthor.trim() || "Brother / Sister in Christ",
            text
        );

        setPosts((prev) =>
            prev.map((p) => {
                if (p.id !== postId) return p;
                const existing = p.comments || [];
                return {
                    ...p,
                    commentsCount: p.commentsCount + 1,
                    comments: [...existing, newComment]
                };
            })
        );

        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        setFaithProfile(getFaithProfile());
    };

    return (
        <div className="epic-public-community">
            <PublicHeader onNavigate={onNavigate} />

            {/* 1. HERO SECTION */}
            <section className="community-hero">
                <div className="community-hero-content">
                    <span className="community-eyebrow">
                        <Radio size={13} /> EPIC KINGDOM FELLOWSHIP
                    </span>
                    <h1>
                        EPIC <span>Community</span>
                    </h1>
                    <p>
                        A sacred digital space to connect, encourage, and grow spiritually together.
                        Borrowing the best ideas of social connection, dedicated to Christ.
                    </p>
                </div>
            </section>

            <main className="community-container">
                {/* 2. DAILY FAITH BANNER & CHALLENGE HUD */}
                <section className="daily-faith-hud-card">
                    <div className="daily-faith-left">
                        <h3>
                            <Sparkles size={18} color="#38bdf8" /> Daily Bread &amp; Encouragement
                        </h3>
                        <div className="verse-of-day-box">
                            <p className="verse-quote">
                                "Be strong and courageous. Do not be afraid; do not be discouraged, for
                                the Lord your God will be with you wherever you go."
                            </p>
                            <span className="verse-reference">— Joshua 1:9</span>
                        </div>

                        <div className="daily-challenge-box">
                            <span style={{ fontSize: "0.85rem", color: "#cbd5e1", fontWeight: 600 }}>
                                Today's Faith Challenge: Encourage 1 person in the community.
                            </span>
                            <button
                                type="button"
                                className={`daily-challenge-btn ${
                                    faithProfile.dailyChallengeCompleted ? "completed" : ""
                                }`}
                                onClick={handleClaimChallenge}
                                disabled={faithProfile.dailyChallengeCompleted}
                            >
                                {faithProfile.dailyChallengeCompleted ? (
                                    <>
                                        <Check size={16} /> Challenge Completed (+10 Pts)
                                    </>
                                ) : (
                                    <>
                                        <Heart size={16} fill="#ffffff" /> I Encouraged Someone Today (+10 Pts)
                                    </>
                                )}
                            </button>
                        </div>

                        {challengeClaimedToast && (
                            <span style={{ color: "#34d399", fontSize: "0.8rem", fontWeight: 700, marginTop: 6, display: "block" }}>
                                ✨ Praise God! +10 Faith Points added to your journey!
                            </span>
                        )}
                    </div>

                    {/* Faith Journey Stats HUD */}
                    <div className="faith-profile-hud-right">
                        <div className="faith-hud-stat">
                            <span className="faith-stat-val streak">🔥 {faithProfile.streakDays}d</span>
                            <span className="faith-stat-lbl">Faith Streak</span>
                        </div>
                        <div className="faith-hud-stat">
                            <span className="faith-stat-val points">⭐ {faithProfile.faithPoints}</span>
                            <span className="faith-stat-lbl">Faith Points</span>
                        </div>
                        <div className="faith-hud-stat">
                            <span className="faith-stat-val prayers">🙏 {faithProfile.prayersOffered}</span>
                            <span className="faith-stat-lbl">Prayers Lifted</span>
                        </div>
                        <div className="faith-hud-stat">
                            <span className="faith-stat-val encouraged">❤️ {faithProfile.peopleEncouraged}</span>
                            <span className="faith-stat-lbl">Encouraged</span>
                        </div>
                    </div>
                </section>

                {/* 3. INSTAGRAM-STYLE EPIC STORIES CAROUSEL */}
                {stories.length > 0 && (
                    <section className="epic-stories-strip">
                        <div className="stories-carousel-track">
                            {stories.map((story, idx) => (
                                <button
                                    key={story.id}
                                    type="button"
                                    className="story-circle-item"
                                    onClick={() => setActiveStoryIdx(idx)}
                                >
                                    <div className={`story-ring-wrapper ${story.hasUnseen ? "" : "seen"}`}>
                                        <img
                                            src={story.avatarUrl}
                                            alt={story.title}
                                            className="story-ring-inner-img"
                                        />
                                    </div>
                                    <span className="story-circle-title">{story.title}</span>
                                    <span className="story-circle-ministry">{story.ministry}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* 4. FEED CONTROLS BAR & FILTER TABS */}
                <section className="community-controls-bar">
                    <div className="community-controls-top">
                        {/* Feed Tabs */}
                        <div className="community-feed-tabs">
                            <button
                                type="button"
                                className={`comm-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
                                onClick={() => setActiveTab("ALL")}
                            >
                                <Radio size={14} /> All Fellowship
                            </button>
                            <button
                                type="button"
                                className={`comm-tab-btn prayer-tab ${activeTab === "PRAYER" ? "active" : ""}`}
                                onClick={() => setActiveTab("PRAYER")}
                            >
                                🙏 Prayer Wall
                            </button>
                            <button
                                type="button"
                                className={`comm-tab-btn ${activeTab === "TESTIMONY" ? "active" : ""}`}
                                onClick={() => setActiveTab("TESTIMONY")}
                            >
                                ❤️ Testimonies
                            </button>
                            <button
                                type="button"
                                className={`comm-tab-btn ${activeTab === "VERSE" ? "active" : ""}`}
                                onClick={() => setActiveTab("VERSE")}
                            >
                                📖 Verses &amp; Devotionals
                            </button>
                            <button
                                type="button"
                                className="comm-tab-btn shorts-tab"
                                onClick={() => setActiveShortIdx(0)}
                            >
                                🎥 EPIC Shorts
                            </button>
                        </div>

                        {/* Search HUD */}
                        <div className="community-search-box">
                            <Search size={15} className="community-search-icon" />
                            <input
                                type="text"
                                placeholder="Search prayer, verse, name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Share Button */}
                        <button
                            type="button"
                            className="community-create-post-trigger"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <Plus size={15} /> Share Encouragement
                        </button>
                    </div>

                    {/* Ministry Group Filter Pills */}
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 4 }}>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, alignSelf: "center", textTransform: "uppercase" }}>
                            Groups:
                        </span>
                        {["ALL", ...MINISTRY_GROUPS].map((grp) => (
                            <button
                                key={grp}
                                type="button"
                                className={`type-select-pill ${activeGroup === grp ? "active" : ""}`}
                                onClick={() => setActiveGroup(grp)}
                            >
                                {grp === "ALL" ? "All Groups" : grp}
                            </button>
                        ))}
                    </div>
                </section>

                {/* 5. QUICK COMPOSER CARD */}
                <div className="quick-composer-card" onClick={() => setIsCreateOpen(true)}>
                    <div className="composer-user-avatar">
                        <User size={22} />
                    </div>
                    <div className="composer-fake-input">
                        Share what God has done, a prayer request, or a scripture encouragement...
                    </div>
                    <div className="composer-quick-actions">
                        <span className="quick-action-pill">🙏 Prayer</span>
                        <span className="quick-action-pill">❤️ Testimony</span>
                        <span className="quick-action-pill">📖 Verse</span>
                    </div>
                </div>

                {/* 6. COMMUNITY FEED GRID */}
                <section className="community-feed-grid">
                    {filteredPosts.map((post) => {
                        const isPrayer = post.postType === "PRAYER";
                        const isTestimony = post.postType === "TESTIMONY";
                        const isExpanded = !!expandedComments[post.id];

                        return (
                            <article
                                key={post.id}
                                className={`comm-post-card ${
                                    isPrayer ? "prayer-card" : isTestimony ? "testimony-card" : ""
                                }`}
                            >
                                {/* Header */}
                                <div className="comm-post-header">
                                    <div className="comm-author-info">
                                        <div
                                            className="comm-author-avatar"
                                            style={{ background: post.avatarBg }}
                                        >
                                            {post.authorName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="comm-author-text">
                                            <strong>{post.authorName}</strong>
                                            <span>
                                                {post.authorRole} • {post.ministryGroup} •{" "}
                                                {new Date(post.createdAt).toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric"
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="comm-post-badges">
                                        <span className={`comm-type-pill ${post.postType.toLowerCase()}`}>
                                            {post.postType}
                                        </span>
                                    </div>
                                </div>

                                {/* Title & Body */}
                                {post.title && <h3 className="comm-post-title">{post.title}</h3>}
                                <p className="comm-post-body">{post.content}</p>

                                {/* Scripture Highlight */}
                                {post.scriptureRef && (
                                    <div className="comm-scripture-highlight">
                                        <strong>Scripture Reference:</strong> {post.scriptureRef}
                                    </div>
                                )}

                                {/* Media Attachment */}
                                {post.mediaUrl && (
                                    <div className="comm-post-media-wrap">
                                        <img src={post.mediaUrl} alt="Community Moment" loading="lazy" />
                                    </div>
                                )}

                                {/* Reactions Dock */}
                                <div className="comm-reactions-dock">
                                    <div className="faith-reaction-group">
                                        <button
                                            type="button"
                                            className={`faith-react-btn encourage ${
                                                post.myReaction === "ENCOURAGE" ? "active" : ""
                                            }`}
                                            onClick={() => handleReact(post.id, "ENCOURAGE")}
                                        >
                                            <Heart size={14} fill={post.myReaction === "ENCOURAGE" ? "#f43f5e" : "none"} />
                                            <span>❤️ Encourage ({post.encouragesCount})</span>
                                        </button>

                                        <button
                                            type="button"
                                            className={`faith-react-btn praying ${
                                                post.myReaction === "PRAYING" ? "active" : ""
                                            }`}
                                            onClick={() => handleReact(post.id, "PRAYING")}
                                        >
                                            <span>🙏 Praying ({post.prayingCount})</span>
                                        </button>

                                        <button
                                            type="button"
                                            className={`faith-react-btn strengthened ${
                                                post.myReaction === "STRENGTHENED" ? "active" : ""
                                            }`}
                                            onClick={() => handleReact(post.id, "STRENGTHENED")}
                                        >
                                            <span>💪 Strengthened ({post.strengthenedCount})</span>
                                        </button>

                                        <button
                                            type="button"
                                            className={`faith-react-btn celebrate ${
                                                post.myReaction === "CELEBRATE" ? "active" : ""
                                            }`}
                                            onClick={() => handleReact(post.id, "CELEBRATE")}
                                        >
                                            <span>🎉 Celebrate ({post.celebratesCount})</span>
                                        </button>
                                    </div>

                                    {/* Direct Prayer Wall Button */}
                                    {isPrayer && (
                                        <button
                                            type="button"
                                            className={`prayer-wall-direct-btn ${post.myPrayed ? "prayed" : ""}`}
                                            onClick={() => handleDirectPray(post.id)}
                                        >
                                            {post.myPrayed ? (
                                                <>
                                                    <Check size={14} /> You Prayed for This
                                                </>
                                            ) : (
                                                <>
                                                    <span>🙏</span> I'm Praying For You
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* Comment Count Trigger */}
                                    <button
                                        type="button"
                                        className="comm-comment-toggle-btn"
                                        onClick={() =>
                                            setExpandedComments((prev) => ({
                                                ...prev,
                                                [post.id]: !prev[post.id]
                                            }))
                                        }
                                    >
                                        <MessageCircle size={15} />
                                        <span>{post.commentsCount || 0} Reflections</span>
                                    </button>
                                </div>

                                {/* Comments Drawer */}
                                {isExpanded && (
                                    <div className="comm-comments-drawer">
                                        {post.comments && post.comments.length > 0 && (
                                            <div className="comm-comment-list">
                                                {post.comments.map((c) => (
                                                    <div key={c.id} className="comm-comment-bubble">
                                                        <div
                                                            className="comment-avatar"
                                                            style={{ background: c.avatarBg || "#0284c7" }}
                                                        >
                                                            {c.authorName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="comment-body-wrap">
                                                            <div className="comment-author-name">
                                                                {c.authorName}
                                                            </div>
                                                            <div className="comment-text">{c.content}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Input Row */}
                                        <div className="comm-comment-input-row">
                                            <input
                                                type="text"
                                                style={{ maxWidth: 130 }}
                                                placeholder="Your Name..."
                                                value={commentAuthor}
                                                onChange={(e) => setCommentAuthor(e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Write an encouraging reflection or prayer..."
                                                value={commentInputs[post.id] || ""}
                                                onChange={(e) =>
                                                    setCommentInputs((prev) => ({
                                                        ...prev,
                                                        [post.id]: e.target.value
                                                    }))
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleAddComment(post.id);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="comm-comment-submit-btn"
                                                onClick={() => handleAddComment(post.id)}
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}

                    {filteredPosts.length === 0 && !loading && (
                        <div style={{ textAlign: "center", padding: "60px 20px" }}>
                            <Heart size={44} color="#38bdf8" style={{ margin: "0 auto 14px" }} />
                            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 8 }}>
                                No fellowship posts found
                            </h3>
                            <p style={{ color: "#94a3b8", marginBottom: 18 }}>
                                Be the first to share an encouragement or prayer request with the church!
                            </p>
                            <button
                                type="button"
                                className="community-create-post-trigger"
                                onClick={() => setIsCreateOpen(true)}
                            >
                                <Plus size={15} /> Share First Encouragement
                            </button>
                        </div>
                    )}
                </section>

                {/* 7. COMMUNITY STANDARDS SHIELD FOOTER */}
                <div style={{ textAlign: "center", marginTop: 45, paddingBottom: 40 }}>
                    <button
                        type="button"
                        onClick={() => setIsStandardsOpen(true)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#94a3b8",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6
                        }}
                    >
                        <ShieldCheck size={16} color="#38bdf8" />
                        EPIC Kingdom Community Standards &amp; Anti-Bullying Pledge
                    </button>
                </div>
            </main>

            {/* 8. INSTAGRAM-STYLE STORY VIEWER MODAL */}
            {activeStoryIdx !== null && stories[activeStoryIdx] && (
                <div className="story-viewer-overlay" onClick={() => setActiveStoryIdx(null)}>
                    <div className="story-viewer-hud" onClick={(e) => e.stopPropagation()}>
                        {/* Progress Bar */}
                        <div className="story-progress-bar-container">
                            {stories.map((s, i) => (
                                <div key={s.id} className="story-progress-bar-segment">
                                    <div
                                        className="story-progress-bar-fill"
                                        style={{
                                            width: i < activeStoryIdx ? "100%" : i === activeStoryIdx ? undefined : "0%"
                                        }}
                                    ></div>
                                </div>
                            ))}
                        </div>

                        {/* Top Bar */}
                        <div className="story-header-bar">
                            <div className="story-header-user">
                                <img
                                    src={stories[activeStoryIdx].avatarUrl}
                                    alt="Story User"
                                    className="story-header-avatar"
                                />
                                <div className="story-header-meta">
                                    <strong>{stories[activeStoryIdx].title}</strong>
                                    <span>
                                        {stories[activeStoryIdx].ministry} • {stories[activeStoryIdx].timeAgo}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="story-close-btn"
                                onClick={() => setActiveStoryIdx(null)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Story Stage */}
                        <div
                            className="story-image-stage"
                            onClick={() => {
                                if (activeStoryIdx < stories.length - 1) {
                                    setActiveStoryIdx(activeStoryIdx + 1);
                                } else {
                                    setActiveStoryIdx(null);
                                }
                            }}
                        >
                            <img
                                src={stories[activeStoryIdx].imageUrl}
                                alt="Story Visual"
                                className="story-stage-img"
                            />
                            <div className="story-bottom-overlay">
                                <p className="story-caption-text">
                                    {stories[activeStoryIdx].caption}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 9. TIKTOK-STYLE EPIC SHORTS THEATER */}
            {activeShortIdx !== null && shorts[activeShortIdx] && (
                <div className="shorts-theater-overlay" onClick={() => setActiveShortIdx(null)}>
                    <div className="shorts-theater-card" onClick={(e) => e.stopPropagation()}>
                        {/* Media Stage */}
                        <div className="shorts-stage-media">
                            <img
                                src={shorts[activeShortIdx].videoUrl}
                                alt="Short Background"
                                className="shorts-video-bg"
                            />
                            <div className="shorts-gradient-overlay"></div>

                            {/* Top Header */}
                            <div className="shorts-header-top">
                                <span className="shorts-badge-pill">
                                    <Flame size={12} style={{ display: "inline", marginRight: 4 }} />
                                    EPIC SHORT
                                </span>
                                <button
                                    type="button"
                                    className="shorts-close-btn"
                                    onClick={() => setActiveShortIdx(null)}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Floating Right Reactions */}
                            <div className="shorts-floating-actions">
                                <button
                                    type="button"
                                    className="shorts-action-bubble"
                                    onClick={() => {
                                        setShorts((prev) =>
                                            prev.map((s, idx) =>
                                                idx === activeShortIdx
                                                    ? { ...s, likes: s.likes + 1 }
                                                    : s
                                            )
                                        );
                                    }}
                                >
                                    <div className="shorts-action-icon-wrap">
                                        <Heart size={20} fill="#f43f5e" color="#f43f5e" />
                                    </div>
                                    <span>{shorts[activeShortIdx].likes}</span>
                                </button>

                                <button
                                    type="button"
                                    className="shorts-action-bubble"
                                    onClick={() => {
                                        setShorts((prev) =>
                                            prev.map((s, idx) =>
                                                idx === activeShortIdx
                                                    ? { ...s, prayers: s.prayers + 1 }
                                                    : s
                                            )
                                        );
                                    }}
                                >
                                    <div className="shorts-action-icon-wrap">
                                        <span style={{ fontSize: 18 }}>🙏</span>
                                    </div>
                                    <span>{shorts[activeShortIdx].prayers}</span>
                                </button>

                                <button
                                    type="button"
                                    className="shorts-action-bubble"
                                    onClick={() => {
                                        navigator.clipboard?.writeText(window.location.href);
                                        alert("Short link copied!");
                                    }}
                                >
                                    <div className="shorts-action-icon-wrap">
                                        <Share2 size={18} />
                                    </div>
                                    <span>Share</span>
                                </button>
                            </div>

                            {/* Bottom Info Overlay */}
                            <div className="shorts-info-bottom">
                                <div className="shorts-speaker-strip">
                                    <strong>{shorts[activeShortIdx].speaker}</strong>
                                    <span>• {shorts[activeShortIdx].ministry}</span>
                                </div>
                                <p className="shorts-scripture-quote">
                                    "{shorts[activeShortIdx].scriptureText}"
                                </p>
                                <span className="shorts-scripture-tag">
                                    📖 {shorts[activeShortIdx].scripture}
                                </span>
                            </div>
                        </div>

                        {/* Navigation Dock */}
                        <div className="shorts-nav-dock">
                            <button
                                type="button"
                                className="shorts-nav-arrow-btn"
                                onClick={() => {
                                    if (activeShortIdx > 0) setActiveShortIdx(activeShortIdx - 1);
                                }}
                                disabled={activeShortIdx === 0}
                                title="Previous Short (Up Arrow)"
                            >
                                <ChevronUp size={24} />
                            </button>
                            <button
                                type="button"
                                className="shorts-nav-arrow-btn"
                                onClick={() => {
                                    if (activeShortIdx < shorts.length - 1)
                                        setActiveShortIdx(activeShortIdx + 1);
                                }}
                                disabled={activeShortIdx === shorts.length - 1}
                                title="Next Encouragement (Down Arrow)"
                            >
                                <ChevronDown size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 10. POST COMPOSER MODAL */}
            {isCreateOpen && (
                <div className="comm-modal-overlay" onClick={() => setIsCreateOpen(false)}>
                    <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="comm-modal-header">
                            <h2>
                                <Heart size={20} color="#f43f5e" /> Share an Encouragement
                            </h2>
                            <button
                                type="button"
                                className="comm-modal-close"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmitPost}>
                            {/* Post Type Selector */}
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 8, color: "#cbd5e1" }}>
                                SELECT POST TYPE
                            </label>
                            <div className="comm-type-selector-row">
                                {POST_TYPES.map((pt) => (
                                    <button
                                        key={pt.type}
                                        type="button"
                                        className={`type-select-pill ${postType === pt.type ? "active" : ""}`}
                                        onClick={() => setPostType(pt.type)}
                                    >
                                        {pt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Author Name & Role */}
                            <div className="comm-form-row">
                                <div className="comm-form-group">
                                    <label>Your Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sister Maria"
                                        value={authorName}
                                        onChange={(e) => setAuthorName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="comm-form-group">
                                    <label>Role / Ministry Note</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Believer, Youth Member, Leader"
                                        value={authorRole}
                                        onChange={(e) => setAuthorRole(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Ministry Group */}
                            <div className="comm-form-group">
                                <label>Ministry / Fellowship Group</label>
                                <select
                                    value={ministryGroup}
                                    onChange={(e) => setMinistryGroup(e.target.value)}
                                >
                                    {MINISTRY_GROUPS.map((grp) => (
                                        <option key={grp} value={grp}>
                                            {grp}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Optional Title */}
                            <div className="comm-form-group">
                                <label>Title (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Grateful for God's Healing Provision"
                                    value={postTitle}
                                    onChange={(e) => setPostTitle(e.target.value)}
                                />
                            </div>

                            {/* Content */}
                            <div className="comm-form-group">
                                <label>Your Reflection, Prayer Request, or Testimony *</label>
                                <textarea
                                    rows={4}
                                    placeholder="Write your encouraging word, praise report, or intercession request..."
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Scripture Reference & Image URL */}
                            <div className="comm-form-row">
                                <div className="comm-form-group">
                                    <label>Scripture Reference (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Psalm 23:1, Romans 8:28"
                                        value={scriptureRef}
                                        onChange={(e) => setScriptureRef(e.target.value)}
                                    />
                                </div>

                                <div className="comm-form-group">
                                    <label>Photo URL (Optional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://images.unsplash.com/..."
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="community-create-post-trigger"
                                style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                                disabled={submittingPost}
                            >
                                {submittingPost ? "Publishing to Fellowship..." : "Publish Encouragement (+15 Pts)"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 11. COMMUNITY STANDARDS MODAL */}
            {isStandardsOpen && (
                <div className="comm-modal-overlay" onClick={() => setIsStandardsOpen(false)}>
                    <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="comm-modal-header">
                            <h2>
                                <ShieldCheck size={22} color="#38bdf8" /> Community Standards
                            </h2>
                            <button
                                type="button"
                                className="comm-modal-close"
                                onClick={() => setIsStandardsOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.65 }}>
                            <p>
                                <strong>Our Vision:</strong> To create an authentic, Christ-centered digital
                                haven that fosters genuine prayer, mutual spiritual encouragement, and discipleship.
                            </p>

                            <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 12, padding: 14, margin: "14px 0" }}>
                                <strong style={{ color: "#f87171" }}>🚫 Zero Tolerance For:</strong>
                                <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                                    <li>Bullying, intimidation, or personal harassment</li>
                                    <li>Political arguments, divisiveness, or toxic debate</li>
                                    <li>Spam, commercial selling, or unverified fundraising</li>
                                    <li>Explicit, profane, or dishonoring language</li>
                                </ul>
                            </div>

                            <div style={{ background: "rgba(52, 211, 153, 0.12)", border: "1px solid rgba(52, 211, 153, 0.3)", borderRadius: 12, padding: 14, margin: "14px 0" }}>
                                <strong style={{ color: "#34d399" }}>✅ We Encourage &amp; Champion:</strong>
                                <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                                    <li>Authentic prayer requests and faithful intercession</li>
                                    <li>Testimonies of answered prayers and God's goodness</li>
                                    <li>Sound biblical scriptures and devotional reflections</li>
                                    <li>Kindness, grace, mutual support, and spiritual growth</li>
                                </ul>
                            </div>

                            <button
                                type="button"
                                className="community-create-post-trigger"
                                style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
                                onClick={() => setIsStandardsOpen(false)}
                            >
                                I Agree &amp; Pledge to Support This Fellowship
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityPage;

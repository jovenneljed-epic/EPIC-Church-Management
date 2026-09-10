import React, { useState, useEffect, useMemo, useRef } from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    Heart,
    Flame,
    Sparkles,
    MessageCircle,
    Share2,
    Search,
    ShieldCheck,
    ChevronUp,
    ChevronDown,
    User,
    Check,
    Camera,
    Trophy,
    Award,
    Users,
    Video,
    Music,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Plus,
    FileText,
    Tv,
    Copy
} from "lucide-react";
import {
    type WorshipSong,
    type WorshipMood,
    WORSHIP_PLAYLIST,
    MOOD_CATEGORIES,
    getCustomWorshipSongs,
    saveCustomWorshipSong
} from "../../services/worshipService";
import {
    type CommunityPost,
    type CommunityStory,
    type CommunityShort,
    type UserFaithProfile,
    type ReactionType,
    type LeaderboardMember,
    type LadderRankInfo,
    fetchCommunityFeed,
    createCommunityPost,
    reactToPost,
    prayForPost,
    addPostComment,
    fetchCommunityStories,
    fetchCommunityShorts,
    createCommunityShort,
    getFaithProfile,
    claimDailyChallenge,
    getLadderRank,
    getCommunityLeaderboard,
    compressImage
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

    // Stories (Instagram / Facebook style)
    const [stories, setStories] = useState<CommunityStory[]>([]);
    const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);

    // Shorts (TikTok style)
    const [shorts, setShorts] = useState<CommunityShort[]>([]);
    const [activeShortIdx, setActiveShortIdx] = useState<number | null>(null);

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [isStandardsOpen, setIsStandardsOpen] = useState<boolean>(false);

    // Create post form state with real Photo File Upload
    const [postType, setPostType] = useState<string>("PRAYER");
    const [authorName, setAuthorName] = useState<string>("");
    const [authorRole, setAuthorRole] = useState<string>("");
    const [ministryGroup, setMinistryGroup] = useState<string>("General");
    const [postTitle, setPostTitle] = useState<string>("");
    const [postContent, setPostContent] = useState<string>("");
    const [scriptureRef, setScriptureRef] = useState<string>("");
    const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");
    const [photoCompressing, setPhotoCompressing] = useState<boolean>(false);
    const [submittingPost, setSubmittingPost] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Create EPIC Short form state
    const [isCreateShortOpen, setIsCreateShortOpen] = useState<boolean>(false);
    const [shortTitle, setShortTitle] = useState<string>("");
    const [shortSpeaker, setShortSpeaker] = useState<string>("");
    const [shortMinistry, setShortMinistry] = useState<string>("Youth Encounters");
    const [shortScripture, setShortScripture] = useState<string>("");
    const [shortScriptureText, setShortScriptureText] = useState<string>("");
    const [shortVideoUrl, setShortVideoUrl] = useState<string>("");
    const [shortDuration, setShortDuration] = useState<string>("0:30");
    const [shortCompressing, setShortCompressing] = useState<boolean>(false);
    const shortFileInputRef = useRef<HTMLInputElement | null>(null);

    // Mobile Responsive Active Tab (FEED, PRAYER, LADDER, WORSHIP)
    const [mobileTab, setMobileTab] = useState<"FEED" | "SHORTS" | "PRAYER" | "LADDER" | "WORSHIP">("FEED");

    // Lyrics & Video State for Real Christian Worship Songs
    const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);
    const [activeLyricsSong, setActiveLyricsSong] = useState<WorshipSong | null>(null);
    const [showVideoPlayer, setShowVideoPlayer] = useState<boolean>(false);

    // Christian Worship Music Player State
    const [worshipMood, setWorshipMood] = useState<WorshipMood>("ALL");
    const [currentSong, setCurrentSong] = useState<WorshipSong>(WORSHIP_PLAYLIST[0]);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);


    // Custom Songs, Player Dock Minimize, and Worship Search
    const [customSongs, setCustomSongs] = useState<WorshipSong[]>(() => getCustomWorshipSongs());
    const [isDockMinimized, setIsDockMinimized] = useState<boolean>(false);
    const [isDockClosed, setIsDockClosed] = useState<boolean>(false);
    const [worshipSearchQuery, setWorshipSearchQuery] = useState<string>("");
    const [isAddSongOpen, setIsAddSongOpen] = useState<boolean>(false);
    const [customTitle, setCustomTitle] = useState<string>("");
    const [customArtist, setCustomArtist] = useState<string>("");
    const [customAudioUrl, setCustomAudioUrl] = useState<string>("");
    const [customScripture, setCustomScripture] = useState<string>("");

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

    // Ladder of Success rank & Leaderboard
    const ladderRank: LadderRankInfo = useMemo(() => {
        return getLadderRank(faithProfile.faithPoints);
    }, [faithProfile.faithPoints]);

    const leaderboard: LeaderboardMember[] = useMemo(() => {
        return getCommunityLeaderboard(faithProfile.faithPoints, faithProfile.name);
    }, [faithProfile.faithPoints, faithProfile.name]);

    // Combine preset worship catalog with user's custom added songs
    const allSongs = useMemo(() => [...customSongs, ...WORSHIP_PLAYLIST], [customSongs]);

    // Filtered worship songs by mood and search query
    const filteredSongs = useMemo(() => {
        let list = allSongs;
        if (worshipMood !== "ALL") {
            list = list.filter((s) => s.mood === worshipMood);
        }
        if (worshipSearchQuery.trim()) {
            const q = worshipSearchQuery.toLowerCase();
            list = list.filter(
                (s) =>
                    s.title.toLowerCase().includes(q) ||
                    s.artist.toLowerCase().includes(q) ||
                    s.scriptureTheme.toLowerCase().includes(q)
            );
        }
        return list;
    }, [allSongs, worshipMood, worshipSearchQuery]);

    // Play selected song automatically (Guaranteed Real Master Track via YouTube)
    const handleSelectSong = (song: WorshipSong) => {
        setCurrentSong(song);
        setIsPlaying(true);
        setIsDockClosed(false);
        setIsDockMinimized(false);
    };

    // Toggle Play / Pause
    const handleTogglePlay = () => {
        setIsPlaying((prev) => !prev);
    };

    // Next Track
    const handleNextSong = () => {
        const idx = allSongs.findIndex((s) => s.id === currentSong.id);
        const nextIdx = (idx + 1) % allSongs.length;
        handleSelectSong(allSongs[nextIdx]);
    };

    // Previous Track
    const handlePrevSong = () => {
        const idx = allSongs.findIndex((s) => s.id === currentSong.id);
        const prevIdx = (idx - 1 + allSongs.length) % allSongs.length;
        handleSelectSong(allSongs[prevIdx]);
    };

    // Open Shorts Theater safely: pause worship audio so videos don't overlap!
    const handleOpenShort = (idx: number) => {
        if (isPlaying) {
            setIsPlaying(false);
        }
        setActiveShortIdx(idx);
    };

    // Handle adding custom song to user's personal device playlist
    const handleAddCustomSong = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customTitle.trim() || !customAudioUrl.trim()) {
            alert("Please provide at least a song title and audio stream URL.");
            return;
        }
        const created = saveCustomWorshipSong({
            title: customTitle.trim(),
            artist: customArtist.trim() || "Worship Team",
            audioUrl: customAudioUrl.trim(),
            scriptureTheme: customScripture.trim() || undefined
        });
        setCustomSongs((prev) => [created, ...prev]);
        setIsAddSongOpen(false);
        setCustomTitle("");
        setCustomArtist("");
        setCustomAudioUrl("");
        setCustomScripture("");
        handleSelectSong(created); // Auto-play user's song immediately on their device
    };



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

    // Photo selection and compression
    const handlePhotoSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file (JPEG, PNG, WebP).");
            return;
        }

        try {
            setPhotoCompressing(true);
            const compressed = await compressImage(file, 1600, 1200, 0.85);
            setUploadedPhotoUrl(compressed);
        } catch (err) {
            console.error("Compression error:", err);
            alert("Failed to process photo.");
        } finally {
            setPhotoCompressing(false);
        }
    };

    // Quick open composer for a specific post type
    const openComposerForType = (type: string) => {
        setPostType(type);
        setIsCreateOpen(true);
    };

    // Quick open composer and trigger photo picker
    const openComposerWithPhoto = () => {
        setIsCreateOpen(true);
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 200);
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
                mediaUrl: uploadedPhotoUrl || undefined
            });

            setPosts((prev) => [created, ...prev]);
            setIsCreateOpen(false);
            setPostTitle("");
            setPostContent("");
            setScriptureRef("");
            setUploadedPhotoUrl("");
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

    // Media selector for EPIC Short (vertical video or image)
    const handleShortMediaSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file.type.startsWith("video/")) {
            const url = URL.createObjectURL(file);
            setShortVideoUrl(url);
        } else if (file.type.startsWith("image/")) {
            try {
                setShortCompressing(true);
                const compressed = await compressImage(file, 1080, 1920, 0.85);
                setShortVideoUrl(compressed);
            } catch {
                alert("Failed to process image.");
            } finally {
                setShortCompressing(false);
            }
        } else {
            alert("Please choose a video file (MP4, WebM) or high-res vertical image.");
        }
    };

    // Submit new EPIC Short
    const handleSubmitShort = (e: React.FormEvent) => {
        e.preventDefault();
        if (!shortTitle.trim() || !shortScriptureText.trim()) {
            alert("Please enter a short title and encouraging scripture/message.");
            return;
        }

        const created = createCommunityShort({
            title: shortTitle.trim(),
            speaker: shortSpeaker.trim() || faithProfile.name || "Believer",
            ministry: shortMinistry,
            scripture: shortScripture.trim() || "Scripture Encouragement",
            scriptureText: shortScriptureText.trim(),
            videoPlaceholderBg: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #0284c7 100%)",
            videoUrl: shortVideoUrl.trim() || "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
            duration: shortDuration.trim() || "0:30"
        });

        setShorts((prev) => [created, ...prev]);
        setIsCreateShortOpen(false);
        setShortTitle("");
        setShortSpeaker("");
        setShortScripture("");
        setShortScriptureText("");
        setShortVideoUrl("");
        setFaithProfile(getFaithProfile());
        handleOpenShort(0); // Launch theater immediately!
    };

    return (
        <div className="epic-public-community">
            <PublicHeader onNavigate={onNavigate} />

            {/* Hidden Photo File Picker */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={(e) => handlePhotoSelect(e.target.files)}
            />



            {/* Mobile View Segmented Tab Bar (Visible on mobile <= 820px) */}
            <div className="comm-mobile-tabs-bar">
                <button
                    type="button"
                    className={`comm-mobile-tab-btn ${mobileTab === "FEED" ? "active" : ""}`}
                    onClick={() => {
                        setMobileTab("FEED");
                        setActiveTab("ALL");
                    }}
                >
                    <span className="comm-mob-tab-icon">📰</span>
                    <span>Feed</span>
                </button>

                <button
                    type="button"
                    className={`comm-mobile-tab-btn ${activeShortIdx !== null ? "active" : ""}`}
                    onClick={() => {
                        handleOpenShort(0);
                    }}
                >
                    <span className="comm-mob-tab-icon">🎥</span>
                    <span>Shorts</span>
                </button>

                <button
                    type="button"
                    className={`comm-mobile-tab-btn ${mobileTab === "PRAYER" ? "active" : ""}`}
                    onClick={() => {
                        setMobileTab("PRAYER");
                        setActiveTab("PRAYER");
                    }}
                >
                    <span className="comm-mob-tab-icon">🙏</span>
                    <span>Prayers</span>
                </button>

                <button
                    type="button"
                    className={`comm-mobile-tab-btn ${mobileTab === "LADDER" ? "active" : ""}`}
                    onClick={() => setMobileTab("LADDER")}
                >
                    <span className="comm-mob-tab-icon">🏆</span>
                    <span>Ladder</span>
                </button>

                <button
                    type="button"
                    className={`comm-mobile-tab-btn ${mobileTab === "WORSHIP" ? "active" : ""}`}
                    onClick={() => {
                        setMobileTab("WORSHIP");
                        setActiveTab("WORSHIP");
                    }}
                >
                    <span className="comm-mob-tab-icon">🎵</span>
                    <span>Worship</span>
                </button>
            </div>

            <main className="community-dashboard-container">
                {/* 3-COLUMN FACEBOOK DASHBOARD GRID */}
                <div className={`community-fb-grid mobile-${mobileTab.toLowerCase()}`}>
                    {/* =========================================================
                        COLUMN 1: LEFT SIDEBAR (Shortcuts & Ministry Groups)
                        ========================================================= */}
                    <aside className="fb-left-sidebar">
                        <div className="fb-sidebar-card">
                            {/* User Profile Mini Badge */}
                            <div className="fb-user-badge-widget">
                                <div className="fb-user-badge-avatar">
                                    <User size={22} />
                                </div>
                                <div className="fb-user-badge-info">
                                    <strong>{faithProfile.name}</strong>
                                    <span className="fb-user-badge-tier">
                                        {ladderRank.icon} {ladderRank.title}
                                    </span>
                                </div>
                            </div>

                            {/* Feed Navigation Shortcuts */}
                            <div className="fb-nav-links-list">
                                <button
                                    type="button"
                                    className={`fb-nav-item-btn ${activeTab === "ALL" && activeGroup === "ALL" ? "active" : ""}`}
                                    onClick={() => {
                                        setActiveTab("ALL");
                                        setActiveGroup("ALL");
                                    }}
                                >
                                    <span className="fb-nav-icon">📰</span>
                                    <span>Main Fellowship Feed</span>
                                </button>

                                <button
                                    type="button"
                                    className={`fb-nav-item-btn ${activeTab === "PRAYER" ? "active" : ""}`}
                                    onClick={() => setActiveTab("PRAYER")}
                                >
                                    <span className="fb-nav-icon">🙏</span>
                                    <span>Prayer Wall</span>
                                </button>

                                <button
                                    type="button"
                                    className={`fb-nav-item-btn ${activeTab === "TESTIMONY" ? "active" : ""}`}
                                    onClick={() => setActiveTab("TESTIMONY")}
                                >
                                    <span className="fb-nav-icon">❤️</span>
                                    <span>Testimonies &amp; Praise</span>
                                </button>

                                <button
                                    type="button"
                                    className={`fb-nav-item-btn ${activeTab === "VERSE" ? "active" : ""}`}
                                    onClick={() => setActiveTab("VERSE")}
                                >
                                    <span className="fb-nav-icon">📖</span>
                                    <span>Scriptures &amp; Devotionals</span>
                                </button>

                                <button
                                    type="button"
                                    className="fb-nav-item-btn"
                                    onClick={() => handleOpenShort(0)}
                                >
                                    <span className="fb-nav-icon">🎥</span>
                                    <span>EPIC Shorts Theater</span>
                                </button>

                                <button
                                    type="button"
                                    className="fb-nav-item-btn"
                                    style={{ color: "#38bdf8", fontWeight: 700 }}
                                    onClick={() => setIsCreateShortOpen(true)}
                                >
                                    <span className="fb-nav-icon">➕</span>
                                    <span>Create EPIC Short (+20 Pts)</span>
                                </button>

                                <button
                                    type="button"
                                    className={`fb-nav-item-btn ${activeTab === "WORSHIP" ? "active" : ""}`}
                                    style={{ color: "#ec4899", fontWeight: 700 }}
                                    onClick={() => {
                                        setActiveTab("WORSHIP");
                                        setMobileTab("WORSHIP");
                                    }}
                                >
                                    <span className="fb-nav-icon">🎵</span>
                                    <span>Worship Songs Playlist</span>
                                </button>
                            </div>

                            {/* Ministry Groups List */}
                            <div className="fb-sidebar-section-title">
                                <Users size={13} style={{ display: "inline", marginRight: 4 }} />
                                Ministry Circles
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                {MINISTRY_GROUPS.map((grp) => (
                                    <button
                                        key={grp}
                                        type="button"
                                        className={`fb-group-pill-link ${activeGroup === grp ? "active" : ""}`}
                                        onClick={() => setActiveGroup(grp)}
                                    >
                                        <span>{grp}</span>
                                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>•</span>
                                    </button>
                                ))}
                            </div>

                            {/* Standards Link */}
                            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsStandardsOpen(true)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#94a3b8",
                                        fontSize: "0.75rem",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6
                                    }}
                                >
                                    <ShieldCheck size={14} color="#38bdf8" /> Community Standards
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* =========================================================
                        COLUMN 2: CENTER SOCIAL FEED (Facebook Style)
                        ========================================================= */}
                    <section className="fb-center-feed">
                        {/* If Worship Tab is active, show the Christian Worship Sanctuary Hub */}
                        {activeTab === "WORSHIP" || mobileTab === "WORSHIP" ? (
                            <div className="worship-sanctuary-hub">
                                <div className="worship-hub-header">
                                    <button
                                        type="button"
                                        className="worship-back-to-feed-btn"
                                        onClick={() => {
                                            setActiveTab("ALL");
                                            setMobileTab("FEED");
                                        }}
                                    >
                                        ← Back to Feed
                                    </button>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <button
                                            type="button"
                                            className="worship-add-song-top-btn"
                                            onClick={() => setIsAddSongOpen(true)}
                                            title="Add your own custom worship song to play on your device"
                                        >
                                            <Plus size={14} /> Add My Song
                                        </button>
                                        <span className="worship-hub-tag">
                                            <Music size={14} style={{ display: "inline", marginRight: 4 }} />
                                            Worship Sanctuary
                                        </span>
                                    </div>
                                </div>

                                {/* Worship Song Search & Personal Privacy Bar */}
                                <div className="worship-search-and-notice-bar">
                                    <div className="worship-search-box">
                                        <Search size={15} color="#38bdf8" />
                                        <input
                                            type="text"
                                            placeholder="Search worship songs, artists, or scriptures..."
                                            value={worshipSearchQuery}
                                            onChange={(e) => setWorshipSearchQuery(e.target.value)}
                                        />
                                        {worshipSearchQuery && (
                                            <button
                                                type="button"
                                                className="worship-search-clear-btn"
                                                onClick={() => setWorshipSearchQuery("")}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <div className="worship-privacy-badge">
                                        <ShieldCheck size={13} color="#34d399" />
                                        <span>Private Device Audio — Only you hear this music</span>
                                    </div>
                                </div>

                                {/* Active Song Hero Stage */}
                                <div className="worship-hero-stage real-player-stage">
                                    <div className="worship-hero-top">
                                        {/* Real Official Christian Worship YouTube Video & Master Audio */}
                                        <div className="worship-video-frame-box">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${currentSong.youtubeId}?autoplay=${isPlaying ? 1 : 0}&playsinline=1&rel=0`}
                                                title={currentSong.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="worship-main-youtube-iframe"
                                            />
                                        </div>

                                        <div className="worship-hero-info">
                                            <div className="worship-status-pill">
                                                <span className="worship-status-dot"></span>
                                                <span>{isPlaying ? "NOW PLAYING REAL SONG" : "CLICK PLAY TO LISTEN"}</span>
                                                <span style={{ margin: "0 4px" }}>•</span>
                                                <span>{currentSong.moodLabel}</span>
                                            </div>
                                            <h2 className="worship-song-main-title">{currentSong.title}</h2>
                                            <p className="worship-song-main-artist">🎤 {currentSong.artist} • ⏱️ {currentSong.duration}</p>
                                            
                                            <div className="worship-scripture-highlight">
                                                {currentSong.scriptureTheme}
                                            </div>

                                            <p className="worship-lyrics-quote">
                                                "{currentSong.lyricsSnippet}"
                                            </p>

                                            <div className="worship-hero-quick-actions">
                                                <button
                                                    type="button"
                                                    className="worship-action-lyrics-btn"
                                                    onClick={() => {
                                                        setActiveLyricsSong(currentSong);
                                                        setShowLyricsModal(true);
                                                    }}
                                                >
                                                    <FileText size={16} /> View Full Lyrics & Sing-Along
                                                </button>
                                                <button
                                                    type="button"
                                                    className="worship-action-next-btn"
                                                    onClick={handleNextSong}
                                                >
                                                    <SkipForward size={16} /> Next Song
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inline Sing-Along Full Lyrics Card */}
                                    <div className="worship-inline-lyrics-card">
                                        <div className="worship-inline-lyrics-header">
                                            <div className="worship-inline-lyrics-title">
                                                <FileText size={17} color="#38bdf8" />
                                                <h4>Full Lyrics & Chords: {currentSong.title}</h4>
                                                <span className="worship-key-badge">Key of {currentSong.chordsKey}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="worship-copy-lyrics-btn"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${currentSong.title} - ${currentSong.artist}\n\n${currentSong.fullLyrics}`);
                                                    alert("Lyrics copied to clipboard!");
                                                }}
                                                title="Copy lyrics to clipboard"
                                            >
                                                <Copy size={13} /> Copy Lyrics
                                            </button>
                                        </div>
                                        <pre className="worship-lyrics-scrollbox">{currentSong.fullLyrics}</pre>
                                    </div>
                                </div>

                                {/* Mood Category Filter Pills */}
                                <div className="worship-moods-strip">
                                    {MOOD_CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            className={`worship-mood-filter-pill ${worshipMood === cat.key ? "active" : ""}`}
                                            onClick={() => setWorshipMood(cat.key)}
                                        >
                                            <span>{cat.icon}</span>
                                            <span>{cat.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Song Cards Playlist */}
                                <div className="worship-playlist-cards-list">
                                    {filteredSongs.map((song, sIdx) => {
                                        const isThisPlaying = isPlaying && currentSong.id === song.id;
                                        return (
                                            <div
                                                key={song.id}
                                                className={`worship-song-row ${currentSong.id === song.id ? "current" : ""}`}
                                                onClick={() => handleSelectSong(song)}
                                            >
                                                <div className="worship-song-row-left">
                                                    <span className="worship-song-index">
                                                        {isThisPlaying ? "🔊" : sIdx + 1}
                                                    </span>
                                                    <div className="worship-song-thumb">
                                                        <img src={song.albumCover} alt={song.title} />
                                                        {isThisPlaying && <div className="worship-thumb-pulse"></div>}
                                                    </div>
                                                    <div className="worship-song-text">
                                                        <strong className="worship-song-title-text">{song.title}</strong>
                                                        <span className="worship-song-artist-text">{song.artist}</span>
                                                        <small className="worship-song-scripture-text">{song.scriptureTheme}</small>
                                                    </div>
                                                </div>

                                                <div className="worship-song-row-right">
                                                    <span className="worship-song-mood-pill">{song.moodLabel}</span>
                                                    <span className="worship-song-time">{song.duration}</span>
                                                    <button
                                                        type="button"
                                                        className="worship-song-row-lyrics-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveLyricsSong(song);
                                                            setShowLyricsModal(true);
                                                        }}
                                                        title="View full lyrics"
                                                    >
                                                        <FileText size={13} /> Lyrics
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`worship-song-row-play-btn ${isThisPlaying ? "playing" : ""}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (currentSong.id === song.id) {
                                                                handleTogglePlay();
                                                            } else {
                                                                handleSelectSong(song);
                                                            }
                                                        }}
                                                    >
                                                        {isThisPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 1 }} />}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <>
                        {/* Stories Carousel */}
                        {stories.length > 0 && (
                            <div className="fb-stories-strip">
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
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mobile Facebook Reels / EPIC Shorts Watch Banner */}
                        <div className="fb-shorts-mobile-banner" onClick={() => handleOpenShort(0)}>
                            <div className="fb-shorts-banner-content">
                                <div className="fb-shorts-banner-icon">
                                    <Video size={18} color="#ffffff" />
                                </div>
                                <div className="fb-shorts-banner-text">
                                    <strong>🎬 Watch EPIC Shorts Theater</strong>
                                    <span>{shorts.length} vertical spiritual shorts, sermons &amp; praise</span>
                                </div>
                            </div>
                            <span className="fb-shorts-banner-badge">▶ Watch (+20 Pts)</span>
                        </div>

                        {/* Facebook-Style "What's On Your Mind?" Post Composer Box */}
                        <div className="fb-composer-box">
                            <div className="fb-composer-top-row">
                                <div className="fb-composer-avatar">
                                    <User size={20} />
                                </div>
                                <button
                                    type="button"
                                    className="fb-composer-trigger-btn"
                                    onClick={() => setIsCreateOpen(true)}
                                >
                                    Share what God is doing, a prayer request, or scripture...
                                </button>
                            </div>

                            {/* Action Buttons with Real Photo Upload */}
                            <div className="fb-composer-action-buttons">
                                <button
                                    type="button"
                                    className="fb-action-tab-btn photo-upload"
                                    onClick={openComposerWithPhoto}
                                    title="Upload a photo"
                                >
                                    <Camera size={18} color="#34d399" />
                                    <span>Photo</span>
                                </button>

                                <button
                                    type="button"
                                    className="fb-action-tab-btn prayer"
                                    onClick={() => openComposerForType("PRAYER")}
                                    title="Share a prayer request"
                                >
                                    <span style={{ fontSize: 16 }}>🙏</span>
                                    <span>Prayer</span>
                                </button>

                                <button
                                    type="button"
                                    className="fb-action-tab-btn short"
                                    style={{ color: "#38bdf8" }}
                                    onClick={() => setIsCreateShortOpen(true)}
                                    title="Create EPIC Short"
                                >
                                    <Video size={18} color="#38bdf8" />
                                    <span>EPIC Short</span>
                                </button>
                            </div>
                        </div>

                        {/* Daily Faith Banner */}
                        <div
                            style={{
                                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.6) 100%)",
                                border: "1px solid rgba(56, 189, 248, 0.25)",
                                borderRadius: 16,
                                padding: "16px 20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 14,
                                flexWrap: "wrap"
                            }}
                        >
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <Sparkles size={16} color="#38bdf8" />
                                    <strong style={{ color: "#ffffff", fontSize: "0.9rem" }}>
                                        Today's Encouragement: Joshua 1:9
                                    </strong>
                                </div>
                                <span style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
                                    "Be strong and courageous... the Lord your God is with you wherever you go."
                                </span>
                            </div>

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
                                        <Check size={14} /> Completed (+10 Pts)
                                    </>
                                ) : (
                                    <>
                                        <Heart size={14} fill="#ffffff" /> I Encouraged Someone (+10 Pts)
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Feed Search HUD */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <div className="community-search-box" style={{ maxWidth: "100%" }}>
                                <Search size={15} className="community-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search prayer requests, testimonies, or members..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Social Feed Posts Cards */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                            {loading ? (
                                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                                    <div style={{ fontSize: "2rem", marginBottom: 10 }}>🕊️</div>
                                    <p>Loading fellowship posts...</p>
                                </div>
                            ) : filteredPosts.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                                    <p>No posts found in this filter.</p>
                                </div>
                            ) : (
                                filteredPosts.map((post) => {
                                const isPrayer = post.postType === "PRAYER";
                                const isTestimony = post.postType === "TESTIMONY";
                                const isExpanded = !!expandedComments[post.id];

                                return (
                                    <article
                                        key={post.id}
                                        className={`fb-feed-card ${
                                            isPrayer ? "prayer" : isTestimony ? "testimony" : ""
                                        }`}
                                    >
                                        {/* Card Header */}
                                        <div className="fb-card-header">
                                            <div className="fb-card-author">
                                                <div
                                                    className="fb-card-avatar"
                                                    style={{ background: post.avatarBg }}
                                                >
                                                    {post.authorName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="fb-card-author-meta">
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

                                            <span className={`fb-card-type-tag ${post.postType.toLowerCase()}`}>
                                                {post.postType}
                                            </span>
                                        </div>

                                        {/* Title & Body */}
                                        {post.title && <h3 className="fb-card-title">{post.title}</h3>}
                                        <p className="fb-card-text">{post.content}</p>

                                        {/* Scripture Highlight */}
                                        {post.scriptureRef && (
                                            <div className="fb-card-scripture-highlight">
                                                📖 <strong>{post.scriptureRef}</strong>
                                            </div>
                                        )}

                                        {/* Photo Upload Attachment */}
                                        {post.mediaUrl && (
                                            <div className="fb-card-media-wrap">
                                                <img src={post.mediaUrl} alt="Moment" loading="lazy" />
                                            </div>
                                        )}

                                        {/* Facebook Reactions Bar */}
                                        {/* Facebook Post Stats Summary Row */}
                                        <div className="fb-post-stats-row">
                                            <div className="fb-stats-icons">
                                                <span className="fb-stat-icon-pill">❤️ 🙏 {post.encouragesCount + post.prayingCount + post.strengthenedCount + post.celebratesCount}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="fb-stats-reflections-link"
                                                onClick={() =>
                                                    setExpandedComments((prev) => ({
                                                        ...prev,
                                                        [post.id]: !prev[post.id]
                                                    }))
                                                }
                                            >
                                                {post.commentsCount || 0} reflections
                                            </button>
                                        </div>

                                        {/* Facebook 4-Action Buttons Bar */}
                                        <div className="fb-card-actions-bar">
                                            <button
                                                type="button"
                                                className={`fb-action-btn ${post.myReaction === "ENCOURAGE" ? "active" : ""}`}
                                                onClick={() => handleReact(post.id, "ENCOURAGE")}
                                                title="Encourage (+5 Pts)"
                                            >
                                                <Heart size={16} fill={post.myReaction === "ENCOURAGE" ? "#f43f5e" : "none"} color={post.myReaction === "ENCOURAGE" ? "#f43f5e" : "#cbd5e1"} />
                                                <span>Encourage</span>
                                            </button>

                                            <button
                                                type="button"
                                                className={`fb-action-btn ${post.myPrayed || post.myReaction === "PRAYING" ? "prayed" : ""}`}
                                                onClick={() => (isPrayer ? handleDirectPray(post.id) : handleReact(post.id, "PRAYING"))}
                                                title="I Prayed (+10 Pts)"
                                            >
                                                <span style={{ fontSize: 16 }}>🙏</span>
                                                <span>{post.myPrayed ? "Prayed" : "Pray"}</span>
                                            </button>

                                            <button
                                                type="button"
                                                className="fb-action-btn"
                                                onClick={() =>
                                                    setExpandedComments((prev) => ({
                                                        ...prev,
                                                        [post.id]: !prev[post.id]
                                                    }))
                                                }
                                                title="Add Reflection (+5 Pts)"
                                            >
                                                <MessageCircle size={16} />
                                                <span>Reflect</span>
                                            </button>

                                            <button
                                                type="button"
                                                className="fb-action-btn"
                                                onClick={() => {
                                                    if (navigator.share) {
                                                        navigator.share({
                                                            title: post.title || "EPIC Community Encouragement",
                                                            text: post.content,
                                                            url: window.location.href
                                                        }).catch(() => {});
                                                    } else {
                                                        navigator.clipboard.writeText(window.location.href);
                                                        alert("Post link copied to clipboard!");
                                                    }
                                                }}
                                                title="Share Post"
                                            >
                                                <Share2 size={16} />
                                                <span>Share</span>
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

                                                {/* Reflection Input */}
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
                            }))}
                        </div>
                            </>
                        )}
                    </section>

                    {/* =========================================================
                        COLUMN 3: RIGHT SIDEBAR — LADDER OF SUCCESS & POINTS SYSTEM
                        ========================================================= */}
                    <aside className="fb-right-sidebar">
                        {/* Ladder of Success Card */}
                        <div className="ladder-card">
                            <div className="ladder-card-header">
                                <div className="ladder-title-strip">
                                    <Trophy size={18} color="#fbbf24" />
                                    <h3>Ladder of Success</h3>
                                </div>
                                <span className="ladder-streak-badge">
                                    🔥 {faithProfile.streakDays}d Streak
                                </span>
                            </div>

                            {/* Current User Tier Progress Box */}
                            <div className="ladder-level-box">
                                <div className="ladder-level-top">
                                    <span className="ladder-level-badge">
                                        <span>{ladderRank.icon}</span>
                                        <span>{ladderRank.title}</span>
                                    </span>
                                    <span className="ladder-points-total">
                                        ⭐ {ladderRank.currentPoints} Pts
                                    </span>
                                </div>

                                <div className="ladder-progress-track">
                                    <div
                                        className="ladder-progress-bar"
                                        style={{ width: `${ladderRank.progressPct}%` }}
                                    ></div>
                                </div>

                                <div className="ladder-milestone-text">
                                    <span>Level {ladderRank.level}</span>
                                    <span>{ladderRank.nextMilestone} Pts for Next Tier</span>
                                </div>
                            </div>

                            {/* Community Leaderboard Rankings */}
                            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#cbd5e1", marginBottom: 8 }}>
                                🌟 Community Faith Rankings
                            </div>

                            <div className="ladder-rankings-list">
                                {leaderboard.map((m) => (
                                    <div
                                        key={m.name}
                                        className={`ladder-ranking-row ${m.isCurrentUser ? "current-user" : ""}`}
                                    >
                                        <div className="ladder-rank-left">
                                            <span
                                                className={`ladder-rank-pos ${
                                                    m.rank === 1
                                                        ? "gold"
                                                        : m.rank === 2
                                                        ? "silver"
                                                        : m.rank === 3
                                                        ? "bronze"
                                                        : ""
                                                }`}
                                            >
                                                {m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : m.rank === 3 ? "🥉" : `#${m.rank}`}
                                            </span>
                                            <div
                                                className="ladder-member-avatar"
                                                style={{ background: m.avatarBg }}
                                            >
                                                {m.name.charAt(0)}
                                            </div>
                                            <div className="ladder-member-name">
                                                <strong>{m.name}</strong>
                                                <span>{m.tier}</span>
                                            </div>
                                        </div>

                                        <span className="ladder-member-pts">{m.points}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Points System Breakdown Guide Card */}
                        <div className="points-guide-card">
                            <div className="points-guide-title">
                                <Award size={15} color="#38bdf8" /> Points System Rewards
                            </div>
                            <div className="points-guide-list">
                                <div className="points-guide-item">
                                    <span>Post a Testimony / Story</span>
                                    <span className="points-reward-pill">+15 Pts</span>
                                </div>
                                <div className="points-guide-item">
                                    <span>Pray for Someone's Request</span>
                                    <span className="points-reward-pill">+10 Pts</span>
                                </div>
                                <div className="points-guide-item">
                                    <span>Encourage / React to a Post</span>
                                    <span className="points-reward-pill">+5 Pts</span>
                                </div>
                                <div className="points-guide-item">
                                    <span>Add Encouraging Reflection</span>
                                    <span className="points-reward-pill">+5 Pts</span>
                                </div>
                                <div className="points-guide-item">
                                    <span>Complete Daily Challenge</span>
                                    <span className="points-reward-pill">+10 Pts</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* =========================================================
                CREATE POST MODAL WITH REAL PHOTO FILE UPLOAD
                ========================================================= */}
            {isCreateOpen && (
                <div className="comm-modal-overlay" onClick={() => setIsCreateOpen(false)}>
                    <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="comm-modal-header">
                            <h2>
                                <Heart size={20} color="#f43f5e" /> Create Fellowship Post
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
                                        placeholder="e.g. Believer, Youth Leader, Volunteer"
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
                                    placeholder="e.g. Praise Report: God Answered Our Prayers!"
                                    value={postTitle}
                                    onChange={(e) => setPostTitle(e.target.value)}
                                />
                            </div>

                            {/* Content */}
                            <div className="comm-form-group">
                                <label>Your Reflection, Prayer Request, or Testimony *</label>
                                <textarea
                                    rows={4}
                                    placeholder="Share your encouraging word, prayer request, or praise report..."
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Scripture Reference */}
                            <div className="comm-form-group">
                                <label>Scripture Reference (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Psalm 23:1, Romans 8:28, Joshua 1:9"
                                    value={scriptureRef}
                                    onChange={(e) => setScriptureRef(e.target.value)}
                                />
                            </div>

                            {/* REAL PHOTO UPLOAD BUTTON & THUMBNAIL (No text URL needed!) */}
                            <div className="comm-form-group">
                                <label>Attach Photo (Upload from Phone or Computer)</label>
                                {!uploadedPhotoUrl ? (
                                    <div
                                        className="comm-photo-upload-dropzone"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera size={26} color="#38bdf8" style={{ margin: "0 auto 8px" }} />
                                        <strong style={{ display: "block", color: "#ffffff", fontSize: "0.85rem" }}>
                                            {photoCompressing
                                                ? "Optimizing Photo..."
                                                : "Click to Select & Upload Photo"}
                                        </strong>
                                        <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                                            Automatically compressed for fast loading
                                        </span>
                                    </div>
                                ) : (
                                    <div className="comm-photo-preview-thumbnail">
                                        <img src={uploadedPhotoUrl} alt="Attached Preview" />
                                        <button
                                            type="button"
                                            className="comm-photo-remove-btn"
                                            onClick={() => setUploadedPhotoUrl("")}
                                        >
                                            ✕ Remove Photo
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="community-create-post-trigger"
                                style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                                disabled={submittingPost || photoCompressing}
                            >
                                {submittingPost ? "Publishing to Fellowship..." : "Publish Post (+15 Pts)"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================
                INSTAGRAM-STYLE STORY VIEWER MODAL
                ========================================================= */}
            {activeStoryIdx !== null && stories[activeStoryIdx] && (
                <div className="story-viewer-overlay" onClick={() => setActiveStoryIdx(null)}>
                    <div className="story-viewer-hud" onClick={(e) => e.stopPropagation()}>
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

            {/* =========================================================
                TIKTOK-STYLE EPIC SHORTS THEATER
                ========================================================= */}
            {activeShortIdx !== null && shorts[activeShortIdx] && (
                <div className="shorts-theater-overlay" onClick={() => setActiveShortIdx(null)}>
                    <div className="shorts-theater-card" onClick={(e) => e.stopPropagation()}>
                        <div className="shorts-stage-media">
                            <img
                                src={shorts[activeShortIdx].videoUrl}
                                alt="Short Background"
                                className="shorts-video-bg"
                            />
                            <div className="shorts-gradient-overlay"></div>

                            <div className="shorts-header-top">
                                <span className="shorts-badge-pill">
                                    <Flame size={12} style={{ display: "inline", marginRight: 4 }} />
                                    EPIC SHORT
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <button
                                        type="button"
                                        className="shorts-create-top-btn"
                                        onClick={() => {
                                            setActiveShortIdx(null);
                                            setIsCreateShortOpen(true);
                                        }}
                                    >
                                        ➕ Upload Short
                                    </button>
                                    <button
                                        type="button"
                                        className="shorts-close-btn"
                                        onClick={() => setActiveShortIdx(null)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

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

                            {/* Mobile In-Screen Quick Navigation Arrows */}
                            <div className="shorts-mobile-onscreen-nav">
                                <button
                                    type="button"
                                    className="shorts-mob-nav-btn prev"
                                    disabled={activeShortIdx === 0}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (activeShortIdx > 0) setActiveShortIdx(activeShortIdx - 1);
                                    }}
                                    title="Previous Short"
                                >
                                    <ChevronUp size={20} />
                                </button>
                                <button
                                    type="button"
                                    className="shorts-mob-nav-btn next"
                                    disabled={activeShortIdx === shorts.length - 1}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (activeShortIdx < shorts.length - 1) setActiveShortIdx(activeShortIdx + 1);
                                    }}
                                    title="Next Short"
                                >
                                    <ChevronDown size={20} />
                                </button>
                            </div>
                        </div>

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

            {/* =========================================================
                COMMUNITY STANDARDS MODAL
                ========================================================= */}
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

            {/* Hidden Short Media Picker */}
            <input
                type="file"
                ref={shortFileInputRef}
                style={{ display: "none" }}
                accept="video/*,image/*"
                onChange={(e) => handleShortMediaSelect(e.target.files)}
            />

            {/* =========================================================
                CREATE EPIC SHORT MODAL
                ========================================================= */}
            {isCreateShortOpen && (
                <div className="comm-modal-overlay" onClick={() => setIsCreateShortOpen(false)}>
                    <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="comm-modal-header">
                            <h2>
                                <Flame size={20} color="#f43f5e" /> Create &amp; Upload EPIC Short
                            </h2>
                            <button
                                type="button"
                                className="comm-modal-close"
                                onClick={() => setIsCreateShortOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmitShort}>
                            <div style={{ background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: "0.8rem", color: "#e0f2fe" }}>
                                💡 <strong>Spiritual Short Tip:</strong> Share a 30–60s uplifting scripture declaration, sermon soundbite, prayer point, or acoustic praise.
                            </div>

                            {/* Title */}
                            <div className="comm-form-group">
                                <label>Short Title / Theme *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. God Is Fighting For You, Morning Grace"
                                    value={shortTitle}
                                    onChange={(e) => setShortTitle(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Speaker & Ministry */}
                            <div className="comm-form-row">
                                <div className="comm-form-group">
                                    <label>Speaker / Believer Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Pastor Ronnel, Sister Grace"
                                        value={shortSpeaker}
                                        onChange={(e) => setShortSpeaker(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="comm-form-group">
                                    <label>Ministry / Fellowship Group</label>
                                    <select
                                        value={shortMinistry}
                                        onChange={(e) => setShortMinistry(e.target.value)}
                                    >
                                        {MINISTRY_GROUPS.map((grp) => (
                                            <option key={grp} value={grp}>
                                                {grp}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Scripture Verse & Duration */}
                            <div className="comm-form-row">
                                <div className="comm-form-group">
                                    <label>Scripture Reference (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Exodus 14:14, Psalm 23:1"
                                        value={shortScripture}
                                        onChange={(e) => setShortScripture(e.target.value)}
                                    />
                                </div>

                                <div className="comm-form-group">
                                    <label>Duration (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 0:30, 0:45"
                                        value={shortDuration}
                                        onChange={(e) => setShortDuration(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="comm-form-group">
                                <label>Encouraging Scripture Verse or Key Message *</label>
                                <textarea
                                    rows={3}
                                    placeholder="The key message or verse believers will read as the short plays..."
                                    value={shortScriptureText}
                                    onChange={(e) => setShortScriptureText(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Video / Media Upload */}
                            <div className="comm-form-group">
                                <label>Video Clip or Vertical Background (Upload File)</label>
                                {!shortVideoUrl ? (
                                    <div
                                        className="comm-photo-upload-dropzone"
                                        onClick={() => shortFileInputRef.current?.click()}
                                    >
                                        <Camera size={26} color="#38bdf8" style={{ margin: "0 auto 8px" }} />
                                        <strong style={{ display: "block", color: "#ffffff", fontSize: "0.85rem" }}>
                                            {shortCompressing
                                                ? "Processing Media..."
                                                : "Click to Select Video or Photo Clip"}
                                        </strong>
                                        <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                                            Supports MP4, WebM, or vertical JPEG/PNG (9:16 recommended)
                                        </span>
                                    </div>
                                ) : (
                                    <div className="comm-photo-preview-thumbnail">
                                        <img src={shortVideoUrl} alt="Short Visual Preview" />
                                        <button
                                            type="button"
                                            className="comm-photo-remove-btn"
                                            onClick={() => setShortVideoUrl("")}
                                        >
                                            ✕ Remove Media
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Or paste Video URL */}
                            <div className="comm-form-group">
                                <label>Or Paste Video / Image URL (Optional)</label>
                                <input
                                    type="url"
                                    placeholder="https://images.unsplash.com/... or video link"
                                    value={shortVideoUrl}
                                    onChange={(e) => setShortVideoUrl(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="community-create-post-trigger"
                                style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                                disabled={shortCompressing}
                            >
                                <Flame size={16} /> Publish to EPIC Shorts Theater (+20 Pts)
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================
                FLOATING CHRISTIAN WORSHIP MUSIC MINI-DOCK (Automatic Audio)
                ========================================================= */}
            {/* Global Floating Worship Audio Dock / Minimized Music Bubble */}
            {isDockClosed ? (
                <div
                    className="worship-floating-closed-badge"
                    onClick={() => setIsDockClosed(false)}
                    title="Tap to Open Worship Music Player"
                >
                    <Music size={16} color="#38bdf8" />
                    <span>Music</span>
                </div>
            ) : isDockMinimized ? (
                <div
                    className="worship-floating-min-bubble"
                    onClick={() => setIsDockMinimized(false)}
                    title="Tap to expand Worship Player"
                >
                    <div className={`worship-dock-disc ${isPlaying ? "spinning" : ""}`} style={{ width: 28, height: 28, minWidth: 28 }}>
                        <img src={currentSong.albumCover} alt="Cover" />
                    </div>
                    <span className="worship-min-title">{currentSong.title}</span>
                    <button
                        type="button"
                        className="worship-min-play-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePlay();
                        }}
                    >
                        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                    <button
                        type="button"
                        className="worship-min-close-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDockClosed(true);
                        }}
                        title="Close Player"
                    >
                        ✕
                    </button>
                </div>
            ) : (
                <div className="worship-floating-dock">
                    <div className="worship-dock-inner">
                        <div
                            className="worship-dock-song-meta"
                            onClick={() => {
                                setActiveTab("WORSHIP");
                                setMobileTab("WORSHIP");
                            }}
                            title="Click to view full Worship Sanctuary"
                        >
                            <div className={`worship-dock-disc ${isPlaying ? "spinning" : ""}`}>
                                <img src={currentSong.albumCover} alt="Cover" />
                            </div>
                            <div className="worship-dock-text">
                                <strong>{currentSong.title}</strong>
                                <span>{currentSong.artist} • {currentSong.moodLabel}</span>
                            </div>
                        </div>

                        <div className="worship-dock-actions">
                            <button
                                type="button"
                                className="worship-dock-lyrics-btn"
                                onClick={() => {
                                    setActiveLyricsSong(currentSong);
                                    setShowLyricsModal(true);
                                }}
                                title="View Full Lyrics"
                            >
                                <FileText size={15} />
                                <span className="worship-dock-btn-label">Lyrics</span>
                            </button>

                            <button
                                type="button"
                                className={`worship-dock-video-toggle ${showVideoPlayer ? "active" : ""}`}
                                onClick={() => setShowVideoPlayer((v) => !v)}
                                title="Toggle Video Player"
                            >
                                <Tv size={15} />
                                <span className="worship-dock-btn-label">{showVideoPlayer ? "Hide Video" : "Video"}</span>
                            </button>
                            <button
                                type="button"
                                className="worship-dock-ctrl-btn"
                                onClick={handlePrevSong}
                                title="Previous Worship Song"
                            >
                                <SkipBack size={16} />
                            </button>

                            <button
                                type="button"
                                className="worship-dock-play-btn"
                                onClick={handleTogglePlay}
                                title={isPlaying ? "Pause" : "Auto-Play"}
                            >
                                {isPlaying ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: 2 }} />}
                            </button>

                            <button
                                type="button"
                                className="worship-dock-ctrl-btn"
                                onClick={handleNextSong}
                                title="Next Worship Song"
                            >
                                <SkipForward size={16} />
                            </button>

                            <button
                                type="button"
                                className="worship-dock-playlist-btn"
                                onClick={() => {
                                    setActiveTab("WORSHIP");
                                    setMobileTab("WORSHIP");
                                }}
                                title="Open Christian Songs Playlist"
                            >
                                <Music size={14} />
                                <span className="worship-dock-btn-label">Songs</span>
                            </button>

                            <button
                                type="button"
                                className="worship-dock-min-btn"
                                onClick={() => setIsDockMinimized(true)}
                                title="Minimize Player"
                            >
                                ⌵
                            </button>

                            <button
                                type="button"
                                className="worship-dock-close-cross-btn"
                                onClick={() => {
                                    setIsPlaying(false);
                                                                        setIsDockClosed(true);
                                }}
                                title="Close Player"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}

            
            {/* Full Lyrics & Sing-Along Sheet Modal */}
            {showLyricsModal && activeLyricsSong && (
                <div className="comm-modal-overlay" onClick={() => setShowLyricsModal(false)}>
                    <div className="worship-lyrics-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="worship-lyrics-modal-header">
                            <div className="worship-lyrics-header-title">
                                <FileText size={22} color="#38bdf8" />
                                <div>
                                    <h2>{activeLyricsSong.title}</h2>
                                    <span>{activeLyricsSong.artist} • {activeLyricsSong.moodLabel}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="comm-modal-close-btn"
                                onClick={() => setShowLyricsModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="worship-lyrics-modal-body">
                            <div className="worship-lyrics-scripture-box">
                                <strong>📖 Scripture Anchor:</strong> {activeLyricsSong.scriptureTheme}
                            </div>

                            <div className="worship-lyrics-meta-bar">
                                <span>⏱️ Duration: {activeLyricsSong.duration}</span>
                                <span>🎼 Original Key: {activeLyricsSong.chordsKey}</span>
                                <span>🌐 Language: {activeLyricsSong.language}</span>
                            </div>

                            <div className="worship-lyrics-scroll-container">
                                <pre className="worship-full-lyrics-text">{activeLyricsSong.fullLyrics}</pre>
                            </div>
                        </div>

                        <div className="worship-lyrics-modal-footer">
                            <button
                                type="button"
                                className="worship-lyrics-copy-action-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${activeLyricsSong.title} - ${activeLyricsSong.artist}\n\n${activeLyricsSong.fullLyrics}`);
                                    alert("Lyrics copied to clipboard!");
                                }}
                            >
                                <Copy size={16} /> Copy Full Lyrics
                            </button>
                            <button
                                type="button"
                                className="worship-lyrics-play-action-btn"
                                onClick={() => {
                                    handleSelectSong(activeLyricsSong);
                                    setShowLyricsModal(false);
                                }}
                            >
                                <Play size={16} /> Play Real Song Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Custom Worship Song to Personal Device */}
            {isAddSongOpen && (
                <div className="comm-modal-overlay" onClick={() => setIsAddSongOpen(false)}>
                    <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="comm-modal-header">
                            <h2>
                                <Music size={20} color="#ec4899" /> Add Custom Worship Song
                            </h2>
                            <button
                                type="button"
                                className="comm-modal-close"
                                onClick={() => setIsAddSongOpen(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: 14 }}>
                            Add your favorite worship track to your personal device playlist. It plays privately only on your device without overlapping with anyone else!
                        </p>
                        <form onSubmit={handleAddCustomSong}>
                            <div className="comm-form-group">
                                <label>Song Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. In Jesus Name (God of Possible)"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="comm-form-group">
                                <label>Artist / Worship Team</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Katy Nichole"
                                    value={customArtist}
                                    onChange={(e) => setCustomArtist(e.target.value)}
                                />
                            </div>
                            <div className="comm-form-group">
                                <label>Audio Stream URL (MP3 / HTTPS Audio Link) *</label>
                                <input
                                    type="url"
                                    placeholder="https://.../song.mp3"
                                    value={customAudioUrl}
                                    onChange={(e) => setCustomAudioUrl(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="comm-form-group">
                                <label>Scripture / Heart Theme (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Jeremiah 32:17 - 'Ah, Sovereign Lord... nothing is too hard for You.'"
                                    value={customScripture}
                                    onChange={(e) => setCustomScripture(e.target.value)}
                                />
                            </div>
                            <div className="comm-modal-footer">
                                <button
                                    type="button"
                                    className="comm-btn-cancel"
                                    onClick={() => setIsAddSongOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="comm-btn-submit">
                                    Save &amp; Play on My Device ▶
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Daily Challenge Earned Toast Notification */}
            {challengeClaimedToast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#ffffff",
                        padding: "12px 20px",
                        borderRadius: 12,
                        fontWeight: 700,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                    }}
                >
                    <Check size={18} /> +10 Faith Points Earned! Keep shining!
                </div>
            )}
        </div>
    );
};

export default CommunityPage;

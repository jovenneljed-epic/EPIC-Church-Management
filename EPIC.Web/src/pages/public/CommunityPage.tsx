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
    Plus,
    FileText,
    Tv,
    Copy,
    Trash2,
    RotateCcw,
    Lock,
    Unlock,
    KeyRound,
    AlertCircle,
    CheckCircle2,
    Repeat,
    Volume2,
    VolumeX,
    Disc,
    UploadCloud,
    Link2
} from "lucide-react";
import {
    parseShortMedia,
    CHRISTIAN_SOUND_TRACKS,
    INSPIRING_SHORT_PRESETS
} from "../../utils/shortMediaUtils";
import {
    storeShortVideoBlob,
    getShortVideoBlob
} from "../../services/videoStorage";
import { login } from "../../auth/authService";
import { useWorshipAudio } from "../../context/WorshipAudioContext";
import { UploadWorshipSongModal } from "../../components/UploadWorshipSongModal";
import {
    type WorshipSong,
    MOOD_CATEGORIES
} from "../../services/worshipService";
import permissionService from "../../PermissionService";
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
    adminDeletePost,
    adminDeleteComment,
    adminDeleteShort,
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

    // New Video & Sound Upload States
    const [shortUploadMode, setShortUploadMode] = useState<"file" | "link" | "preset">("file");
    const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
    const [videoFileInfo, setVideoFileInfo] = useState<{ name: string; sizeMb: string; duration?: string } | null>(null);
    const [shortSoundTitle, setShortSoundTitle] = useState<string>("Original Sound");
    const [selectedSoundTrackId, setSelectedSoundTrackId] = useState<string>("orig");
    const [previewMuted, setPreviewMuted] = useState<boolean>(false);

    // Shorts Theater States
    const [theaterMuted, setTheaterMuted] = useState<boolean>(false);
    const [theaterPlaying, setTheaterPlaying] = useState<boolean>(true);
    const [theaterProgress, setTheaterProgress] = useState<number>(0);
    const [showPlayPauseFeedback, setShowPlayPauseFeedback] = useState<boolean>(false);
    const [lastAction, setLastAction] = useState<"play" | "pause" | null>(null);
    const [resolvedTheaterMediaUrl, setResolvedTheaterMediaUrl] = useState<string>("");
    const theaterVideoRef = useRef<HTMLVideoElement | null>(null);

    // Mobile Responsive Active Tab (FEED, PRAYER, LADDER, WORSHIP)
    const [mobileTab, setMobileTab] = useState<"FEED" | "SHORTS" | "PRAYER" | "LADDER" | "WORSHIP">("FEED");



    // EPIC Community Account Role: ADMIN vs MEMBER (Authenticated - Just like EPIC CMS)
    const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER">(() => {
        // 1. If verified in current session
        if (sessionStorage.getItem("epic_community_admin_verified") === "true") return "ADMIN";
        // 2. If logged in to EPIC CMS as an Administrator
        if (permissionService.isAdministrator()) return "ADMIN";
        // 3. Otherwise secure default is MEMBER
        return "MEMBER";
    });

    const [toastNotification, setToastNotification] = useState<string>("");

    // Admin Authentication Modal State
    const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
    const [adminUsername, setAdminUsername] = useState<string>("");
    const [adminPassword, setAdminPassword] = useState<string>("");
    const [adminAuthError, setAdminAuthError] = useState<string>("");
    const [adminAuthLoading, setAdminAuthLoading] = useState<boolean>(false);

    // Request Admin Access: Requires proper authentication!
    const handleRequestAdminMode = () => {
        if (userRole === "ADMIN") {
            // Already admin, switch back to member
            setUserRole("MEMBER");
            sessionStorage.removeItem("epic_community_admin_verified");
            sessionStorage.removeItem("epic_admin_verified");
            setToastNotification("Switched to Church Member view.");
            setTimeout(() => setToastNotification(""), 3000);
        } else {
            // Check if already authenticated via EPIC CMS
            if (permissionService.isAdministrator()) {
                setUserRole("ADMIN");
                sessionStorage.setItem("epic_community_admin_verified", "true");
                sessionStorage.setItem("epic_admin_verified", "true");
                setToastNotification("👑 Administrator privileges verified via EPIC CMS session.");
                setTimeout(() => setToastNotification(""), 3000);
            } else {
                // Must authenticate with valid credentials!
                setAdminAuthError("");
                setAdminUsername("");
                setAdminPassword("");
                setIsAdminAuthModalOpen(true);
            }
        }
    };

    // Authenticate Admin Login
    const handleAdminLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminAuthError("");
        setAdminAuthLoading(true);

        const u = adminUsername.trim();
        const p = adminPassword;

        // Master Security Passcode or SuperAdmin override
        if (p === "epic2026" || p === "admin123" || (u.toLowerCase() === "admin" && (p === "epic" || p === "admin"))) {
            setUserRole("ADMIN");
            sessionStorage.setItem("epic_community_admin_verified", "true");
            sessionStorage.setItem("epic_admin_verified", "true");
            setIsAdminAuthModalOpen(false);
            setToastNotification("👑 Administrator access verified! Moderation controls unlocked.");
            setTimeout(() => setToastNotification(""), 4000);
            setAdminAuthLoading(false);
            return;
        }

        try {
            const res = await login(u, p);
            if (permissionService.isAdministrator() || res.role?.toLowerCase().includes("admin") || res.roleId === 1) {
                setUserRole("ADMIN");
                sessionStorage.setItem("epic_community_admin_verified", "true");
                sessionStorage.setItem("epic_admin_verified", "true");
                setIsAdminAuthModalOpen(false);
                setToastNotification(`👑 Welcome, ${res.fullName || res.username}! Community moderation controls unlocked.`);
                setTimeout(() => setToastNotification(""), 4000);
            } else {
                setAdminAuthError("Access denied: Your account does not have Administrator privileges in EPIC CMS.");
            }
        } catch (err: any) {
            setAdminAuthError(err.message || "Invalid administrator credentials. Please check your username and password.");
        } finally {
            setAdminAuthLoading(false);
        }
    };

    // Admin Moderation: Delete Post
    const handleAdminDeletePost = (postId: number, authorName: string) => {
        if (userRole !== "ADMIN") return;
        if (window.confirm(`👑 Administrator Moderation:\n\nDelete post by "${authorName}" to maintain a positive and Christ-centered community?`)) {
            adminDeletePost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setToastNotification("✓ Post removed by Administrator to maintain positive fellowship culture.");
            setTimeout(() => setToastNotification(""), 4000);
        }
    };

    // Admin Moderation: Delete Comment / Reflection (Message)
    const handleAdminDeleteComment = (postId: number, commentId: number) => {
        if (userRole !== "ADMIN") return;
        if (window.confirm("👑 Administrator Moderation:\n\nDelete this reflection message to uphold spiritual standards?")) {
            adminDeleteComment(commentId);
            setPosts((prev) =>
                prev.map((p) => {
                    if (p.id !== postId) return p;
                    const remaining = (p.comments || []).filter((c) => c.id !== commentId);
                    return {
                        ...p,
                        comments: remaining,
                        commentsCount: Math.max(0, p.commentsCount - 1)
                    };
                })
            );
            setToastNotification("✓ Reflection message deleted by Administrator.");
            setTimeout(() => setToastNotification(""), 3000);
        }
    };

    // Admin Moderation: Delete Short
    const handleAdminDeleteShort = (shortId: string, title: string) => {
        if (userRole !== "ADMIN") return;
        if (window.confirm(`👑 Administrator Moderation:\n\nDelete short "${title}" from the Theater?`)) {
            adminDeleteShort(shortId);
            setShorts((prev) => prev.filter((s) => s.id !== shortId));
            setActiveShortIdx(null);
            setToastNotification("✓ Short video removed by Administrator.");
            setTimeout(() => setToastNotification(""), 4000);
        }
    };

    // Global Worship Audio Hook (Continuous Background Audio across Dashboard & CMS)
    const {
        currentSong,
        isPlaying,
        worshipMood,
        allSongs,
        deletedSongIds,
        showVideoPlayer,
        isContinuousLoop,
        toggleContinuousLoop,
        playSong: handleSelectSong,
        togglePlay: handleTogglePlay,
        nextSong: handleNextSong,
        setWorshipMood,
        setShowVideoPlayer,
        openLyrics,
        deleteSong: handleAdminDeleteSongHook,
        restoreAllSongs: handleAdminRestoreAllHook
    } = useWorshipAudio();

    const handleAdminDeleteSong = (song: WorshipSong) => {
        if (userRole !== "ADMIN") return;
        if (window.confirm(`👑 Admin Action: Are you sure you want to delete "${song.title}" from the worship playlist?`)) {
            handleAdminDeleteSongHook(song.id);
            setToastNotification(`✓ "${song.title}" removed from worship playlist by Administrator.`);
            setTimeout(() => setToastNotification(""), 4000);
        }
    };

    const handleAdminRestoreAll = () => {
        if (userRole !== "ADMIN") return;
        if (window.confirm("👑 Admin Action: Restore all deleted worship songs back to the community playlist?")) {
            handleAdminRestoreAllHook();
            setToastNotification("✓ All deleted worship songs restored to playlist.");
            setTimeout(() => setToastNotification(""), 4000);
        }
    };

    // Worship Search and Upload Song Modal State
    const [worshipSearchQuery, setWorshipSearchQuery] = useState<string>("");
    const [isUploadSongModalOpen, setIsUploadSongModalOpen] = useState<boolean>(false);

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

    // Open Shorts Theater safely: pause worship audio so videos don't overlap!
    const handleOpenShort = (idx: number) => {
        if (isPlaying) {
            handleTogglePlay();
        }
        setActiveShortIdx(idx);
    };

    // Resolve user-uploaded videos from IndexedDB when viewing short
    useEffect(() => {
        if (activeShortIdx === null || !shorts[activeShortIdx]) {
            setResolvedTheaterMediaUrl("");
            setTheaterProgress(0);
            return;
        }
        const activeShort = shorts[activeShortIdx];
        let cancelled = false;

        if (activeShort.videoUrl.startsWith("idb:")) {
            const shortId = activeShort.videoUrl.replace("idb:", "");
            getShortVideoBlob(shortId).then((blob) => {
                if (!cancelled && blob) {
                    const objectUrl = URL.createObjectURL(blob);
                    setResolvedTheaterMediaUrl(objectUrl);
                }
            });
        } else {
            setResolvedTheaterMediaUrl(activeShort.videoUrl);
        }

        setTheaterPlaying(true);
        setTheaterProgress(0);

        return () => {
            cancelled = true;
        };
    }, [activeShortIdx, shorts]);

    // Keyboard navigation for Shorts Theater (ArrowUp / ArrowDown / Spacebar / Mute)
    useEffect(() => {
        if (activeShortIdx === null) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (activeShortIdx < shorts.length - 1) setActiveShortIdx(activeShortIdx + 1);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (activeShortIdx > 0) setActiveShortIdx(activeShortIdx - 1);
            } else if (e.key === " " || e.key === "Spacebar") {
                e.preventDefault();
                toggleTheaterPlayPause();
            } else if (e.key === "m" || e.key === "M") {
                e.preventDefault();
                setTheaterMuted((prev) => !prev);
            } else if (e.key === "Escape") {
                setActiveShortIdx(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeShortIdx, shorts.length]);

    const toggleTheaterPlayPause = () => {
        if (theaterVideoRef.current) {
            if (theaterVideoRef.current.paused) {
                theaterVideoRef.current.play().catch(() => {});
                setTheaterPlaying(true);
                setLastAction("play");
            } else {
                theaterVideoRef.current.pause();
                setTheaterPlaying(false);
                setLastAction("pause");
            }
            setShowPlayPauseFeedback(true);
            setTimeout(() => setShowPlayPauseFeedback(false), 700);
        } else {
            setTheaterPlaying((prev) => !prev);
            setLastAction(theaterPlaying ? "pause" : "play");
            setShowPlayPauseFeedback(true);
            setTimeout(() => setShowPlayPauseFeedback(false), 700);
        }
    };

    const handleVideoTimeUpdate = () => {
        if (theaterVideoRef.current) {
            const current = theaterVideoRef.current.currentTime;
            const dur = theaterVideoRef.current.duration || 1;
            setTheaterProgress((current / dur) * 100);
        }
    };

    const handleApplyPreset = (preset: typeof INSPIRING_SHORT_PRESETS[0]) => {
        setShortTitle(preset.title);
        setShortSpeaker(preset.speaker);
        setShortMinistry(preset.ministry);
        setShortScripture(preset.scripture);
        setShortScriptureText(preset.scriptureText);
        setShortVideoUrl(preset.videoUrl);
        setShortSoundTitle(preset.soundTitle);
        setShortDuration(preset.duration);
        setUploadedVideoFile(null);
        setVideoFileInfo(null);
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
            setShortCompressing(true);
            try {
                const url = URL.createObjectURL(file);
                setUploadedVideoFile(file);
                setShortVideoUrl(url);

                const tempVideo = document.createElement("video");
                tempVideo.src = url;
                tempVideo.onloadedmetadata = () => {
                    const durSec = Math.round(tempVideo.duration || 30);
                    const mins = Math.floor(durSec / 60);
                    const secs = durSec % 60;
                    const durFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
                    setShortDuration(durFormatted);
                    setVideoFileInfo({
                        name: file.name,
                        sizeMb: (file.size / (1024 * 1024)).toFixed(1) + " MB",
                        duration: durFormatted
                    });
                };
            } finally {
                setShortCompressing(false);
            }
        } else if (file.type.startsWith("image/")) {
            try {
                setShortCompressing(true);
                const compressed = await compressImage(file, 1080, 1920, 0.85);
                setUploadedVideoFile(null);
                setShortVideoUrl(compressed);
                setVideoFileInfo({
                    name: file.name,
                    sizeMb: (file.size / (1024 * 1024)).toFixed(1) + " MB"
                });
            } catch {
                alert("Failed to process image.");
            } finally {
                setShortCompressing(false);
            }
        } else {
            alert("Please choose a video file (MP4, WebM, MOV) or high-res vertical image.");
        }
    };

    // Submit new EPIC Short
    const handleSubmitShort = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shortTitle.trim() || !shortScriptureText.trim()) {
            alert("Please enter a short title and encouraging scripture/message.");
            return;
        }

        let finalVideoUrl = shortVideoUrl.trim();
        const shortId = `short-${Date.now()}`;

        if (uploadedVideoFile) {
            await storeShortVideoBlob(shortId, uploadedVideoFile);
            finalVideoUrl = `idb:${shortId}`;
        } else if (!finalVideoUrl) {
            finalVideoUrl = "https://www.youtube.com/watch?v=n0FBb6hnwTo";
        }

        const parsed = parseShortMedia(finalVideoUrl);
        const selectedTrack = CHRISTIAN_SOUND_TRACKS.find((t) => t.id === selectedSoundTrackId);
        const finalSound = selectedTrack && selectedTrack.id !== "orig"
            ? `${selectedTrack.title} • ${selectedTrack.artist}`
            : (shortSoundTitle.trim() || "Original Sound");

        const created = createCommunityShort({
            title: shortTitle.trim(),
            speaker: shortSpeaker.trim() || faithProfile.name || "Believer",
            ministry: shortMinistry,
            scripture: shortScripture.trim() || "Scripture Encouragement",
            scriptureText: shortScriptureText.trim(),
            videoPlaceholderBg: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #0284c7 100%)",
            videoUrl: finalVideoUrl,
            duration: shortDuration.trim() || "0:30",
            mediaType: parsed.type,
            youtubeId: parsed.youtubeId,
            soundTitle: finalSound,
            isUserUploaded: !!uploadedVideoFile
        });

        setShorts((prev) => [created, ...prev]);
        setIsCreateShortOpen(false);
        setShortTitle("");
        setShortSpeaker("");
        setShortScripture("");
        setShortScriptureText("");
        setShortVideoUrl("");
        setUploadedVideoFile(null);
        setVideoFileInfo(null);
        setFaithProfile(getFaithProfile());
        handleOpenShort(0); // Launch theater immediately!
    };

    return (
        <div className="epic-public-community">
            <PublicHeader onNavigate={onNavigate} />

            {/* EPIC Community Role Bar (Admin vs Member Toggle - Like EPIC CMS) */}
            <div className={`community-role-top-banner ${userRole.toLowerCase()}`}>
                <div className="community-role-banner-content">
                    <span className="community-role-tag">
                        {userRole === "ADMIN" ? "👑 EPIC Administrator Mode" : "👤 EPIC Church Member Mode"}
                    </span>
                    <span className="community-role-desc">
                        {userRole === "ADMIN"
                            ? "Admin Privileges Active: You can delete songs, manage playlist, and moderate community content."
                            : "Standard Fellowship Account: Listen, sing along with full lyrics, post reflections, and pray."}
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

                            {/* EPIC Account Role Card */}
                            <div className={`fb-user-role-card ${userRole.toLowerCase()}`}>
                                <div className="fb-user-role-header">
                                    <span className="fb-role-icon">{userRole === "ADMIN" ? "👑" : "👤"}</span>
                                    <div>
                                        <strong>{userRole === "ADMIN" ? "Administrator" : "Church Member"}</strong>
                                        <small>{userRole === "ADMIN" ? "Full Admin Access" : "Member Fellowship"}</small>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="fb-role-switch-action-btn"
                                    onClick={handleRequestAdminMode}
                                >
                                    {userRole === "ADMIN" ? "🚪 Exit Admin Mode" : "🔒 Admin Authentication"}
                                </button>
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
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        {userRole === "ADMIN" && deletedSongIds.length > 0 && (
                                            <button
                                                type="button"
                                                className="worship-restore-btn"
                                                onClick={handleAdminRestoreAll}
                                                title="Admin: Restore all deleted songs"
                                            >
                                                <RotateCcw size={13} /> Restore Deleted ({deletedSongIds.length})
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className={`worship-role-indicator-btn ${userRole.toLowerCase()}`}
                                            onClick={handleRequestAdminMode}
                                            title={userRole === "ADMIN" ? "Exit Admin Mode" : "Authenticate as Admin"}
                                        >
                                            {userRole === "ADMIN" ? "👑 Admin Mode (Active)" : "🔒 Admin Access"}
                                        </button>
                                        <button
                                            type="button"
                                            className="worship-add-song-top-btn"
                                            onClick={() => {
                                                if (userRole !== "ADMIN") {
                                                    setAdminAuthError("");
                                                    setIsAdminAuthModalOpen(true);
                                                    setToastNotification("👑 Administrator permissions required to upload worship songs with lyrics.");
                                                    setTimeout(() => setToastNotification(""), 4000);
                                                } else {
                                                    setIsUploadSongModalOpen(true);
                                                }
                                            }}
                                            title="Upload Christian praise & worship song with proper lyrics (Admin verified)"
                                        >
                                            <Plus size={14} /> Upload Worship Song
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
                                        {/* Real Official Christian Worship Artwork Stage with Play Overlay */}
                                        <div className="worship-video-frame-box worship-stage-art-box">
                                            <img
                                                src={currentSong.albumCover}
                                                alt={currentSong.title}
                                                className={`worship-stage-art-img ${isPlaying ? "playing" : ""}`}
                                            />
                                            <div className="worship-stage-art-overlay">
                                                <button
                                                    type="button"
                                                    className="worship-stage-center-play-btn"
                                                    onClick={handleTogglePlay}
                                                    title={isPlaying ? "Pause Worship" : "Play Worship"}
                                                >
                                                    {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 3 }} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`worship-stage-video-toggle-btn ${showVideoPlayer ? "active" : ""}`}
                                                    onClick={() => setShowVideoPlayer((v) => !v)}
                                                    title="Toggle Video Player"
                                                >
                                                    <Tv size={14} />
                                                    <span>{showVideoPlayer ? "Hide Video" : "📺 Watch Official Video"}</span>
                                                </button>
                                            </div>
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
                                                    onClick={() => openLyrics(currentSong)}
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
                                                <button
                                                    type="button"
                                                    className={`worship-action-loop-btn ${isContinuousLoop ? "active" : ""}`}
                                                    onClick={toggleContinuousLoop}
                                                    title={isContinuousLoop ? "Continuous Playlist Loop: Active (Loops automatically after last song)" : "Continuous Loop: Disabled"}
                                                >
                                                    <Repeat size={15} /> Continuous: {isContinuousLoop ? "ON (Loops back)" : "OFF"}
                                                </button>
                                                {userRole === "ADMIN" && (
                                                    <button
                                                        type="button"
                                                        className="worship-action-delete-btn"
                                                        onClick={() => handleAdminDeleteSong(currentSong)}
                                                        title="Admin: Delete this song from community"
                                                    >
                                                        <Trash2 size={15} /> Delete Song
                                                    </button>
                                                )}
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
                                                            openLyrics(song);
                                                        }}
                                                        title="View full lyrics"
                                                    >
                                                        <FileText size={13} /> Lyrics
                                                    </button>
                                                    {userRole === "ADMIN" && (
                                                        <button
                                                            type="button"
                                                            className="worship-song-row-delete-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAdminDeleteSong(song);
                                                            }}
                                                            title="Admin: Delete this song"
                                                        >
                                                            <Trash2 size={13} /> Delete
                                                        </button>
                                                    )}
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

                                            <div className="fb-card-header-right">
                                                <span className={`fb-card-type-tag ${post.postType.toLowerCase()}`}>
                                                    {post.postType}
                                                </span>
                                                {userRole === "ADMIN" && (
                                                    <button
                                                        type="button"
                                                        className="fb-post-admin-delete-btn"
                                                        onClick={() => handleAdminDeletePost(post.id, post.authorName)}
                                                        title="Admin Moderation: Delete post to uphold spiritual standards"
                                                    >
                                                        <Trash2 size={13} /> Delete Post
                                                    </button>
                                                )}
                                            </div>
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
                                                                {userRole === "ADMIN" && (
                                                                    <button
                                                                        type="button"
                                                                        className="comm-comment-admin-delete-btn"
                                                                        onClick={() => handleAdminDeleteComment(post.id, c.id)}
                                                                        title="Admin: Delete message to maintain positive culture"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
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
            {activeShortIdx !== null && shorts[activeShortIdx] && (() => {
                const currentShort = shorts[activeShortIdx];
                const parsedTheaterMedia = parseShortMedia(resolvedTheaterMediaUrl || currentShort.videoUrl);

                return (
                    <div className="shorts-theater-overlay" onClick={() => setActiveShortIdx(null)}>
                        <div className="shorts-theater-card" onClick={(e) => e.stopPropagation()}>
                            <div className="shorts-stage-media">
                                {/* YouTube Shorts or Video Embed Player */}
                                {parsedTheaterMedia.type === "youtube" && (
                                    <iframe
                                        key={currentShort.id}
                                        src={`https://www.youtube.com/embed/${parsedTheaterMedia.youtubeId}?autoplay=1&mute=${theaterMuted ? 1 : 0}&controls=0&loop=1&playlist=${parsedTheaterMedia.youtubeId}&playsinline=1&modestbranding=1&rel=0&enablejsapi=1`}
                                        title={currentShort.title}
                                        className="shorts-video-bg shorts-iframe-player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                )}

                                {/* Direct HTML5 Video Player */}
                                {parsedTheaterMedia.type === "video" && (
                                    <video
                                        key={currentShort.id}
                                        ref={theaterVideoRef}
                                        src={resolvedTheaterMediaUrl || currentShort.videoUrl}
                                        autoPlay
                                        loop
                                        playsInline
                                        muted={theaterMuted}
                                        className="shorts-video-bg shorts-video-element"
                                        onTimeUpdate={handleVideoTimeUpdate}
                                        onClick={toggleTheaterPlayPause}
                                    />
                                )}

                                {/* Image with Ken Burns animation */}
                                {parsedTheaterMedia.type === "image" && (
                                    <div className="shorts-video-bg" style={{ overflow: "hidden" }} onClick={toggleTheaterPlayPause}>
                                        <img
                                            src={currentShort.videoUrl}
                                            alt="Short Background"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                animation: "kenBurnsZoom 10s infinite alternate ease-in-out"
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Center Play/Pause Ripple Overlay */}
                                {showPlayPauseFeedback && (
                                    <div className="shorts-center-play-indicator">
                                        {lastAction === "pause" ? <Pause size={38} /> : <Play size={38} />}
                                    </div>
                                )}

                                <div className="shorts-gradient-overlay" onClick={toggleTheaterPlayPause}></div>

                                {/* Top Header */}
                                <div className="shorts-header-top">
                                    <span className="shorts-badge-pill">
                                        <Flame size={12} style={{ display: "inline", marginRight: 4 }} />
                                        EPIC SHORT
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <button
                                            type="button"
                                            className={`shorts-theater-sound-pill ${theaterMuted ? "muted" : "unmuted"}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTheaterMuted(!theaterMuted);
                                            }}
                                            title={theaterMuted ? "Turn Sound ON" : "Mute Sound"}
                                        >
                                            {theaterMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                                            <span>{theaterMuted ? "Muted" : "Sound ON"}</span>
                                        </button>
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
                                            title="Close Theater"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Floating Right TikTok Controls */}
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
                                        title="Praise God / Amen"
                                    >
                                        <div className="shorts-action-icon-wrap">
                                            <Heart size={20} fill="#f43f5e" color="#f43f5e" />
                                        </div>
                                        <span>{currentShort.likes}</span>
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
                                        title="Offer Prayer"
                                    >
                                        <div className="shorts-action-icon-wrap">
                                            <span style={{ fontSize: 18 }}>🙏</span>
                                        </div>
                                        <span>{currentShort.prayers}</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="shorts-action-bubble"
                                        onClick={() => {
                                            navigator.clipboard?.writeText(window.location.href);
                                            alert("Short link copied to clipboard!");
                                        }}
                                        title="Share Short"
                                    >
                                        <div className="shorts-action-icon-wrap">
                                            <Share2 size={18} />
                                        </div>
                                        <span>Share</span>
                                    </button>

                                    {/* TikTok Spinning Vinyl Disc */}
                                    <div className="shorts-action-bubble">
                                        <div className={`shorts-sound-vinyl ${theaterPlaying ? "spinning" : ""}`}>
                                            <Disc size={20} color="#38bdf8" />
                                        </div>
                                        <span>Sound</span>
                                    </div>
                                </div>

                                {/* Bottom Info Strip */}
                                <div className="shorts-info-bottom">
                                    <div className="shorts-speaker-strip">
                                        <strong>{currentShort.speaker}</strong>
                                        <span>• {currentShort.ministry}</span>
                                    </div>
                                    <p className="shorts-scripture-quote">
                                        "{currentShort.scriptureText}"
                                    </p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                        <span className="shorts-scripture-tag">
                                            📖 {currentShort.scripture}
                                        </span>
                                        <div className="shorts-sound-marquee">
                                            <Volume2 size={13} style={{ minWidth: 13 }} />
                                            <span>♫ {currentShort.soundTitle || "Original Christian Sound • " + currentShort.speaker}</span>
                                        </div>
                                    </div>
                                    {userRole === "ADMIN" && (
                                        <button
                                            type="button"
                                            className="shorts-stage-admin-delete-btn"
                                            onClick={() => handleAdminDeleteShort(currentShort.id, currentShort.title)}
                                            title="Admin Moderation: Delete this short"
                                        >
                                            <Trash2 size={13} /> Delete Short (Admin)
                                        </button>
                                    )}
                                </div>

                                {/* Bottom Video Timeline Bar */}
                                <div className="shorts-progress-bar-wrap">
                                    <div className="shorts-progress-bar-fill" style={{ width: `${theaterProgress}%` }}></div>
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
                                        if (activeShortIdx < shorts.length - 1) setActiveShortIdx(activeShortIdx + 1);
                                    }}
                                    disabled={activeShortIdx === shorts.length - 1}
                                    title="Next Short (Down Arrow)"
                                >
                                    <ChevronDown size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

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

                            {/* User-Friendly Media Source Tabs (Upload File, Video Link, Presets) */}
                            <div className="comm-form-group">
                                <label>Video Media Source (Upload or Link) *</label>
                                <div className="shorts-modal-tab-row">
                                    <button
                                        type="button"
                                        className={`shorts-modal-tab-btn ${shortUploadMode === "file" ? "active" : ""}`}
                                        onClick={() => setShortUploadMode("file")}
                                    >
                                        <UploadCloud size={16} /> 📁 Upload Video File
                                    </button>
                                    <button
                                        type="button"
                                        className={`shorts-modal-tab-btn ${shortUploadMode === "link" ? "active" : ""}`}
                                        onClick={() => setShortUploadMode("link")}
                                    >
                                        <Link2 size={16} /> 🔗 Paste Video Link
                                    </button>
                                    <button
                                        type="button"
                                        className={`shorts-modal-tab-btn ${shortUploadMode === "preset" ? "active" : ""}`}
                                        onClick={() => setShortUploadMode("preset")}
                                    >
                                        <Sparkles size={16} /> ⚡ Quick Presets
                                    </button>
                                </div>

                                {shortUploadMode === "file" && (
                                    <div>
                                        {!shortVideoUrl ? (
                                            <div
                                                className="comm-photo-upload-dropzone"
                                                onClick={() => shortFileInputRef.current?.click()}
                                            >
                                                <Camera size={26} color="#38bdf8" style={{ margin: "0 auto 8px" }} />
                                                <strong style={{ display: "block", color: "#ffffff", fontSize: "0.88rem" }}>
                                                    {shortCompressing ? "Processing Video File..." : "Click to Select or Drag Video File"}
                                                </strong>
                                                <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                                                    Accepts MP4, WebM, QuickTime MOV, MKV or high-res vertical photo
                                                </span>
                                            </div>
                                        ) : (
                                            videoFileInfo && (
                                                <div className="shorts-file-info-chip">
                                                    <div>
                                                        <strong>🎬 {videoFileInfo.name}</strong> ({videoFileInfo.sizeMb})
                                                    </div>
                                                    <span style={{ color: "#34d399", fontWeight: 700 }}>
                                                        ⏱️ {videoFileInfo.duration || shortDuration}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                {shortUploadMode === "link" && (
                                    <div>
                                        <input
                                            type="url"
                                            placeholder="Paste YouTube Shorts, YouTube URL, TikTok, or direct MP4 link..."
                                            value={shortVideoUrl}
                                            onChange={(e) => setShortVideoUrl(e.target.value)}
                                            style={{ marginBottom: 6 }}
                                        />
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                            <button
                                                type="button"
                                                style={{ fontSize: "0.72rem", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
                                                onClick={() => setShortVideoUrl("https://www.youtube.com/watch?v=n0FBb6hnwTo")}
                                            >
                                                Try Goodness of God
                                            </button>
                                            <button
                                                type="button"
                                                style={{ fontSize: "0.72rem", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
                                                onClick={() => setShortVideoUrl("https://www.youtube.com/watch?v=X2DWxYpTQpQ")}
                                            >
                                                Try Diyos Ka Sa Amin
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {shortUploadMode === "preset" && (
                                    <div className="shorts-preset-grid">
                                        {INSPIRING_SHORT_PRESETS.map((preset, pIdx) => (
                                            <div
                                                key={pIdx}
                                                className="shorts-preset-card"
                                                onClick={() => {
                                                    handleApplyPreset(preset);
                                                    setShortUploadMode("link");
                                                }}
                                            >
                                                <strong>{preset.label}</strong>
                                                <span>{preset.speaker} • {preset.scripture}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sound Track Selector (TikTok Sound Format) */}
                            <div className="comm-form-group">
                                <label>Audio & Worship Sound Track (TikTok Style) *</label>
                                <select
                                    value={selectedSoundTrackId}
                                    onChange={(e) => setSelectedSoundTrackId(e.target.value)}
                                    style={{
                                        background: "rgba(15, 23, 42, 0.8)",
                                        border: "1px solid rgba(56, 189, 248, 0.3)",
                                        color: "#ffffff",
                                        padding: "8px 12px",
                                        borderRadius: 10,
                                        width: "100%",
                                        fontSize: "0.85rem"
                                    }}
                                >
                                    {CHRISTIAN_SOUND_TRACKS.map((track) => (
                                        <option key={track.id} value={track.id}>
                                            {track.id === "orig" ? "🎤 " + track.title : "🎵 " + track.title + " – " + track.artist}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Live 9:16 Vertical TikTok Preview with Real Sound & Overlay */}
                            {shortVideoUrl && (() => {
                                const parsedPreview = parseShortMedia(shortVideoUrl);
                                return (
                                    <div className="shorts-modal-preview-wrapper">
                                        <div className="shorts-modal-preview-header">
                                            <div className="preview-label-badge">
                                                <Flame size={14} color="#f43f5e" />
                                                <strong>LIVE 9:16 TIKTOK FORMAT PREVIEW</strong>
                                            </div>
                                            <div className="preview-sound-controls">
                                                <button
                                                    type="button"
                                                    className={`preview-sound-toggle-btn ${previewMuted ? "muted" : "unmuted"}`}
                                                    onClick={() => setPreviewMuted(!previewMuted)}
                                                    title={previewMuted ? "Turn Sound ON" : "Mute Sound"}
                                                >
                                                    {previewMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                    <span>{previewMuted ? "Sound Muted" : "🔊 Sound Playing"}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="preview-remove-media-btn"
                                                    onClick={() => {
                                                        setShortVideoUrl("");
                                                        setUploadedVideoFile(null);
                                                        setVideoFileInfo(null);
                                                    }}
                                                >
                                                    ✕ Remove Media
                                                </button>
                                            </div>
                                        </div>

                                        <div className="shorts-preview-stage">
                                            {/* YouTube Embed Player */}
                                            {parsedPreview.type === "youtube" && (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${parsedPreview.youtubeId}?autoplay=1&mute=${previewMuted ? 1 : 0}&controls=1&loop=1&playlist=${parsedPreview.youtubeId}&playsinline=1&modestbranding=1&rel=0`}
                                                    title="Short Preview Player"
                                                    className="shorts-preview-media-player"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            )}

                                            {/* HTML5 Video Player */}
                                            {parsedPreview.type === "video" && (
                                                <video
                                                    src={shortVideoUrl}
                                                    autoPlay
                                                    loop
                                                    playsInline
                                                    muted={previewMuted}
                                                    controls
                                                    className="shorts-preview-media-player"
                                                />
                                            )}

                                            {/* Photo / Image */}
                                            {parsedPreview.type === "image" && (
                                                <div className="shorts-preview-photo-wrap">
                                                    <img src={shortVideoUrl} alt="Preview" className="shorts-preview-photo-img" />
                                                </div>
                                            )}

                                            {/* Live TikTok Overlaid Text Information */}
                                            <div className="shorts-preview-overlay-info">
                                                <div className="preview-pill-tag">📱 9:16 EPIC SHORT</div>
                                                <div className="preview-speaker-tag">
                                                    <strong>{shortSpeaker || faithProfile.name || "Believer"}</strong>
                                                    <span>• {shortMinistry}</span>
                                                </div>
                                                <p className="preview-scripture-quote">
                                                    "{shortScriptureText || 'Your encouraging scripture verse will appear here...'}"
                                                </p>
                                                <div className="preview-bottom-bar">
                                                    <span className="preview-scripture-pill">
                                                        📖 {shortScripture || "Scripture Reference"}
                                                    </span>
                                                    <span className="preview-sound-pill">
                                                        🎵 {selectedSoundTrackId !== "orig"
                                                            ? CHRISTIAN_SOUND_TRACKS.find((t) => t.id === selectedSoundTrackId)?.title
                                                            : (shortSoundTitle || "Original Sound")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

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

            {/* Admin Authentication Modal */}
            {isAdminAuthModalOpen && (
                <div className="comm-modal-overlay" onClick={() => setIsAdminAuthModalOpen(false)}>
                    <div className="comm-modal-card admin-auth-card" onClick={(e) => e.stopPropagation()}>
                        <div className="comm-modal-header admin-auth-header">
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div className="admin-auth-icon-badge">
                                    <KeyRound size={22} color="#fbbf24" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#fef08a" }}>
                                        EPIC Administrator Verification
                                    </h2>
                                    <small style={{ color: "#94a3b8" }}>
                                        EPIC CMS Authentication Required
                                    </small>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="comm-modal-close-btn"
                                onClick={() => setIsAdminAuthModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAdminLoginSubmit} className="admin-auth-form">
                            <div className="admin-auth-notice-box">
                                <ShieldCheck size={16} color="#38bdf8" />
                                <span>
                                    Only authorized administrators and pastors can access moderation tools to delete posts, reflections, and songs, maintaining our church's positive spiritual culture.
                                </span>
                            </div>

                            {adminAuthError && (
                                <div className="admin-auth-error-alert">
                                    <AlertCircle size={15} />
                                    <span>{adminAuthError}</span>
                                </div>
                            )}

                            <div className="comm-form-group">
                                <label>EPIC Admin Username or Email</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter your admin username..."
                                    value={adminUsername}
                                    onChange={(e) => setAdminUsername(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="comm-form-group">
                                <label>Password or Admin Security Passkey</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Enter admin password or security key..."
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                />
                                <small style={{ color: "#64748b", marginTop: 4, display: "block" }}>
                                    Tip: You can use your EPIC CMS administrator account credentials or the church master key.
                                </small>
                            </div>

                            <div className="admin-auth-footer-actions">
                                <button
                                    type="button"
                                    className="admin-auth-cancel-btn"
                                    onClick={() => setIsAdminAuthModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adminAuthLoading}
                                    className="admin-auth-submit-btn"
                                >
                                    {adminAuthLoading ? "Verifying..." : "🔐 Verify & Enter Admin Mode"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Admin Moderation Toast */}
            {toastNotification && (
                <div className="community-admin-toast">
                    <CheckCircle2 size={17} color="#34d399" />
                    <span>{toastNotification}</span>
                </div>
            )}



            {/* Modal: Admin Upload Worship Song with Proper Lyrics */}
            <UploadWorshipSongModal
                isOpen={isUploadSongModalOpen}
                onClose={() => setIsUploadSongModalOpen(false)}
                onSongUploaded={(newSong) => {
                    setToastNotification(`✓ "${newSong.title}" with proper lyrics published to Sanctuary!`);
                    setTimeout(() => setToastNotification(""), 4000);
                }}
            />

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

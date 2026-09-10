/**
 * EPIC Church Management System - Public Community Service
 * Connects members, visitors, and believers worldwide to the EPIC Spiritual Social Network.
 * Supports Faith Points gamification, Ladder of Success leaderboard, prayer wall counters, stories, and short-form encouragement.
 */

import { API_BASE_URL } from "../config";

export type PostType =
    | "ALL"
    | "PRAYER"
    | "TESTIMONY"
    | "VERSE"
    | "DEVOTIONAL"
    | "CELEBRATION"
    | "CHURCH_MOMENT";

export type ReactionType = "ENCOURAGE" | "PRAYING" | "STRENGTHENED" | "CELEBRATE";

export interface CommunityComment {
    id: number;
    postId: number;
    authorName: string;
    avatarBg: string;
    content: string;
    createdAt: string;
}

export interface CommunityPost {
    id: number;
    authorName: string;
    authorRole: string;
    avatarBg: string;
    postType: string;
    ministryGroup: string;
    title?: string;
    content: string;
    scriptureRef?: string;
    mediaUrl?: string;
    encouragesCount: number;
    prayingCount: number;
    strengthenedCount: number;
    celebratesCount: number;
    commentsCount: number;
    createdAt: string;
    comments?: CommunityComment[];
    myReaction?: ReactionType;
    myPrayed?: boolean;
}

export interface CommunityStory {
    id: string;
    title: string;
    ministry: string;
    avatarUrl: string;
    imageUrl: string;
    caption: string;
    timeAgo: string;
    hasUnseen: boolean;
}

export interface CommunityShort {
    id: string;
    title: string;
    speaker: string;
    ministry: string;
    scripture: string;
    scriptureText: string;
    videoPlaceholderBg: string;
    videoUrl: string;
    duration: string;
    likes: number;
    prayers: number;
    mediaType?: "video" | "youtube" | "image";
    youtubeId?: string;
    soundTitle?: string;
    isUserUploaded?: boolean;
}

export interface UserFaithProfile {
    name: string;
    streakDays: number;
    faithPoints: number;
    prayersOffered: number;
    peopleEncouraged: number;
    lastActiveDate: string;
    dailyChallengeCompleted: boolean;
}

export interface LadderRankInfo {
    level: number;
    title: string;
    icon: string;
    currentPoints: number;
    nextMilestone: number;
    progressPct: number;
}

export interface LeaderboardMember {
    rank: number;
    name: string;
    role: string;
    points: number;
    avatarBg: string;
    isCurrentUser?: boolean;
    tier: string;
}

const FAITH_PROFILE_KEY = "epic_community_faith_profile_v1";
const USER_TOKEN_KEY = "epic_community_user_token_v1";
const CACHED_FEED_KEY = "epic_community_cached_feed_v1";
const USER_REACTIONS_KEY = "epic_community_user_reactions_v1";
const USER_PRAYED_KEY = "epic_community_user_prayed_v1";

export function getUserToken(): string {
    let token = localStorage.getItem(USER_TOKEN_KEY);
    if (!token) {
        token = "usr_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
        localStorage.setItem(USER_TOKEN_KEY, token);
    }
    return token;
}

export function getFaithProfile(): UserFaithProfile {
    try {
        const raw = localStorage.getItem(FAITH_PROFILE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const today = new Date().toISOString().slice(0, 10);
            if (parsed.lastActiveDate !== today) {
                // Check streak
                const lastDate = new Date(parsed.lastActiveDate);
                const diffDays = Math.round((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
                const newStreak = diffDays <= 1 ? parsed.streakDays + (diffDays === 1 ? 1 : 0) : 1;
                const updated: UserFaithProfile = {
                    ...parsed,
                    streakDays: newStreak,
                    lastActiveDate: today,
                    dailyChallengeCompleted: false
                };
                localStorage.setItem(FAITH_PROFILE_KEY, JSON.stringify(updated));
                return updated;
            }
            return parsed;
        }
    } catch {
        // Fallback to default
    }

    const initial: UserFaithProfile = {
        name: "Brother / Sister in Christ",
        streakDays: 12,
        faithPoints: 1240,
        prayersOffered: 38,
        peopleEncouraged: 76,
        lastActiveDate: new Date().toISOString().slice(0, 10),
        dailyChallengeCompleted: false
    };
    localStorage.setItem(FAITH_PROFILE_KEY, JSON.stringify(initial));
    return initial;
}

export function awardFaithPoints(points: number, activityName: string): UserFaithProfile {
    const profile = getFaithProfile();
    profile.faithPoints += points;
    if (activityName === "ENCOURAGED") {
        profile.peopleEncouraged += 1;
    } else if (activityName === "PRAYED") {
        profile.prayersOffered += 1;
    }
    localStorage.setItem(FAITH_PROFILE_KEY, JSON.stringify(profile));
    return profile;
}

export function claimDailyChallenge(): UserFaithProfile {
    const profile = getFaithProfile();
    if (!profile.dailyChallengeCompleted) {
        profile.dailyChallengeCompleted = true;
        profile.faithPoints += 10;
        profile.peopleEncouraged += 1;
        localStorage.setItem(FAITH_PROFILE_KEY, JSON.stringify(profile));
    }
    return profile;
}

/**
 * Calculates current rank tier and progress on the Ladder of Success
 */
export function getLadderRank(points: number): LadderRankInfo {
    if (points >= 3000) {
        return {
            level: 5,
            title: "Kingdom Pillar",
            icon: "👑",
            currentPoints: points,
            nextMilestone: 5000,
            progressPct: Math.min(100, Math.round(((points - 3000) / 2000) * 100))
        };
    }
    if (points >= 2000) {
        return {
            level: 4,
            title: "Prayer Champion",
            icon: "🛡️",
            currentPoints: points,
            nextMilestone: 3000,
            progressPct: Math.round(((points - 2000) / 1000) * 100)
        };
    }
    if (points >= 1000) {
        return {
            level: 3,
            title: "Community Encourager",
            icon: "❤️",
            currentPoints: points,
            nextMilestone: 2000,
            progressPct: Math.round(((points - 1000) / 1000) * 100)
        };
    }
    if (points >= 500) {
        return {
            level: 2,
            title: "Faithful Disciple",
            icon: "💡",
            currentPoints: points,
            nextMilestone: 1000,
            progressPct: Math.round(((points - 500) / 500) * 100)
        };
    }
    return {
        level: 1,
        title: "Seedling Believer",
        icon: "🌱",
        currentPoints: points,
        nextMilestone: 500,
        progressPct: Math.round((points / 500) * 100)
    };
}

/**
 * Returns community leaderboard rankings dynamically placing current user
 */
export function getCommunityLeaderboard(userPoints: number, userName: string): LeaderboardMember[] {
    const baseMembers: Omit<LeaderboardMember, "rank">[] = [
        {
            name: "Pastor Ronnel",
            role: "Senior Pastor",
            points: 2840,
            avatarBg: "#7c3aed",
            tier: "Kingdom Pillar"
        },
        {
            name: "Sister Grace Villanueva",
            role: "Outreach Servant",
            points: 2390,
            avatarBg: "#059669",
            tier: "Prayer Champion"
        },
        {
            name: "Brother Mark Anthony",
            role: "Life Group Leader",
            points: 1980,
            avatarBg: "#0284c7",
            tier: "Community Encourager"
        },
        {
            name: "Hannah Joy",
            role: "Worship Leader",
            points: 1640,
            avatarBg: "#ea580c",
            tier: "Community Encourager"
        },
        {
            name: "Joshua David",
            role: "Youth Fellow",
            points: 1420,
            avatarBg: "#db2777",
            tier: "Community Encourager"
        },
        {
            name: userName || "You (Faith Champion)",
            role: "Believer",
            points: userPoints,
            avatarBg: "#00f2fe",
            isCurrentUser: true,
            tier: getLadderRank(userPoints).title
        }
    ];

    // Sort by points descending and assign rank
    const sorted = baseMembers.sort((a, b) => b.points - a.points);
    return sorted.map((m, idx) => ({
        ...m,
        rank: idx + 1
    }));
}

/**
 * High-performance client-side image compression
 * Converts large multi-MB camera photos into lightweight, crisp WebP/JPEG (approx 150-250KB)
 */
export function compressImage(
    file: File,
    maxWidth = 1600,
    maxHeight = 1200,
    quality = 0.85
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(e.target?.result as string);
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, 0, 0, width, height);

                try {
                    const dataUrl = canvas.toDataURL("image/webp", quality);
                    if (dataUrl.startsWith("data:image/webp")) {
                        resolve(dataUrl);
                        return;
                    }
                } catch {}

                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function getUserReactions(): Record<number, ReactionType> {
    try {
        const raw = localStorage.getItem(USER_REACTIONS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveUserReactions(map: Record<number, ReactionType>) {
    localStorage.setItem(USER_REACTIONS_KEY, JSON.stringify(map));
}

function getUserPrayed(): Record<number, boolean> {
    try {
        const raw = localStorage.getItem(USER_PRAYED_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveUserPrayed(map: Record<number, boolean>) {
    localStorage.setItem(USER_PRAYED_KEY, JSON.stringify(map));
}

/**
 * Fetch Community Fellowship Feed
 */
export async function fetchCommunityFeed(
    type?: string,
    group?: string,
    search?: string
): Promise<CommunityPost[]> {
    const userReactions = getUserReactions();
    const userPrayed = getUserPrayed();

    try {
        const params = new URLSearchParams();
        if (type && type !== "ALL") params.append("type", type);
        if (group && group !== "ALL") params.append("group", group);
        if (search) params.append("search", search);

        const res = await fetch(`${API_BASE_URL}/public-community/feed?${params.toString()}`);
        if (res.ok) {
            const data: CommunityPost[] = await res.json();
            const deletedPosts = getDeletedPostIds();
            const deletedComments = getDeletedCommentIds();
            const decorated = data
                .filter((p) => !deletedPosts.includes(p.id))
                .map((p) => ({
                    ...p,
                    comments: (p.comments || []).filter((c) => !deletedComments.includes(c.id)),
                    myReaction: userReactions[p.id],
                    myPrayed: !!userPrayed[p.id]
                }));
            localStorage.setItem(CACHED_FEED_KEY, JSON.stringify(decorated));
            return decorated;
        }
    } catch (e) {
        console.warn("Could not fetch community feed from cloud, using cache.", e);
    }

    try {
        const raw = localStorage.getItem(CACHED_FEED_KEY);
        if (raw) {
            const parsed: CommunityPost[] = JSON.parse(raw);
            const deletedPosts = getDeletedPostIds();
            const deletedComments = getDeletedCommentIds();
            return parsed
                .filter((p) => !deletedPosts.includes(p.id))
                .map((p) => ({
                    ...p,
                    comments: (p.comments || []).filter((c) => !deletedComments.includes(c.id))
                }));
        }
    } catch {}

    return [];
}

/**
 * Submit a new community post
 */
export async function createCommunityPost(req: {
    authorName: string;
    authorRole?: string;
    postType: string;
    ministryGroup?: string;
    title?: string;
    content: string;
    scriptureRef?: string;
    mediaUrl?: string;
}): Promise<CommunityPost> {
    awardFaithPoints(15, "POSTED");

    try {
        const res = await fetch(`${API_BASE_URL}/public-community/post`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req)
        });

        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.warn("Could not sync post to cloud API, generating local post.", e);
    }

    const fallback: CommunityPost = {
        id: Date.now(),
        authorName: req.authorName.trim() || "Church Member",
        authorRole: req.authorRole?.trim() || "Believer",
        avatarBg: "#0284c7",
        postType: req.postType.toUpperCase(),
        ministryGroup: req.ministryGroup?.trim() || "General",
        title: req.title?.trim(),
        content: req.content.trim(),
        scriptureRef: req.scriptureRef?.trim(),
        mediaUrl: req.mediaUrl?.trim(),
        encouragesCount: 1,
        prayingCount: req.postType === "PRAYER" ? 1 : 0,
        strengthenedCount: 0,
        celebratesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        comments: []
    };

    return fallback;
}

/**
 * Toggle Reaction on a Post
 */
export async function reactToPost(
    postId: number,
    reactionType: ReactionType
): Promise<{
    postId: number;
    newReaction?: ReactionType;
}> {
    const reactions = getUserReactions();
    const token = getUserToken();
    const current = reactions[postId];

    let newReaction: ReactionType | undefined = reactionType;
    if (current === reactionType) {
        delete reactions[postId];
        newReaction = undefined;
    } else {
        reactions[postId] = reactionType;
        awardFaithPoints(5, "ENCOURAGED");
    }
    saveUserReactions(reactions);

    fetch(`${API_BASE_URL}/public-community/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userToken: token, reactionType })
    }).catch(() => {});

    return { postId, newReaction };
}

/**
 * Click "I'm praying for you" on a prayer request
 */
export async function prayForPost(postId: number): Promise<{ postId: number }> {
    const prayed = getUserPrayed();
    const token = getUserToken();

    if (!prayed[postId]) {
        prayed[postId] = true;
        saveUserPrayed(prayed);
        awardFaithPoints(10, "PRAYED");

        fetch(`${API_BASE_URL}/public-community/pray`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, userToken: token })
        }).catch(() => {});
    }

    return { postId };
}

/**
 * Add Comment Reflection to Post
 */
export async function addPostComment(
    postId: number,
    authorName: string,
    content: string
): Promise<CommunityComment> {
    awardFaithPoints(5, "ENCOURAGED");

    const optimistic: CommunityComment = {
        id: Date.now(),
        postId,
        authorName: authorName.trim() || "Brother / Sister in Christ",
        avatarBg: "#0284c7",
        content: content.trim(),
        createdAt: new Date().toISOString()
    };

    try {
        const res = await fetch(`${API_BASE_URL}/public-community/comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, authorName, content })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch {}

    return optimistic;
}

/**
 * Fetch Instagram-Style 24h Stories
 */
export async function fetchCommunityStories(): Promise<CommunityStory[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/public-community/stories`);
        if (res.ok) return await res.json();
    } catch {}

    return [
        {
            id: "story-1",
            title: "Sunday Praise",
            ministry: "Worship & Arts",
            avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
            caption: "Over 450 worshippers in pure adoration this Sunday morning. Jesus is moving in EPIC!",
            timeAgo: "2h ago",
            hasUnseen: true
        },
        {
            id: "story-2",
            title: "Youth Encounter",
            ministry: "Youth Ministry",
            avatarUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80",
            caption: "Unstoppable generation gathered around the bonfire for surrender and revival!",
            timeAgo: "5h ago",
            hasUnseen: true
        },
        {
            id: "story-3",
            title: "Pastor's Bread",
            ministry: "Pastoral Care",
            avatarUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80",
            caption: "'The Lord is your keeper; the Lord is your shade on your right hand.' Psalm 121:5. Rest in His peace today.",
            timeAgo: "7h ago",
            hasUnseen: true
        },
        {
            id: "story-4",
            title: "Compassion Aid",
            ministry: "Outreach Team",
            avatarUrl: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80",
            caption: "Free pediatric medicines and grocery baskets ready for distribution tomorrow!",
            timeAgo: "10h ago",
            hasUnseen: false
        }
    ];
}

const CUSTOM_SHORTS_KEY = "epic_custom_shorts";

export function getCustomShorts(): CommunityShort[] {
    try {
        const stored = localStorage.getItem(CUSTOM_SHORTS_KEY);
        if (stored) return JSON.parse(stored);
    } catch {}
    return [];
}

export function createCommunityShort(shortData: Omit<CommunityShort, "id" | "likes" | "prayers">): CommunityShort {
    const newShort: CommunityShort = {
        ...shortData,
        id: `short-${Date.now()}`,
        likes: 1,
        prayers: 1
    };

    const existing = getCustomShorts();
    const updated = [newShort, ...existing];
    localStorage.setItem(CUSTOM_SHORTS_KEY, JSON.stringify(updated));

    // Award +20 faith points for creating a short
    awardFaithPoints(20, "CREATED_SHORT");

    return newShort;
}

/**
 * Fetch TikTok-Style Shorts
 */
export async function fetchCommunityShorts(): Promise<CommunityShort[]> {
    const customShorts = getCustomShorts();
    let apiShorts: CommunityShort[] = [];
    try {
        const res = await fetch(`${API_BASE_URL}/public-community/shorts`);
        if (res.ok) apiShorts = await res.json();
    } catch {}

    const defaults: CommunityShort[] = [
        {
            id: "short-1",
            title: "God Is Fighting For You",
            speaker: "Pastor Ronnel",
            ministry: "Pastoral Encouragement",
            scripture: "Exodus 14:14",
            scriptureText: "The Lord will fight for you; you need only to be still.",
            videoPlaceholderBg: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%)",
            videoUrl: "https://www.youtube.com/watch?v=n0FBb6hnwTo",
            mediaType: "youtube",
            youtubeId: "n0FBb6hnwTo",
            soundTitle: "Goodness of God • Bethel Music",
            duration: "0:45",
            likes: 284,
            prayers: 112
        },
        {
            id: "short-2",
            title: "Unstoppable Worship Acoustic",
            speaker: "EPIC Youth Band",
            ministry: "Youth Encounters",
            scripture: "Psalm 103:1",
            scriptureText: "Praise the Lord, my soul; all my inmost being, praise his holy name.",
            videoPlaceholderBg: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #db2777 100%)",
            videoUrl: "https://www.youtube.com/watch?v=X2DWxYpTQpQ",
            mediaType: "youtube",
            youtubeId: "X2DWxYpTQpQ",
            soundTitle: "Diyos Ka Sa Amin • Hope Filipino Worship",
            duration: "0:50",
            likes: 341,
            prayers: 89
        },
        {
            id: "short-3",
            title: "How to Defeat Anxiety Today",
            speaker: "Sister Grace Villanueva",
            ministry: "Discipleship Academy",
            scripture: "1 Peter 5:7",
            scriptureText: "Cast all your anxiety on him because he cares for you.",
            videoPlaceholderBg: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
            videoUrl: "https://www.youtube.com/watch?v=QM8jQHE5AAk",
            mediaType: "youtube",
            youtubeId: "QM8jQHE5AAk",
            soundTitle: "Way Maker • Sinach",
            duration: "0:40",
            likes: 219,
            prayers: 145
        },
        {
            id: "short-4",
            title: "From Brokenness to Restoration",
            speaker: "Brother Mark Anthony",
            ministry: "Life Testimonies",
            scripture: "Jeremiah 29:11",
            scriptureText: "'For I know the plans I have for you,' declares the Lord, 'plans to prosper you and not to harm you, plans to give you hope and a future.'",
            videoPlaceholderBg: "linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #f97316 100%)",
            videoUrl: "https://www.youtube.com/watch?v=BMZmyvr5IAM",
            mediaType: "youtube",
            youtubeId: "BMZmyvr5IAM",
            soundTitle: "Salamat, Salamat • Malayang Pilipino",
            duration: "0:48",
            likes: 405,
            prayers: 178
        }
    ];

    const base = apiShorts.length > 0 ? apiShorts : defaults;
    const all = [...customShorts, ...base];
    const deletedShorts = getDeletedShortIds();
    return all.filter((s) => !deletedShorts.includes(s.id));
}


// ============================================================
// ADMIN COMMUNITY MODERATION SYSTEM (POSTS, COMMENTS, SHORTS)
// ============================================================
const DELETED_POSTS_KEY = "epic_community_deleted_posts";
const DELETED_COMMENTS_KEY = "epic_community_deleted_comments";
const DELETED_SHORTS_KEY = "epic_community_deleted_shorts";

export function getDeletedPostIds(): number[] {
    try {
        const raw = localStorage.getItem(DELETED_POSTS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return [];
}

export function adminDeletePost(postId: number): void {
    const deleted = getDeletedPostIds();
    if (!deleted.includes(postId)) {
        deleted.push(postId);
        try {
            localStorage.setItem(DELETED_POSTS_KEY, JSON.stringify(deleted));
        } catch {}
    }
}

export function getDeletedCommentIds(): number[] {
    try {
        const raw = localStorage.getItem(DELETED_COMMENTS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return [];
}

export function adminDeleteComment(commentId: number): void {
    const deleted = getDeletedCommentIds();
    if (!deleted.includes(commentId)) {
        deleted.push(commentId);
        try {
            localStorage.setItem(DELETED_COMMENTS_KEY, JSON.stringify(deleted));
        } catch {}
    }
}

export function getDeletedShortIds(): string[] {
    try {
        const raw = localStorage.getItem(DELETED_SHORTS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return [];
}

export function adminDeleteShort(shortId: string): void {
    const deleted = getDeletedShortIds();
    if (!deleted.includes(shortId)) {
        deleted.push(shortId);
        try {
            localStorage.setItem(DELETED_SHORTS_KEY, JSON.stringify(deleted));
        } catch {}
    }
}

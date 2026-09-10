/**
 * EPIC Church Blog - Cloud Engagement & Reaction Engine
 * Provides real-time Facebook-style reactions, share tracking, and cloud-persistent commenting.
 * Synchronizes across the entire internet via the EPIC Cloud API (SQL Server backend)
 * with instant optimistic rendering, local caching, and cross-tab BroadcastChannel updates.
 */

import { API_BASE_URL } from "../config";

export type ReactionType = "like" | "heart" | "amen" | "insight" | "blessed";

export interface ArticleReactions {
    likes: number;
    hearts: number;
    amens: number;
    insights: number;
    blesseds: number;
    shares: number;
    userReaction: ReactionType | null;
    userShared: boolean;
}

export interface BlogCommentReply {
    id: string;
    authorName: string;
    authorRole: string;
    avatarBg: string;
    timestamp: string;
    content: string;
}

export interface BlogComment {
    id: string;
    articleId: string;
    authorName: string;
    authorRole: string;
    avatarBg: string;
    timestamp: string;
    content: string;
    likes: number;
    userLiked?: boolean;
    replies: BlogCommentReply[];
}

const REACTIONS_STORAGE_KEY = "epic_blog_reactions_v3";
const COMMENTS_STORAGE_KEY = "epic_blog_comments_v3";
const USER_PREFERENCES_KEY = "epic_blog_user_prefs_v1";

interface UserPreferences {
    userReactions: Record<string, ReactionType>;
    userShares: Record<string, boolean>;
    likedComments: Record<string, boolean>;
}

function getUserPreferences(): UserPreferences {
    try {
        const raw = localStorage.getItem(USER_PREFERENCES_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        // ignore
    }
    return { userReactions: {}, userShares: {}, likedComments: {} };
}

function saveUserPreferences(prefs: UserPreferences): void {
    try {
        localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(prefs));
    } catch {
        // ignore
    }
}

// BroadcastChannel for instant cross-tab synchronization
let broadcastChannel: BroadcastChannel | null = null;
try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        broadcastChannel = new BroadcastChannel("epic_blog_engagement");
    }
} catch {
    // BroadcastChannel unsupported or restricted
}

function notifyUpdate(type: "reactions" | "comments", articleId: string, payload: unknown) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent("epic:blog-engagement-update", {
                detail: { type, articleId, payload }
            })
        );
        try {
            broadcastChannel?.postMessage({ type, articleId, payload });
        } catch {
            // ignore
        }
    }
}

/**
 * Generate sensible base seed reactions for articles based on articleId
 */
function getInitialReactionsForArticle(articleId: string): ArticleReactions {
    let hash = 0;
    for (let i = 0; i < articleId.length; i++) {
        hash = (hash << 5) - hash + articleId.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    return {
        likes: 45 + (seed % 95),
        hearts: 30 + ((seed >> 2) % 65),
        amens: 20 + ((seed >> 4) % 45),
        insights: 12 + ((seed >> 6) % 30),
        blesseds: 8 + ((seed >> 8) % 25),
        shares: 15 + ((seed >> 10) % 35),
        userReaction: null,
        userShared: false
    };
}

function getAllStoredReactions(): Record<string, ArticleReactions> {
    try {
        const raw = localStorage.getItem(REACTIONS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveAllStoredReactions(data: Record<string, ArticleReactions>): void {
    try {
        localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(data));
    } catch {
        // ignore
    }
}

function getAllStoredComments(): Record<string, BlogComment[]> {
    try {
        const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveAllStoredComments(data: Record<string, BlogComment[]>): void {
    try {
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(data));
    } catch {
        // ignore
    }
}

/**
 * Synchronous getter for instant UI load
 */
export function getArticleReactions(articleId: string): ArticleReactions {
    const all = getAllStoredReactions();
    const prefs = getUserPreferences();
    if (!all[articleId]) {
        all[articleId] = getInitialReactionsForArticle(articleId);
        saveAllStoredReactions(all);
    }
    const reaction = all[articleId];
    return {
        ...reaction,
        userReaction: prefs.userReactions[articleId] || null,
        userShared: !!prefs.userShares[articleId]
    };
}

/**
 * Synchronous getter for instant UI load
 */
export function getArticleComments(articleId: string): BlogComment[] {
    const all = getAllStoredComments();
    const prefs = getUserPreferences();
    const comments = all[articleId] || [];
    return comments.map((c) => ({
        ...c,
        userLiked: !!prefs.likedComments[c.id]
    }));
}

/**
 * Calculate total reaction sum
 */
export function getTotalReactions(r?: ArticleReactions): number {
    if (!r) return 0;
    return (r.likes || 0) + (r.hearts || 0) + (r.amens || 0) + (r.insights || 0) + (r.blesseds || 0);
}

/**
 * Cloud Fetch: Refresh reactions & comments from the central cloud database
 */
export async function fetchArticleEngagement(
    articleId: string
): Promise<{ reactions: ArticleReactions; comments: BlogComment[] } | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/blog/${encodeURIComponent(articleId)}/engagement`);
        if (!res.ok) return null;

        const data = await res.json();
        const prefs = getUserPreferences();

        const mergedReactions: ArticleReactions = {
            likes: data.reactions?.likes ?? 0,
            hearts: data.reactions?.hearts ?? 0,
            amens: data.reactions?.amens ?? 0,
            insights: data.reactions?.insights ?? 0,
            blesseds: data.reactions?.blesseds ?? 0,
            shares: data.reactions?.shares ?? 0,
            userReaction: prefs.userReactions[articleId] || null,
            userShared: !!prefs.userShares[articleId]
        };

        const serverComments: BlogComment[] = (data.comments || []).map((c: any) => ({
            id: c.id || c.Id,
            articleId: c.articleId || c.ArticleId || articleId,
            authorName: c.authorName || c.AuthorName || "Faithful Believer",
            authorRole: c.authorRole || c.AuthorRole || "Church Member",
            avatarBg: c.avatarBg || c.AvatarBg || "#0284c7",
            timestamp: c.timestamp || "Recently",
            content: c.content || c.Content || "",
            likes: c.likes || c.Likes || 0,
            userLiked: !!prefs.likedComments[c.id || c.Id],
            replies: (c.replies || []).map((r: any) => ({
                id: r.id || r.Id,
                authorName: r.authorName || r.AuthorName || "Fellow Disciple",
                authorRole: r.authorRole || r.AuthorRole || "Church Member",
                avatarBg: r.avatarBg || r.AvatarBg || "#0284c7",
                timestamp: r.timestamp || "Recently",
                content: r.content || r.Content || ""
            }))
        }));

        // Update local caches
        const allR = getAllStoredReactions();
        allR[articleId] = mergedReactions;
        saveAllStoredReactions(allR);

        const allC = getAllStoredComments();
        allC[articleId] = serverComments;
        saveAllStoredComments(allC);

        notifyUpdate("reactions", articleId, mergedReactions);
        notifyUpdate("comments", articleId, serverComments);

        return { reactions: mergedReactions, comments: serverComments };
    } catch (e) {
        console.warn("Could not fetch cloud engagement, using local cache.", e);
        return null;
    }
}

/**
 * Cloud Fetch: Summary for all cards on the magazine home page
 */
export async function fetchEngagementSummary(): Promise<Record<string, { reactions: ArticleReactions; commentsCount: number }> | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/blog/engagement/summary`);
        if (!res.ok) return null;

        const data = await res.json();
        const prefs = getUserPreferences();
        const allR = getAllStoredReactions();

        for (const [artId, val] of Object.entries<any>(data)) {
            if (val?.reactions) {
                allR[artId] = {
                    likes: val.reactions.likes ?? 0,
                    hearts: val.reactions.hearts ?? 0,
                    amens: val.reactions.amens ?? 0,
                    insights: val.reactions.insights ?? 0,
                    blesseds: val.reactions.blesseds ?? 0,
                    shares: val.reactions.shares ?? 0,
                    userReaction: prefs.userReactions[artId] || null,
                    userShared: !!prefs.userShares[artId]
                };
                notifyUpdate("reactions", artId, allR[artId]);
            }
        }
        saveAllStoredReactions(allR);
        return data;
    } catch {
        return null;
    }
}

/**
 * Set Reaction: Optimistic local update + background cloud sync to SQL Server
 */
export function setArticleReaction(
    articleId: string,
    reaction: ReactionType
): { reactions: ArticleReactions; previous: ReactionType | null; current: ReactionType | null } {
    const all = getAllStoredReactions();
    const prefs = getUserPreferences();
    const current = all[articleId] || getInitialReactionsForArticle(articleId);
    const previous = prefs.userReactions[articleId] || null;

    let targetReaction: ReactionType | null = reaction;

    if (previous === reaction) {
        // Toggle OFF
        targetReaction = null;
        switch (reaction) {
            case "like": current.likes = Math.max(0, current.likes - 1); break;
            case "heart": current.hearts = Math.max(0, current.hearts - 1); break;
            case "amen": current.amens = Math.max(0, current.amens - 1); break;
            case "insight": current.insights = Math.max(0, current.insights - 1); break;
            case "blessed": current.blesseds = Math.max(0, current.blesseds - 1); break;
        }
        delete prefs.userReactions[articleId];
    } else {
        // Decrement old
        if (previous) {
            switch (previous) {
                case "like": current.likes = Math.max(0, current.likes - 1); break;
                case "heart": current.hearts = Math.max(0, current.hearts - 1); break;
                case "amen": current.amens = Math.max(0, current.amens - 1); break;
                case "insight": current.insights = Math.max(0, current.insights - 1); break;
                case "blessed": current.blesseds = Math.max(0, current.blesseds - 1); break;
            }
        }
        // Increment new
        switch (reaction) {
            case "like": current.likes++; break;
            case "heart": current.hearts++; break;
            case "amen": current.amens++; break;
            case "insight": current.insights++; break;
            case "blessed": current.blesseds++; break;
        }
        prefs.userReactions[articleId] = reaction;
    }

    current.userReaction = targetReaction;
    all[articleId] = current;
    saveAllStoredReactions(all);
    saveUserPreferences(prefs);
    notifyUpdate("reactions", articleId, current);

    // Sync to Cloud in background
    fetch(`${API_BASE_URL}/blog/${encodeURIComponent(articleId)}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            reactionType: targetReaction || "remove",
            previousReaction: previous
        })
    })
        .then((r) => (r.ok ? r.json() : null))
        .then((serverReactions) => {
            if (serverReactions) {
                current.likes = serverReactions.likes;
                current.hearts = serverReactions.hearts;
                current.amens = serverReactions.amens;
                current.insights = serverReactions.insights;
                current.blesseds = serverReactions.blesseds;
                current.shares = serverReactions.shares;
                all[articleId] = current;
                saveAllStoredReactions(all);
                notifyUpdate("reactions", articleId, current);
            }
        })
        .catch(() => {});

    return { reactions: current, previous, current: targetReaction };
}

/**
 * Record Share: Optimistic local update + background cloud sync to SQL Server
 */
export function recordArticleShare(articleId: string): ArticleReactions {
    const all = getAllStoredReactions();
    const prefs = getUserPreferences();
    const current = all[articleId] || getInitialReactionsForArticle(articleId);

    current.shares++;
    current.userShared = true;
    prefs.userShares[articleId] = true;

    all[articleId] = current;
    saveAllStoredReactions(all);
    saveUserPreferences(prefs);
    notifyUpdate("reactions", articleId, current);

    // Sync to Cloud in background
    fetch(`${API_BASE_URL}/blog/${encodeURIComponent(articleId)}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    })
        .then((r) => (r.ok ? r.json() : null))
        .then((serverReactions) => {
            if (serverReactions) {
                current.shares = serverReactions.shares;
                all[articleId] = current;
                saveAllStoredReactions(all);
                notifyUpdate("reactions", articleId, current);
            }
        })
        .catch(() => {});

    return current;
}

/**
 * Add Comment: Optimistic local prepend + immediate cloud persist to SQL Server
 */
export function addArticleComment(
    articleId: string,
    data: {
        authorName: string;
        authorRole: string;
        content: string;
        avatarBg?: string;
    }
): BlogComment {
    const all = getAllStoredComments();
    const currentList = all[articleId] || [];

    const colors = ["#0284c7", "#0d9488", "#7c3aed", "#e11d48", "#d97706", "#2563eb", "#059669"];
    const avatarBg = data.avatarBg || colors[Math.abs(data.authorName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];

    const tempId = `temp-${Date.now()}`;
    const newComment: BlogComment = {
        id: tempId,
        articleId,
        authorName: data.authorName.trim() || "Faithful Believer",
        authorRole: data.authorRole || "Church Member",
        avatarBg,
        timestamp: "Just now",
        content: data.content.trim(),
        likes: 0,
        userLiked: false,
        replies: []
    };

    const updatedList = [newComment, ...currentList];
    all[articleId] = updatedList;
    saveAllStoredComments(all);
    notifyUpdate("comments", articleId, updatedList);

    // Send to Cloud Database
    fetch(`${API_BASE_URL}/blog/${encodeURIComponent(articleId)}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            authorName: newComment.authorName,
            authorRole: newComment.authorRole,
            avatarBg: newComment.avatarBg,
            content: newComment.content
        })
    })
        .then((r) => (r.ok ? r.json() : null))
        .then((serverComment) => {
            if (serverComment) {
                // Reconcile server ID
                const reconciledList = (all[articleId] || []).map((c) =>
                    c.id === tempId ? { ...c, id: serverComment.id, timestamp: "Just now" } : c
                );
                all[articleId] = reconciledList;
                saveAllStoredComments(all);
                notifyUpdate("comments", articleId, reconciledList);
            }
        })
        .catch(() => {});

    return newComment;
}

/**
 * Add Reply: Optimistic sub-thread update + cloud persist
 */
export function addCommentReply(
    articleId: string,
    commentId: string,
    data: {
        authorName: string;
        content: string;
        avatarBg?: string;
    }
): BlogCommentReply | null {
    const all = getAllStoredComments();
    const currentList = all[articleId] || [];

    const colors = ["#0284c7", "#0d9488", "#7c3aed", "#e11d48", "#d97706", "#059669"];
    const avatarBg = data.avatarBg || colors[Math.abs(data.authorName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];

    const tempId = `rep-${Date.now()}`;
    const newReply: BlogCommentReply = {
        id: tempId,
        authorName: data.authorName.trim() || "Fellow Disciple",
        authorRole: "Church Member",
        avatarBg,
        timestamp: "Just now",
        content: data.content.trim()
    };

    let found = false;
    const updatedList = currentList.map((c) => {
        if (c.id === commentId) {
            found = true;
            return {
                ...c,
                replies: [...c.replies, newReply]
            };
        }
        return c;
    });

    if (found) {
        all[articleId] = updatedList;
        saveAllStoredComments(all);
        notifyUpdate("comments", articleId, updatedList);

        // Send to Cloud Database
        fetch(`${API_BASE_URL}/blog/${encodeURIComponent(articleId)}/comment/${encodeURIComponent(commentId)}/reply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                authorName: newReply.authorName,
                content: newReply.content
            })
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((serverReply) => {
                if (serverReply) {
                    const reconciledList = (all[articleId] || []).map((c) => {
                        if (c.id === commentId) {
                            return {
                                ...c,
                                replies: c.replies.map((r) => (r.id === tempId ? { ...r, id: serverReply.id } : r))
                            };
                        }
                        return c;
                    });
                    all[articleId] = reconciledList;
                    saveAllStoredComments(all);
                    notifyUpdate("comments", articleId, reconciledList);
                }
            })
            .catch(() => {});

        return newReply;
    }

    return null;
}

/**
 * Toggle Comment Like: Optimistic update + cloud persist
 */
export function toggleCommentLike(
    articleId: string,
    commentId: string
): { likes: number; userLiked: boolean } {
    const all = getAllStoredComments();
    const prefs = getUserPreferences();
    const currentList = all[articleId] || [];

    const currentlyLiked = !!prefs.likedComments[commentId];
    const willBeLiked = !currentlyLiked;

    if (willBeLiked) {
        prefs.likedComments[commentId] = true;
    } else {
        delete prefs.likedComments[commentId];
    }
    saveUserPreferences(prefs);

    let result = { likes: 0, userLiked: willBeLiked };

    const updatedList = currentList.map((c) => {
        if (c.id === commentId) {
            const likes = willBeLiked ? c.likes + 1 : Math.max(0, c.likes - 1);
            result = { likes, userLiked: willBeLiked };
            return { ...c, likes, userLiked: willBeLiked };
        }
        return c;
    });

    all[articleId] = updatedList;
    saveAllStoredComments(all);
    notifyUpdate("comments", articleId, updatedList);

    // Sync to Cloud
    fetch(`${API_BASE_URL}/blog/${encodeURIComponent(articleId)}/comment/${encodeURIComponent(commentId)}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: willBeLiked })
    })
        .then((r) => (r.ok ? r.json() : null))
        .then((serverRes) => {
            if (serverRes?.likes !== undefined) {
                const refreshed = (all[articleId] || []).map((c) =>
                    c.id === commentId ? { ...c, likes: serverRes.likes } : c
                );
                all[articleId] = refreshed;
                saveAllStoredComments(all);
                notifyUpdate("comments", articleId, refreshed);
            }
        })
        .catch(() => {});

    return result;
}

/**
 * Admin Delete Comment: removes comment from local storage & notifies UI & calls API
 */
export function adminDeleteBlogComment(articleId: string, commentId: string): boolean {
    const all = getAllStoredComments();
    const currentList = all[articleId] || [];
    const filtered = currentList.filter((c) => c.id !== commentId);
    all[articleId] = filtered;
    saveAllStoredComments(all);
    notifyUpdate("comments", articleId, filtered);

    // Call Cloud Backend
    fetch(`${API_BASE_URL}/blog/${encodeURIComponent(articleId)}/comment/${encodeURIComponent(commentId)}`, {
        method: "DELETE"
    }).catch(() => {});
    return true;
}

/**
 * Admin Delete Reply: removes reply from specific comment & notifies UI & calls API
 */
export function adminDeleteBlogReply(articleId: string, commentId: string, replyId: string): boolean {
    const all = getAllStoredComments();
    const currentList = all[articleId] || [];
    const updatedList = currentList.map((c) => {
        if (c.id === commentId) {
            return {
                ...c,
                replies: c.replies.filter((r) => r.id !== replyId)
            };
        }
        return c;
    });
    all[articleId] = updatedList;
    saveAllStoredComments(all);
    notifyUpdate("comments", articleId, updatedList);

    // Call Cloud Backend
    fetch(`${API_BASE_URL}/blog/${encodeURIComponent(articleId)}/comment/${encodeURIComponent(commentId)}/reply/${encodeURIComponent(replyId)}`, {
        method: "DELETE"
    }).catch(() => {});
    return true;
}


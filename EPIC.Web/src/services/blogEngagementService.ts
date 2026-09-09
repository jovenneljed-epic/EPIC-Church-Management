/**
 * EPIC Church Blog - Engagement & Reaction Engine
 * Provides real-time Facebook-style reactions, share tracking, and persistent commenting with cross-tab synchronization.
 */

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

const REACTIONS_STORAGE_KEY = "epic_blog_reactions_v2";
const COMMENTS_STORAGE_KEY = "epic_blog_comments_v2";

// BroadcastChannel for instant cross-tab and cross-component synchronization
let broadcastChannel: BroadcastChannel | null = null;
try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        broadcastChannel = new BroadcastChannel("epic_blog_engagement");
    }
} catch {
    // BroadcastChannel unsupported or blocked in iframe
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
            // Ignore channel error
        }
    }
}

/**
 * Generate sensible seed reactions for articles based on their ID/hash
 */
function getInitialReactionsForArticle(articleId: string): ArticleReactions {
    let hash = 0;
    for (let i = 0; i < articleId.length; i++) {
        hash = (hash << 5) - hash + articleId.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    const likes = 45 + (seed % 95);
    const hearts = 30 + ((seed >> 2) % 65);
    const amens = 20 + ((seed >> 4) % 45);
    const insights = 12 + ((seed >> 6) % 30);
    const blesseds = 8 + ((seed >> 8) % 25);
    const shares = 15 + ((seed >> 10) % 35);

    return {
        likes,
        hearts,
        amens,
        insights,
        blesseds,
        shares,
        userReaction: null,
        userShared: false
    };
}

/**
 * Load all stored reactions
 */
function getAllStoredReactions(): Record<string, ArticleReactions> {
    try {
        const raw = localStorage.getItem(REACTIONS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

/**
 * Save all reactions
 */
function saveAllStoredReactions(data: Record<string, ArticleReactions>): void {
    try {
        localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn("Failed saving reactions to localStorage", e);
    }
}

/**
 * Retrieve reactions for a specific article
 */
export function getArticleReactions(articleId: string): ArticleReactions {
    const all = getAllStoredReactions();
    if (!all[articleId]) {
        all[articleId] = getInitialReactionsForArticle(articleId);
        saveAllStoredReactions(all);
    }
    return all[articleId];
}

/**
 * Toggle or set a reaction (Like, Heart, Amen, Insight, Blessed)
 */
export function setArticleReaction(
    articleId: string,
    reaction: ReactionType
): { reactions: ArticleReactions; previous: ReactionType | null; current: ReactionType | null } {
    const all = getAllStoredReactions();
    const current = all[articleId] || getInitialReactionsForArticle(articleId);
    const previous = current.userReaction;

    if (previous === reaction) {
        // Toggle OFF
        switch (reaction) {
            case "like":
                current.likes = Math.max(0, current.likes - 1);
                break;
            case "heart":
                current.hearts = Math.max(0, current.hearts - 1);
                break;
            case "amen":
                current.amens = Math.max(0, current.amens - 1);
                break;
            case "insight":
                current.insights = Math.max(0, current.insights - 1);
                break;
            case "blessed":
                current.blesseds = Math.max(0, current.blesseds - 1);
                break;
        }
        current.userReaction = null;
    } else {
        // Decrement previous if existed
        if (previous) {
            switch (previous) {
                case "like":
                    current.likes = Math.max(0, current.likes - 1);
                    break;
                case "heart":
                    current.hearts = Math.max(0, current.hearts - 1);
                    break;
                case "amen":
                    current.amens = Math.max(0, current.amens - 1);
                    break;
                case "insight":
                    current.insights = Math.max(0, current.insights - 1);
                    break;
                case "blessed":
                    current.blesseds = Math.max(0, current.blesseds - 1);
                    break;
            }
        }
        // Increment new reaction
        switch (reaction) {
            case "like":
                current.likes += 1;
                break;
            case "heart":
                current.hearts += 1;
                break;
            case "amen":
                current.amens += 1;
                break;
            case "insight":
                current.insights += 1;
                break;
            case "blessed":
                current.blesseds += 1;
                break;
        }
        current.userReaction = reaction;
    }

    all[articleId] = current;
    saveAllStoredReactions(all);
    notifyUpdate("reactions", articleId, current);

    return {
        reactions: current,
        previous,
        current: current.userReaction
    };
}

/**
 * Record a share on an article (increments counter & marks shared)
 */
export function recordArticleShare(articleId: string): ArticleReactions {
    const all = getAllStoredReactions();
    const current = all[articleId] || getInitialReactionsForArticle(articleId);

    current.shares += 1;
    current.userShared = true;

    all[articleId] = current;
    saveAllStoredReactions(all);
    notifyUpdate("reactions", articleId, current);

    return current;
}

/**
 * Total reaction count helper
 */
export function getTotalReactions(reactions: ArticleReactions): number {
    return (
        reactions.likes +
        reactions.hearts +
        reactions.amens +
        reactions.insights +
        reactions.blesseds
    );
}

/* =========================================================================
   COMMENTS SYSTEM
   ========================================================================= */

const INITIAL_SEED_COMMENTS: Record<string, BlogComment[]> = {
    "5-ways-to-strengthen-your-family-faith": [
        {
            id: "comm-1",
            articleId: "5-ways-to-strengthen-your-family-faith",
            authorName: "Sister Grace Villanueva",
            authorRole: "Sunday School Superintendent",
            avatarBg: "#1e8e3e",
            timestamp: "2 hours ago",
            content: "We began the 15-minute dinner altar with our children last Tuesday. Even my 8-year-old opened his Bible to Proverbs! This practical guide is an answer to our prayers.",
            likes: 14,
            userLiked: false,
            replies: [
                {
                    id: "rep-1-1",
                    authorName: "Pastor Ronnel M. Aviguetero",
                    authorRole: "Lead Pastor",
                    avatarBg: "#0284c7",
                    timestamp: "1 hour ago",
                    content: "Praise God, Sister Grace! When parents model simple consistency, the Holy Spirit establishes generational faith. Let us know how your cell group adopts it too!"
                }
            ]
        },
        {
            id: "comm-2",
            articleId: "5-ways-to-strengthen-your-family-faith",
            authorName: "Brother Michael Torres",
            authorRole: "Cell Group Leader",
            avatarBg: "#e37400",
            timestamp: "4 hours ago",
            content: "Point 3 regarding digital boundaries on Sunday afternoons resonated deeply with my family. We put our phones in a basket and walked around the park while memorizing Joshua 24:15. Glorious Sunday!",
            likes: 9,
            userLiked: false,
            replies: []
        }
    ],
    "lessons-death-of-a-pastors-wife-documentary-spiritual-abuse-church-accountability": [
        {
            id: "comm-pw-1",
            articleId: "lessons-death-of-a-pastors-wife-documentary-spiritual-abuse-church-accountability",
            authorName: "Elder Daniel Cruz",
            authorRole: "Pastoral Council Member",
            avatarBg: "#8e24aa",
            timestamp: "3 hours ago",
            content: "This documentary review touched our hearts deeply. Pastors' wives carry silent burdens that few ever see. Our church council is implementing a confidential pastoral care hotline immediately. Thank you for this sobering, biblical reflection.",
            likes: 27,
            userLiked: false,
            replies: [
                {
                    id: "rep-pw-1",
                    authorName: "Pastor Ronnel M. Aviguetero",
                    authorRole: "Lead Pastor",
                    avatarBg: "#0284c7",
                    timestamp: "2 hours ago",
                    content: "Amen, Elder Daniel. Accountability and shepherd care must walk hand-in-hand. The body of Christ must protect both the flock and the shepherd's home."
                }
            ]
        }
    ]
};

function getAllStoredComments(): Record<string, BlogComment[]> {
    try {
        const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        // fallback
    }
    return INITIAL_SEED_COMMENTS;
}

function saveAllStoredComments(data: Record<string, BlogComment[]>): void {
    try {
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn("Failed saving comments to localStorage", e);
    }
}

/**
 * Get comments for an article
 */
export function getArticleComments(articleId: string): BlogComment[] {
    const all = getAllStoredComments();
    return all[articleId] || [];
}

/**
 * Add a new comment to an article
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

    const colors = ["#1877f2", "#1e8e3e", "#e37400", "#8e24aa", "#c2185b", "#0077b6", "#059669"];
    const avatarBg = data.avatarBg || colors[Math.floor(Math.random() * colors.length)];

    const newComment: BlogComment = {
        id: `comm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        articleId,
        authorName: data.authorName.trim() || "Faithful Believer",
        authorRole: data.authorRole || "Church Member",
        avatarBg,
        timestamp: "Just now",
        content: data.content.trim(),
        likes: 1,
        userLiked: true,
        replies: []
    };

    const updatedList = [newComment, ...currentList];
    all[articleId] = updatedList;
    saveAllStoredComments(all);
    notifyUpdate("comments", articleId, updatedList);

    return newComment;
}

/**
 * Add a reply to an existing comment
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

    const colors = ["#1877f2", "#1e8e3e", "#e37400", "#8e24aa", "#059669"];
    const avatarBg = data.avatarBg || colors[Math.floor(Math.random() * colors.length)];

    const newReply: BlogCommentReply = {
        id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
        return newReply;
    }

    return null;
}

/**
 * Toggle like/amen on a comment
 */
export function toggleCommentLike(
    articleId: string,
    commentId: string
): { likes: number; userLiked: boolean } {
    const all = getAllStoredComments();
    const currentList = all[articleId] || [];

    let result = { likes: 0, userLiked: false };

    const updatedList = currentList.map((c) => {
        if (c.id === commentId) {
            const userLiked = !c.userLiked;
            const likes = userLiked ? c.likes + 1 : Math.max(0, c.likes - 1);
            result = { likes, userLiked };
            return { ...c, likes, userLiked };
        }
        return c;
    });

    all[articleId] = updatedList;
    saveAllStoredComments(all);
    notifyUpdate("comments", articleId, updatedList);

    return result;
}

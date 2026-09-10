/**
 * EPIC Shorts Media Utility
 * Handles video & media detection, URL conversions, YouTube Shorts / watch links,
 * direct video files (MP4, WebM, MOV), audio presets, and TikTok 9:16 format conversions.
 */

export type ShortMediaType = "youtube" | "video" | "image";

export interface ParsedShortMedia {
    type: ShortMediaType;
    cleanUrl: string;
    youtubeId?: string;
    embedUrl?: string;
    thumbnailUrl?: string;
    isVerticalLikely?: boolean;
}

/**
 * Extracts 11-character YouTube ID from various YouTube link formats
 * e.g. youtube.com/shorts/{id}, youtu.be/{id}, youtube.com/watch?v={id}
 */
export function extractYouTubeId(url: string): string | null {
    if (!url || typeof url !== "string") return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
    const match = url.trim().match(regExp);
    return match && match[1] ? match[1] : null;
}

/**
 * Parse any media URL (YouTube, MP4, WebM, MOV, blob, idb, or image)
 */
export function parseShortMedia(rawUrl: string): ParsedShortMedia {
    if (!rawUrl || typeof rawUrl !== "string") {
        return { type: "image", cleanUrl: "" };
    }

    const cleanUrl = rawUrl.trim();

    // 1. YouTube Shorts or Standard YouTube
    const ytId = extractYouTubeId(cleanUrl);
    if (ytId) {
        return {
            type: "youtube",
            cleanUrl,
            youtubeId: ytId,
            embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&controls=0&loop=1&playlist=${ytId}&playsinline=1&modestbranding=1&rel=0&enablejsapi=1`,
            thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
            isVerticalLikely: cleanUrl.includes("/shorts/")
        };
    }

    // 2. Direct Video Files & Blobs
    const isVideo =
        cleanUrl.startsWith("blob:") ||
        cleanUrl.startsWith("data:video") ||
        cleanUrl.startsWith("idb:") ||
        /\.(mp4|webm|mov|mkv|ogg|m4v)(\?.*)?$/i.test(cleanUrl);

    if (isVideo) {
        return {
            type: "video",
            cleanUrl,
            isVerticalLikely: true
        };
    }

    // 3. Fallback: Vertical Photo / Image
    return {
        type: "image",
        cleanUrl,
        thumbnailUrl: cleanUrl
    };
}

/**
 * Pre-configured authentic Christian Praise & Worship sound tracks for Shorts
 */
export interface ChristianSoundTrack {
    id: string;
    title: string;
    artist: string;
    youtubeId?: string;
}

export const CHRISTIAN_SOUND_TRACKS: ChristianSoundTrack[] = [
    { id: "orig", title: "Original Video Sound", artist: "Creator Audio" },
    { id: "goodness", title: "Goodness of God", artist: "Bethel Music / Jenn Johnson", youtubeId: "n0FBb6hnwTo" },
    { id: "diyos", title: "Diyos Ka Sa Amin", artist: "Hope Filipino Worship", youtubeId: "X2DWxYpTQpQ" },
    { id: "waymaker", title: "Way Maker", artist: "Sinach", youtubeId: "QM8jQHE5AAk" },
    { id: "salamat", title: "Salamat, Salamat", artist: "Malayang Pilipino Music", youtubeId: "BMZmyvr5IAM" },
    { id: "patutunayan", title: "Patutunayan", artist: "Victory Worship", youtubeId: "3vV84dF6g6U" },
    { id: "kaybuti", title: "Kay Buti-Buti Mo", artist: "Ptr. Luis Baldomaro", youtubeId: "4p-zsjuvanE" }
];

/**
 * Inspiring Presets for quick 1-click short creation & testing
 */
export interface ShortPreset {
    label: string;
    title: string;
    speaker: string;
    ministry: string;
    scripture: string;
    scriptureText: string;
    videoUrl: string;
    soundTitle: string;
    duration: string;
}

export const INSPIRING_SHORT_PRESETS: ShortPreset[] = [
    {
        label: "🔥 God Is Fighting For You",
        title: "God Is Fighting For You In The Storm",
        speaker: "Pastor Ronnel",
        ministry: "Pastoral Encouragement",
        scripture: "Exodus 14:14",
        scriptureText: "The Lord will fight for you; you need only to be still.",
        videoUrl: "https://www.youtube.com/watch?v=n0FBb6hnwTo",
        soundTitle: "Goodness of God • Bethel Music",
        duration: "0:45"
    },
    {
        label: "🇵🇭 Diyos Ka Sa Amin",
        title: "Diyos Ka Sa Amin Sa Lahat Ng Panahon",
        speaker: "EPIC Worship Team",
        ministry: "Worship & Arts",
        scripture: "Awit 46:1",
        scriptureText: "Ang Diyos ang ating kanlungan at kalakasan, handang saklolo sa mga kabagabagan.",
        videoUrl: "https://www.youtube.com/watch?v=X2DWxYpTQpQ",
        soundTitle: "Diyos Ka Sa Amin • Hope Filipino Worship",
        duration: "0:50"
    },
    {
        label: "✨ Miracle Worker (Way Maker)",
        title: "He Is Making A Way Where There Is No Way",
        speaker: "Sister Grace Villanueva",
        ministry: "Youth Encounters",
        scripture: "Isaiah 43:19",
        scriptureText: "See, I am doing a new thing! I am making a way in the wilderness and streams in the wasteland.",
        videoUrl: "https://www.youtube.com/watch?v=QM8jQHE5AAk",
        soundTitle: "Way Maker • Sinach",
        duration: "0:40"
    },
    {
        label: "🙌 Walang Ibang Katulad Mo",
        title: "Overflowing Gratitude & Praise",
        speaker: "Brother Mark Anthony",
        ministry: "Life Testimonies",
        scripture: "1 Tesalonica 5:18",
        scriptureText: "Magpasalamat kayo sa lahat ng pagkakataon; sapagkat ito ang kalooban ng Diyos sa inyo.",
        videoUrl: "https://www.youtube.com/watch?v=BMZmyvr5IAM",
        soundTitle: "Salamat, Salamat • Malayang Pilipino",
        duration: "0:38"
    }
];

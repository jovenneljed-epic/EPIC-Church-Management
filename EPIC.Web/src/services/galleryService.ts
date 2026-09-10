/**
 * EPIC Church Management System - Gallery & Visual Kingdom Chronicle Service
 * Cloud-synchronized photo and news story service connecting to Microsoft SQL Server
 * with client-side canvas compression, optimistic updates, and offline caching.
 */

import { API_BASE_URL } from "../config";

export interface GalleryPhotoStory {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    category: "ALL" | "WORSHIP" | "TECHNOLOGY" | "YOUTH" | "DISCIPLESHIP" | "OUTREACH" | "FAMILY" | "LEADERSHIP" | "NEWS";
    eventLocation: string;
    capturedBy: string;
    badge: "FEATURED STORY" | "BREAKING STORY" | "PRAISE REPORT" | "TECH SPOTLIGHT" | "MISSION DISPATCH" | "COMMUNITY CHRONICLE" | "BEHIND THE SCENES" | "MOMENT";
    likes: number;
    createdDate: string;
    userLiked?: boolean;
}

export interface CreateGalleryStoryRequest {
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    eventLocation: string;
    capturedBy: string;
    badge: string;
}

const GALLERY_STORAGE_KEY = "epic_gallery_stories_v1";
const GALLERY_LIKES_KEY = "epic_gallery_user_likes_v1";
const GALLERY_DELETED_KEY = "epic_gallery_deleted_ids_v1";

export function getDeletedGalleryStoryIds(): number[] {
    try {
        const raw = localStorage.getItem(GALLERY_DELETED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveDeletedGalleryStoryIds(ids: number[]): void {
    try {
        localStorage.setItem(GALLERY_DELETED_KEY, JSON.stringify(ids));
    } catch {
        // ignore
    }
}

export function adminDeleteGalleryStory(storyId: number): boolean {
    const deleted = getDeletedGalleryStoryIds();
    if (!deleted.includes(storyId)) {
        deleted.push(storyId);
        saveDeletedGalleryStoryIds(deleted);
    }
    const current = getStoredStories();
    const updated = current.filter((s) => s.id !== storyId);
    saveStoredStories(updated);

    // Call Cloud Backend
    fetch(`${API_BASE_URL}/gallery/${storyId}`, { method: "DELETE" }).catch(() => {});
    return true;
}

export function adminRestoreAllGalleryStories(): void {
    localStorage.removeItem(GALLERY_DELETED_KEY);
    saveStoredStories(INITIAL_CURATED_STORIES);
}

const INITIAL_CURATED_STORIES: GalleryPhotoStory[] = [
    {
        id: 1,
        title: "Sunday Expository Worship & Congregation-Wide Intercession",
        description: "Over 450 believers filled the sanctuary with unreserved praise as the worship team and pastoral leadership ushered the congregation into deep prayer, scriptural proclamation, and divine encounter.",
        imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80",
        category: "WORSHIP",
        eventLocation: "Main Sanctuary",
        capturedBy: "Brother Daniel (Media Team)",
        badge: "FEATURED STORY",
        likes: 68,
        createdDate: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    },
    {
        id: 2,
        title: "Express Mobile QR Check-In Kiosks Greeting Sanctuary Entrances",
        description: "Sanctuary greeters verify member attendance and welcome first-time families in under 2 seconds with tablet QR scanning synchronized directly with the pastoral management dashboard.",
        imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80",
        category: "TECHNOLOGY",
        eventLocation: "North & South Entrances",
        capturedBy: "IT Operations Team",
        badge: "TECH SPOTLIGHT",
        likes: 52,
        createdDate: new Date(Date.now() - 7 * 3600 * 1000).toISOString()
    },
    {
        id: 3,
        title: "Youth Encounter 2026: 'Unstoppable Generation' Bonfire Rally",
        description: "High school and collegiate youth gathered for an unforgettable night of acoustic worship, surrender prayer, and testimonies around the campfire, breaking free from worldly pressures.",
        imageUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1600&q=80",
        category: "YOUTH",
        eventLocation: "Camp Sinai Grounds",
        capturedBy: "Youth Media Crew",
        badge: "BREAKING STORY",
        likes: 94,
        createdDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
        id: 4,
        title: "Midweek Discipleship & Life Group Scripture Circles",
        description: "Believers gather in warm home altars and fellowship halls across the city, opening God's Word together with the EPIC Academy 4-track discipleship curriculum.",
        imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80",
        category: "DISCIPLESHIP",
        eventLocation: "Fellowship Hall A",
        capturedBy: "Sister Grace Villanueva",
        badge: "COMMUNITY CHRONICLE",
        likes: 41,
        createdDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    },
    {
        id: 5,
        title: "Community Medical Compassion Mission: Serving 500+ Barangay Families",
        description: "Doctor volunteers, nurses, and church servants distributed free pediatric consultations, dental hygiene kits, and grocery food relief packs to over 500 neighborhood families in Jesus' name.",
        imageUrl: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1600&q=80",
        category: "OUTREACH",
        eventLocation: "Barangay San Jose Covered Court",
        capturedBy: "Outreach Compassion Team",
        badge: "MISSION DISPATCH",
        likes: 83,
        createdDate: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
    },
    {
        id: 6,
        title: "Public Water Baptism: 28 New Disciples Boldly Profess Christ",
        description: "Tears of joy and thunderous applause echoed across the courtyard pool as 28 believers took the sacred step of water baptism following completion of Foundations of Faith Track 101.",
        imageUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1600&q=80",
        category: "WORSHIP",
        eventLocation: "Courtyard Baptismal Pool",
        capturedBy: "Pastoral Staff",
        badge: "PRAISE REPORT",
        likes: 112,
        createdDate: new Date(Date.now() - 96 * 3600 * 1000).toISOString()
    },
    {
        id: 7,
        title: "Kids Faith Explorers: Action Praise and Scripture Memory Masters",
        description: "Children worshipping with pure joy, memorizing Psalm 119:105, and building craft models of Noah's Ark with loving Sunday school teachers in our secure kids facility.",
        imageUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1600&q=80",
        category: "FAMILY",
        eventLocation: "Kids Zone Sanctuary",
        capturedBy: "Children's Ministry",
        badge: "MOMENT",
        likes: 59,
        createdDate: new Date(Date.now() - 120 * 3600 * 1000).toISOString()
    },
    {
        id: 8,
        title: "Broadcast Control Booth: Multicam Streaming & High-Definition Audio",
        description: "Behind-the-scenes look at the technical media volunteers mixing audio stems, directing robotic PTZ cameras, and broadcasting live worldwide for overseas members and home altars.",
        imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1600&q=80",
        category: "TECHNOLOGY",
        eventLocation: "Media Production Mezzanine",
        capturedBy: "Tech Operations",
        badge: "BEHIND THE SCENES",
        likes: 47,
        createdDate: new Date(Date.now() - 144 * 3600 * 1000).toISOString()
    }
];

function getUserLikedMap(): Record<number, boolean> {
    try {
        const raw = localStorage.getItem(GALLERY_LIKES_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveUserLikedMap(map: Record<number, boolean>): void {
    try {
        localStorage.setItem(GALLERY_LIKES_KEY, JSON.stringify(map));
    } catch {
        // ignore
    }
}

function getStoredStories(): GalleryPhotoStory[] {
    const deletedIds = getDeletedGalleryStoryIds();
    try {
        const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
        if (raw) {
            const parsed: GalleryPhotoStory[] = JSON.parse(raw);
            return parsed.filter((s) => !deletedIds.includes(s.id));
        }
    } catch {
        // ignore
    }
    return INITIAL_CURATED_STORIES.filter((s) => !deletedIds.includes(s.id));
}

function saveStoredStories(stories: GalleryPhotoStory[]): void {
    try {
        localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(stories));
    } catch {
        // ignore
    }
}

/**
 * Synchronously load initial stories for zero-flicker render
 */
export function getInitialStories(): GalleryPhotoStory[] {
    const stories = getStoredStories();
    const liked = getUserLikedMap();
    const deletedIds = getDeletedGalleryStoryIds();
    return stories
        .filter((s) => !deletedIds.includes(s.id))
        .map((s) => ({
            ...s,
            userLiked: !!liked[s.id]
        }));
}

/**
 * Fetch latest gallery stories from cloud API (SQL Server)
 */
export async function fetchGalleryStories(): Promise<GalleryPhotoStory[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/gallery`);
        if (!res.ok) {
            return getInitialStories();
        }

        const data: any[] = await res.json();
        const liked = getUserLikedMap();
        const deletedIds = getDeletedGalleryStoryIds();

        const stories: GalleryPhotoStory[] = data
            .filter((item) => !deletedIds.includes(item.id || item.Id))
            .map((item) => ({
                id: item.id || item.Id,
                title: item.title || item.Title || "Ministry Moment",
                description: item.description || item.Description || "",
                imageUrl: item.imageUrl || item.ImageUrl || "",
                category: (item.category || item.Category || "WORSHIP").toUpperCase(),
                eventLocation: item.eventLocation || item.EventLocation || "Main Sanctuary",
                capturedBy: item.capturedBy || item.CapturedBy || "EPIC Media",
                badge: (item.badge || item.Badge || "MOMENT").toUpperCase(),
                likes: item.likes || item.Likes || 0,
                createdDate: item.createdDate || item.CreatedDate || new Date().toISOString(),
                userLiked: !!liked[item.id || item.Id]
            }));

        saveStoredStories(stories);
        return stories;
    } catch (e) {
        console.warn("Could not fetch gallery stories from cloud, using cached.", e);
        return getInitialStories();
    }
}

/**
 * Submit a new photo story: optimistic local addition + cloud API persist
 */
export async function submitGalleryStory(
    request: CreateGalleryStoryRequest
): Promise<GalleryPhotoStory> {
    const currentList = getStoredStories();
    const tempId = Date.now();

    const optimisticStory: GalleryPhotoStory = {
        id: tempId,
        title: request.title.trim(),
        description: request.description.trim(),
        imageUrl: request.imageUrl,
        category: (request.category || "WORSHIP").toUpperCase() as any,
        eventLocation: request.eventLocation || "Main Sanctuary",
        capturedBy: request.capturedBy || "Church Member",
        badge: (request.badge || "MOMENT").toUpperCase() as any,
        likes: 1,
        createdDate: new Date().toISOString(),
        userLiked: true
    };

    // Save optimistically
    const updated = [optimisticStory, ...currentList];
    saveStoredStories(updated);

    const liked = getUserLikedMap();
    liked[tempId] = true;
    saveUserLikedMap(liked);

    // Sync to Cloud
    try {
        const res = await fetch(`${API_BASE_URL}/gallery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request)
        });

        if (res.ok) {
            const serverItem = await res.json();
            const serverId = serverItem.id || serverItem.Id;

            // Reconcile temporary ID with real SQL Server ID
            const reconciled = updated.map((s) =>
                s.id === tempId ? { ...s, id: serverId, likes: serverItem.likes || serverItem.Likes || 1 } : s
            );
            saveStoredStories(reconciled);

            delete liked[tempId];
            liked[serverId] = true;
            saveUserLikedMap(liked);

            return { ...optimisticStory, id: serverId };
        }
    } catch (e) {
        console.warn("Could not sync photo story to cloud API, saved locally.", e);
    }

    return optimisticStory;
}

/**
 * Like a photo story: optimistic update + background cloud persist
 */
export async function likeGalleryStory(storyId: number): Promise<{ id: number; likes: number }> {
    const stories = getStoredStories();
    const liked = getUserLikedMap();

    const wasLiked = !!liked[storyId];
    if (wasLiked) {
        delete liked[storyId];
    } else {
        liked[storyId] = true;
    }
    saveUserLikedMap(liked);

    let updatedLikes = 0;
    const updatedStories = stories.map((s) => {
        if (s.id === storyId) {
            const count = wasLiked ? Math.max(0, s.likes - 1) : s.likes + 1;
            updatedLikes = count;
            return { ...s, likes: count, userLiked: !wasLiked };
        }
        return s;
    });

    saveStoredStories(updatedStories);

    // Sync to Cloud in background
    fetch(`${API_BASE_URL}/gallery/${storyId}/like`, { method: "POST" })
        .then((r) => (r.ok ? r.json() : null))
        .then((serverRes) => {
            if (serverRes?.likes !== undefined) {
                const refreshed = updatedStories.map((s) =>
                    s.id === storyId ? { ...s, likes: serverRes.likes } : s
                );
                saveStoredStories(refreshed);
            }
        })
        .catch(() => {});

    return { id: storyId, likes: updatedLikes };
}

/**
 * High-performance client-side image compression
 * Converts large multi-MB camera photos to lightweight, crisp WebP/JPEG (approx 150-300KB)
 * ready for cloud database storage.
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

                // Use WebP if supported, otherwise JPEG
                try {
                    const dataUrl = canvas.toDataURL("image/webp", quality);
                    if (dataUrl.startsWith("data:image/webp")) {
                        resolve(dataUrl);
                        return;
                    }
                } catch {
                    // fallback
                }

                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

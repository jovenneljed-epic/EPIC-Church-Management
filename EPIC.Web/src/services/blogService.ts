const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5109/api";

const STORAGE_KEY = "epic_cms_admin_blogs";

/* =========================
   TYPES
========================= */

export interface BlogPost {
    blogPostId: number;
    title: string;
    slug: string;
    category: string;
    subtitle?: string;
    excerpt: string;
    content: string;
    coverImage: string;
    author: string;
    isPublished: boolean;
    createdDate?: string;
    publishDate: string | null;
}

export interface CreateBlogPostRequest {
    title: string;
    slug?: string;
    category: string;
    subtitle?: string;
    excerpt?: string;
    content: string;
    coverImage?: string;
    author?: string;
    isPublished: boolean;
}

/* =========================
   LOCAL STORAGE HELPERS
========================= */

function getLocalBlogs(): BlogPost[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function saveLocalBlogs(blogs: BlogPost[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs));
    } catch (e) {
        console.warn("Could not save to localStorage", e);
    }
}

/* =========================
   API HELPER
========================= */

async function apiRequest<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem("token");

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "API request failed");
    }

    return response.json();
}

/* =========================
   ADMIN BLOGS
========================= */

export async function getAdminBlogs(): Promise<BlogPost[]> {
    try {
        const apiBlogs = await apiRequest<BlogPost[]>(`${API_URL}/admin/blog`);
        // Merge or sync with local
        const localBlogs = getLocalBlogs();
        const combinedMap = new Map<number, BlogPost>();
        apiBlogs.forEach((b) => combinedMap.set(b.blogPostId, b));
        localBlogs.forEach((b) => {
            if (!combinedMap.has(b.blogPostId)) {
                combinedMap.set(b.blogPostId, b);
            }
        });
        const result = Array.from(combinedMap.values()).sort(
            (a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
        );
        return result;
    } catch {
        // Fallback to local storage
        return getLocalBlogs();
    }
}

/* =========================
   CREATE BLOG
========================= */

export async function createBlogPost(
    data: CreateBlogPostRequest
): Promise<BlogPost> {
    const generatedSlug = (data.slug || data.title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const newPost: BlogPost = {
        blogPostId: Date.now(),
        title: data.title,
        slug: generatedSlug,
        category: data.category || "Faith & Life",
        subtitle: data.subtitle || data.excerpt || "",
        excerpt: data.excerpt || data.subtitle || "",
        content: data.content,
        coverImage: data.coverImage || "https://epic-cms.vercel.app/images/og/epic-main-tagline.jpg",
        author: data.author || "Pastor Ronnel M. Aviguetero",
        isPublished: data.isPublished,
        createdDate: new Date().toISOString(),
        publishDate: data.isPublished ? new Date().toISOString() : null
    };

    // Save locally immediately
    const existing = getLocalBlogs();
    saveLocalBlogs([newPost, ...existing]);

    // Try posting to API if available
    try {
        const apiResponse = await apiRequest<BlogPost>(`${API_URL}/admin/blog`, {
            method: "POST",
            body: JSON.stringify({
                ...data,
                slug: generatedSlug
            })
        });
        return apiResponse;
    } catch {
        // Return locally generated post if API is offline
        return newPost;
    }
}

/* =========================
   UPDATE BLOG STATUS / CONTENT
========================= */

export async function updateBlogPost(
    id: number,
    updates: Partial<BlogPost>
): Promise<BlogPost | null> {
    const existing = getLocalBlogs();
    const index = existing.findIndex((b) => b.blogPostId === id);
    if (index !== -1) {
        existing[index] = {
            ...existing[index],
            ...updates,
            publishDate: updates.isPublished ? (existing[index].publishDate || new Date().toISOString()) : existing[index].publishDate
        };
        saveLocalBlogs(existing);
        return existing[index];
    }
    return null;
}

/* =========================
   DELETE BLOG
========================= */

export async function deleteBlogPost(id: number): Promise<boolean> {
    const existing = getLocalBlogs();
    const filtered = existing.filter((b) => b.blogPostId !== id);
    saveLocalBlogs(filtered);
    return true;
}

/* =========================
   PUBLIC BLOGS
========================= */

export async function getPublicBlogs(): Promise<BlogPost[]> {
    try {
        const apiBlogs = await apiRequest<BlogPost[]>(`${API_URL}/blog`);
        const localBlogs = getLocalBlogs().filter((b) => b.isPublished);
        const map = new Map<string, BlogPost>();
        apiBlogs.forEach((b) => map.set(b.slug, b));
        localBlogs.forEach((b) => {
            if (!map.has(b.slug)) {
                map.set(b.slug, b);
            }
        });
        return Array.from(map.values());
    } catch {
        return getLocalBlogs().filter((b) => b.isPublished);
    }
}
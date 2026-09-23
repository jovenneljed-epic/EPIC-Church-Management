const getApiBaseUrl = (): string => {
    // Browser runtime check FIRST
    // When loaded on Vercel or any public domain, route through /api/proxy
    // This permanently prevents Philippine ISPs (e.g. PLDT) from timing out on Render's IP (216.24.57.18)
    if (typeof window !== "undefined" && window.location) {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "http://localhost:5109/api";
        }
        return `${window.location.origin}/api/proxy`;
    }

    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    return "https://epic-api-m2av.onrender.com/api";
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;

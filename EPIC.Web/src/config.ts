const getApiBaseUrl = (): string => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "http://localhost:5109/api";
        }
    }

    return "https://epic-api-m2av.onrender.com/api";
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;


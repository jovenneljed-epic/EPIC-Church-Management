import { API_BASE_URL } from "../config";

export interface ApiOptions extends RequestInit {
    body?: BodyInit | null;
}

function getValidToken(): string | null {
    const keys = ["token", "accessToken", "jwt", "authToken", "epicToken"];
    if (typeof localStorage !== "undefined") {
        for (const k of keys) {
            const val = localStorage.getItem(k);
            if (val) return val.replace(/^Bearer\s+/i, "").trim();
        }
    }
    if (typeof sessionStorage !== "undefined") {
        for (const k of keys) {
            const val = sessionStorage.getItem(k);
            if (val) return val.replace(/^Bearer\s+/i, "").trim();
        }
    }
    return null;
}

export async function apiClient(
    endpoint: string,
    options: ApiOptions = {}
): Promise<Response> {
    const token = getValidToken();

    const headers = new Headers(
        options.headers || {}
    );

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    headers.set(
        "Accept",
        "application/json"
    );

    const baseUrl = API_BASE_URL.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    const response = await fetch(
        `${baseUrl}${cleanEndpoint}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {
        // Do not force immediate redirect if running in background queries, but clean stale token
        console.warn("API request returned 401 Unauthorized for:", endpoint);
    }

    return response;
}

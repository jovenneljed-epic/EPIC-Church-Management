import { API_BASE_URL } from "../config";

export async function apiRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem("token");

    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    let data: unknown = null;

    const contentType =
        response.headers.get("content-type");

    if (
        contentType &&
        contentType.includes("application/json")
    ) {
        try {
            data = await response.json();
        } catch {
            data = null;
        }
    } else {
        try {
            const text = await response.text();
            data = text ? text : null;
        } catch {
            data = null;
        }
    }

    if (!response.ok) {
        let message = `API request failed with status ${response.status}.`;

        if (typeof data === "string" && data.trim()) {
            message = data;
        } else if (
            typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof data.message === "string"
        ) {
            message = data.message;
        } else if (
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
        ) {
            message = data.error;
        }

        throw new Error(message);
    }

    return data as T;
}

export function getApiBaseUrl(): string {
    return API_BASE_URL;
}

export function getAuthToken(): string | null {
    return localStorage.getItem("token");
}

export function isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
}

export function logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentRole");

    window.location.href = "/login";
}
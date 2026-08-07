import { API_BASE_URL } from "../config";
export interface ApiOptions extends RequestInit {
    body?: BodyInit | null;
}

export async function apiClient(
    endpoint: string,
    options: ApiOptions = {}
): Promise<Response> {

    const token = localStorage.getItem("token");

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

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {

        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("currentFullName");
        localStorage.removeItem("currentRole");
        localStorage.removeItem("currentRoleId");

        window.location.href = "/login";

        throw new Error(
            "Your session has expired. Please login again."
        );
    }

    return response;
}
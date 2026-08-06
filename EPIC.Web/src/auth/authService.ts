import { API_BASE_URL } from "../config";

export interface LoginResponse {
    message: string;
    userId: number;
    username: string;
    fullName: string;
    roleId: number;
    role: string;
    token: string;
}

export async function login(
    username: string,
    password: string
): Promise<LoginResponse> {

    const response = await fetch(
        `${API_BASE_URL}/Auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                username: username.trim(),
                password,
            }),
        }
    );

    let data: any = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            (typeof data === "string"
                ? data
                : "Invalid username or password.")
        );
    }

    if (!data?.token) {
        throw new Error(
            "Login succeeded but no authentication token was returned."
        );
    }

    // Save authentication information
    localStorage.setItem("token", data.token);
    localStorage.setItem(
        "currentUser",
        data.username || username.trim()
    );
    localStorage.setItem(
        "currentUserId",
        String(data.userId)
    );
    localStorage.setItem(
        "currentFullName",
        data.fullName || ""
    );
    localStorage.setItem(
        "currentRole",
        data.role || ""
    );
    localStorage.setItem(
        "currentRoleId",
        String(data.roleId)
    );

    return data as LoginResponse;
}

export function logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentFullName");
    localStorage.removeItem("currentRole");
    localStorage.removeItem("currentRoleId");
}

export function getToken(): string | null {
    return localStorage.getItem("token");
}

export function isAuthenticated(): boolean {
    const token = getToken();

    return !!token;
}

export function getCurrentUser() {
    return {
        userId: localStorage.getItem("currentUserId"),
        username: localStorage.getItem("currentUser"),
        fullName: localStorage.getItem("currentFullName"),
        role: localStorage.getItem("currentRole"),
        roleId: localStorage.getItem("currentRoleId"),
    };
}
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
                "Accept": "application/json"
            },

            body: JSON.stringify({
                username: username.trim(),
                password
            })
        }
    );

    let data: any = null;

    try {
        data = await response.json();
    }
    catch {
        data = null;
    }

    if (!response.ok) {

        throw new Error(
            data?.message ||
            data?.error ||
            "Invalid username or password."
        );
    }

    const token =
        data?.token ||
        data?.accessToken ||
        data?.jwt;

    if (!token) {

        throw new Error(
            "Login succeeded but no authentication token was returned."
        );
    }

    localStorage.setItem(
        "token",
        token
    );

    localStorage.setItem(
        "currentUser",
        data?.username ||
        data?.userName ||
        username.trim()
    );

    localStorage.setItem(
        "currentFullName",
        data?.fullName || ""
    );

    localStorage.setItem(
        "currentRole",
        data?.role || ""
    );

    localStorage.setItem(
        "currentUserId",
        String(data?.userId ?? "")
    );

    localStorage.setItem(
        "currentRoleId",
        String(data?.roleId ?? "")
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

    window.location.href = "/login";
}

export function getToken(): string | null {

    return localStorage.getItem("token");
}

export function isAuthenticated(): boolean {

    return !!getToken();
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    userId: number;
    username: string;
    fullName: string;
    roleId: number;
    role: string;
    token: string;
}

export interface CurrentUser {
    userId: number;
    username: string;
    fullName: string;
    roleId: number;
    role: string;
}

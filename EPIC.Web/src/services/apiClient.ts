import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5109/api";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

apiClient.interceptors.request.use(
    (config) => {

        const keys = [
            "token",
            "accessToken",
            "jwt",
            "authToken",
            "epicToken",
        ];

        let token: string | null = null;

        for (const key of keys) {

            const value = localStorage.getItem(key);

            if (value) {
                token = value
                    .replace(/^Bearer\s+/i, "")
                    .trim();

                break;
            }
        }

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


apiClient.interceptors.response.use(
    (response) => response,

    (error) => {

        if (error.response?.status === 401) {

            console.error(
                "EPIC API: JWT authentication failed."
            );

            console.error(
                "Request:",
                error.config?.url
            );

            console.error(
                "Stored token keys:",
                [
                    "token",
                    "accessToken",
                    "jwt",
                    "authToken",
                    "epicToken",
                ].map(key => ({
                    key,
                    exists: !!localStorage.getItem(key)
                }))
            );
        }

        return Promise.reject(error);
    }
);
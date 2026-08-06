import type {
    Member,
    Ministry,
    MinistryMember,
    MinistrySummary,
    PerformanceRating
} from "../types/ministry";

// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://192.168.1.10:5109/api";

// ============================================================
// AUTHENTICATION
// ============================================================

const getToken = (): string => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("epicToken") ||
        ""
    );
};

// ============================================================
// HEADERS
// ============================================================

const getHeaders = (): HeadersInit => {

    const token = getToken();

    return {
        "Content-Type": "application/json",

        ...(token
            ? {
                Authorization: `Bearer ${token}`
            }
            : {})
    };
};

// ============================================================
// API ERROR
// ============================================================

export class MinistryApiError extends Error {

    status: number;

    constructor(
        message: string,
        status: number
    ) {

        super(message);

        this.name = "MinistryApiError";
        this.status = status;
    }
}

// ============================================================
// ERROR MESSAGE PARSER
// ============================================================

const getErrorMessage = async (
    response: Response,
    fallback: string
): Promise<string> => {

    try {

        const text = await response.text();

        if (!text) {
            return fallback;
        }

        try {

            const json = JSON.parse(text);

            /*
             * ASP.NET Core ProblemDetails
             */
            if (json.errors) {

                const validationMessages =
                    Object.values(json.errors)
                        .flat()
                        .filter(Boolean)
                        .join(" ");

                if (validationMessages) {
                    return validationMessages;
                }
            }

            return (
                json.message ||
                json.title ||
                json.error ||
                fallback
            );

        } catch {

            return text;
        }

    } catch {

        return fallback;
    }
};

// ============================================================
// GENERIC REQUEST
// ============================================================

const request = async <T>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {

    let response: Response;

    try {

        response = await fetch(
            url,
            {
                ...options,

                headers: {
                    ...getHeaders(),
                    ...(options.headers || {})
                }
            }
        );

    } catch {

        throw new MinistryApiError(
            "Unable to connect to the EPIC API. Please make sure the API server is running.",
            0
        );
    }

    // ========================================================
    // AUTHORIZATION
    // ========================================================

    if (response.status === 401) {

        throw new MinistryApiError(
            "Your session has expired. Please log in again.",
            401
        );
    }

    if (response.status === 403) {

        throw new MinistryApiError(
            "You do not have permission to perform this action.",
            403
        );
    }

    // ========================================================
    // NOT FOUND
    // ========================================================

    if (response.status === 404) {

        throw new MinistryApiError(
            await getErrorMessage(
                response,
                "The requested EPIC resource was not found."
            ),
            404
        );
    }

    // ========================================================
    // OTHER API ERRORS
    // ========================================================

    if (!response.ok) {

        throw new MinistryApiError(
            await getErrorMessage(
                response,
                "An EPIC API request failed."
            ),
            response.status
        );
    }

    // ========================================================
    // EMPTY RESPONSE
    // ========================================================

    if (response.status === 204) {

        return undefined as T;
    }

    // ========================================================
    // JSON RESPONSE
    // ========================================================

    const text = await response.text();

    if (!text) {
        return undefined as T;
    }

    try {

        return JSON.parse(text) as T;

    } catch {

        throw new MinistryApiError(
            "The EPIC API returned an invalid response.",
            response.status
        );
    }
};

// ============================================================
// TYPES FOR API PAYLOADS
// ============================================================

export type MinistryPayload = {
    name: string;
    ministryHead: string;
    description: string;
    status: string;
};

export type AssignMemberPayload = {
    ministryId: number;
    memberId: number;
    role: string;
    position: string;
    status: string;
    notes: string;
    dateAssigned: string;
};

// ============================================================
// MINISTRY API
// ============================================================

export const ministryApi = {

    // ========================================================
    // MINISTRIES
    // ========================================================

    getMinistries: (): Promise<Ministry[]> =>
        request<Ministry[]>(
            `${API_BASE}/Ministry`
        ),

    createMinistry: (
        payload: MinistryPayload
    ): Promise<Ministry> =>
        request<Ministry>(
            `${API_BASE}/Ministry`,
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        ),

    updateMinistry: (
        ministryId: number,
        payload: MinistryPayload
    ): Promise<Ministry> =>
        request<Ministry>(
            `${API_BASE}/Ministry/${ministryId}`,
            {
                method: "PUT",
                body: JSON.stringify(payload)
            }
        ),

    deactivateMinistry: (
        ministryId: number
    ): Promise<void> =>
        request<void>(
            `${API_BASE}/Ministry/${ministryId}`,
            {
                method: "DELETE"
            }
        ),

    // ========================================================
    // MEMBERS
    // ========================================================

    getMembers: (): Promise<Member[]> =>
        request<Member[]>(
            `${API_BASE}/Members`
        ),

    getMinistryMembers: async (
        ministryId: number
    ): Promise<MinistryMember[]> => {

        const data =
            await request<unknown>(
                `${API_BASE}/MinistryMember/ministry/${ministryId}`
            );

        // Normal array response
        if (Array.isArray(data)) {
            return data as MinistryMember[];
        }

        // Wrapped API response
        if (
            typeof data === "object" &&
            data !== null
        ) {

            const response =
                data as {
                    members?: MinistryMember[];
                    ministryMembers?: MinistryMember[];
                    data?: MinistryMember[];
                };

            return (
                response.members ||
                response.ministryMembers ||
                response.data ||
                []
            );
        }

        return [];
    },

    assignMember: (
        payload: AssignMemberPayload
    ): Promise<MinistryMember> =>
        request<MinistryMember>(
            `${API_BASE}/MinistryMember`,
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        ),

    deactivateMember: (
        ministryMemberId: number
    ): Promise<void> =>
        request<void>(
            `${API_BASE}/MinistryMember/${ministryMemberId}`,
            {
                method: "DELETE"
            }
        ),

    // ========================================================
    // PERFORMANCE
    // ========================================================

    getMinistrySummary: (
        ministryId: number
    ): Promise<MinistrySummary> =>
        request<MinistrySummary>(
            `${API_BASE}/MinistryPerformance/ministry/${ministryId}/summary`
        ),

    getPerformanceHistory:
        async (
            ministryMemberId: number
        ): Promise<PerformanceRating[]> => {

            const data =
                await request<unknown>(
                    `${API_BASE}/MinistryPerformance/member/${ministryMemberId}`
                );

            if (Array.isArray(data)) {
                return data as PerformanceRating[];
            }

            if (
                typeof data === "object" &&
                data !== null
            ) {

                const response =
                    data as {
                        ratings?: PerformanceRating[];
                        data?: PerformanceRating[];
                    };

                return (
                    response.ratings ||
                    response.data ||
                    []
                );
            }

            return [];
        },

    createPerformance: (
        payload: PerformanceRating
    ): Promise<PerformanceRating> =>
        request<PerformanceRating>(
            `${API_BASE}/MinistryPerformance`,
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        ),

    updatePerformance: (
        performanceRatingId: number,
        payload: PerformanceRating
    ): Promise<PerformanceRating> =>
        request<PerformanceRating>(
            `${API_BASE}/MinistryPerformance/${performanceRatingId}`,
            {
                method: "PUT",
                body: JSON.stringify(payload)
            }
        ),

    deletePerformance: (
        performanceRatingId: number
    ): Promise<void> =>
        request<void>(
            `${API_BASE}/MinistryPerformance/${performanceRatingId}`,
            {
                method: "DELETE"
            }
        )
};
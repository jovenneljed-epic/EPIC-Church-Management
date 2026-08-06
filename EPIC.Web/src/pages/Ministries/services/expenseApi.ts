import axios, {
    AxiosError,
    type AxiosInstance,
    type InternalAxiosRequestConfig,
} from "axios";

// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://192.168.1.10:5109/api";

// ============================================================
// TOKEN
// ============================================================

const getToken = (): string | null => {
    const keys = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken",
    ];

    for (const key of keys) {
        const value = localStorage.getItem(key);

        if (value && value.trim()) {
            return value
                .replace(/^Bearer\s+/i, "")
                .trim();
        }
    }

    return null;
};

// ============================================================
// AXIOS INSTANCE
// ============================================================

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        Accept: "application/json",
    },
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {

        const token = getToken();

        if (token) {
            config.headers.set(
                "Authorization",
                `Bearer ${token}`
            );
        }

        // Don't force JSON for FormData
        if (
            config.data &&
            !(config.data instanceof FormData)
        ) {
            config.headers.set(
                "Content-Type",
                "application/json"
            );
        }

        // DEBUG
        console.log(
            "EPIC API REQUEST:",
            config.method?.toUpperCase(),
            `${config.baseURL}${config.url}`
        );

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
    (response) => {

        console.log(
            "EPIC API RESPONSE:",
            response.status,
            response.config.url
        );

        return response;
    },

    (error: AxiosError) => {

        console.error(
            "EPIC API ERROR:",
            error.config?.url,
            error.response?.status,
            error.message
        );

        // Unauthorized
        if (error.response?.status === 401) {

            localStorage.removeItem("token");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("jwt");
            localStorage.removeItem("authToken");
            localStorage.removeItem("epicToken");

            localStorage.removeItem("currentUser");
            localStorage.removeItem("currentFullName");
            localStorage.removeItem("currentRole");
            localStorage.removeItem("userId");
            localStorage.removeItem("roleId");
        }

        return Promise.reject(error);
    }
);

// ============================================================
// TYPES
// ============================================================

export interface Expense {
    expenseId: number;
    expenseCode: string;
    expenseDate: string;
    category: string;
    description: string;
    amount: number;
    payee: string;
    paymentMethod: string;
    referenceNumber: string;
    ministry: string;
    notes: string;
    status: string;
    recordedBy: string;
    createdDate?: string | null;
    updatedDate?: string | null;
}

export interface ExpenseSummary {
    totalExpenses: number;
    totalAmount: number;
    approvedAmount: number;
    pendingAmount: number;
    rejectedAmount: number;
}

export interface ExpenseRangeSummary {
    startDate: string;
    endDate: string;

    totalExpenses: number;
    totalAmount: number;

    approvedExpenses: number;
    approvedAmount: number;

    pendingExpenses: number;
    pendingAmount: number;

    rejectedExpenses: number;
    rejectedAmount: number;

    expenses?: Expense[];
}

export interface MonthlyFinancialDashboard {
    year: number;
    month: number;
    monthName?: string;

    totalGiving: number;
    totalExpenses: number;
    netChurchFunds: number;

    givingCount?: number;
    expenseCount?: number;

    approvedExpenses?: number;
    pendingExpenses?: number;
    rejectedExpenses?: number;

    expenses?: Expense[];
}

// ============================================================
// REQUEST TYPES
// ============================================================

export interface CreateExpenseRequest {
    expenseCode?: string;
    expenseDate: string;
    category: string;
    description: string;
    amount: number;
    payee: string;
    paymentMethod: string;
    referenceNumber?: string;
    ministry?: string;
    notes?: string;
    status?: string;
}

export interface UpdateExpenseRequest {
    expenseDate?: string;
    category?: string;
    description?: string;
    amount?: number;
    payee?: string;
    paymentMethod?: string;
    referenceNumber?: string;
    ministry?: string;
    notes?: string;
    status?: string;
}

// ============================================================
// EXPENSE API
// ============================================================

export const expenseApi = {

    // ========================================================
    // GET ALL
    // ========================================================

    async getExpenses(): Promise<Expense[]> {

        const response =
            await api.get<Expense[]>(
                "/Expenses"
            );

        return Array.isArray(response.data)
            ? response.data
            : [];
    },

    // ========================================================
    // GET BY ID
    // ========================================================

    async getExpense(
        expenseId: number
    ): Promise<Expense> {

        const response =
            await api.get<Expense>(
                `/Expenses/${expenseId}`
            );

        return response.data;
    },

    // ========================================================
    // CREATE
    // ========================================================

    async createExpense(
        data: CreateExpenseRequest
    ): Promise<Expense> {

        const response =
            await api.post<Expense>(
                "/Expenses",
                data
            );

        return response.data;
    },

    // ========================================================
    // UPDATE
    // ========================================================

    async updateExpense(
        expenseId: number,
        data: UpdateExpenseRequest
    ): Promise<Expense> {

        const response =
            await api.put<Expense>(
                `/Expenses/${expenseId}`,
                data
            );

        return response.data;
    },

    // ========================================================
    // DELETE
    // ========================================================

    async deleteExpense(
        expenseId: number
    ): Promise<void> {

        await api.delete(
            `/Expenses/${expenseId}`
        );
    },

    // ========================================================
    // SUMMARY
    // ========================================================

    async getSummary(): Promise<ExpenseSummary> {

        const response =
            await api.get<ExpenseSummary>(
                "/Expenses/summary"
            );

        return response.data;
    },

    // ========================================================
    // RANGE SUMMARY
    // ========================================================

    async getRangeSummary(
        startDate: string,
        endDate: string
    ): Promise<ExpenseRangeSummary> {

        const response =
            await api.get<ExpenseRangeSummary>(
                "/Expenses/range-summary",
                {
                    params: {
                        startDate,
                        endDate,
                    },
                }
            );

        return response.data;
    },

    // ========================================================
    // MONTHLY FINANCIAL DASHBOARD
    // ========================================================

    async getMonthlyFinancialDashboard(
        year: number,
        month: number
    ): Promise<MonthlyFinancialDashboard> {

        const response =
            await api.get<MonthlyFinancialDashboard>(
                "/Expenses/monthly-financial-dashboard",
                {
                    params: {
                        year,
                        month,
                    },
                }
            );

        return response.data;
    },

    // ========================================================
    // BY DATE RANGE
    // ========================================================

    async getByDateRange(
        startDate: string,
        endDate: string
    ): Promise<Expense[]> {

        const response =
            await api.get<Expense[]>(
                "/Expenses/by-date-range",
                {
                    params: {
                        startDate,
                        endDate,
                    },
                }
            );

        return Array.isArray(response.data)
            ? response.data
            : [];
    },

    // ========================================================
    // BY CATEGORY
    // ========================================================

    async getByCategory(
        category: string
    ): Promise<Expense[]> {

        const response =
            await api.get<Expense[]>(
                "/Expenses/by-category",
                {
                    params: {
                        category,
                    },
                }
            );

        return Array.isArray(response.data)
            ? response.data
            : [];
    },

    // ========================================================
    // BY MINISTRY
    // ========================================================

    async getByMinistry(
        ministry: string
    ): Promise<Expense[]> {

        const response =
            await api.get<Expense[]>(
                "/Expenses/by-ministry",
                {
                    params: {
                        ministry,
                    },
                }
            );

        return Array.isArray(response.data)
            ? response.data
            : [];
    },

    // ========================================================
    // APPROVE
    // ========================================================

    async approveExpense(
        expenseId: number
    ): Promise<Expense> {

        const response =
            await api.put<Expense>(
                `/Expenses/${expenseId}/approve`
            );

        return response.data;
    },

    // ========================================================
    // REJECT
    // ========================================================

    async rejectExpense(
        expenseId: number
    ): Promise<Expense> {

        const response =
            await api.put<Expense>(
                `/Expenses/${expenseId}/reject`
            );

        return response.data;
    },
};

export default expenseApi;
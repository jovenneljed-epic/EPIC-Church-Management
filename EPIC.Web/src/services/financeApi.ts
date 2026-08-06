const API_BASE_URL = "http://192.168.1.10:5109/api";

function getToken(): string {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("epicToken") ||
        ""
    );
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");

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
            headers,
        }
    );

    const text = await response.text();

    let data: any = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error ||
            data?.title ||
            (typeof data === "string"
                ? data
                : `Server returned ${response.status}`);

        throw new Error(message);
    }

    return data as T;
}

export type GivingRecord = {
    givingId: number;
    memberId: number | null;
    memberCode: string;
    memberName: string;
    churchServiceId: number | null;
    serviceName: string;
    givingType: string;
    amount: number;
    givingDate: string;
    paymentMethod: string;
    referenceNumber: string;
    notes: string;
    recordedBy: string;
    recordedDate: string;
};

export type GivingDashboard = {
    totalGiving: number;
    todayGiving: number;
    monthlyGiving: number;

    totalRecords: number;
    todayRecords: number;
    monthlyRecords: number;

    tithes: number;
    offerings: number;
    missions: number;
    specialOfferings: number;
    pledges: number;
    other: number;
};

export type IncomeRecord = {
    incomeId: number;
    category: string;
    description: string;
    amount: number;
    incomeDate: string;
    paymentMethod: string;
    referenceNumber: string;
    recordedBy: string;
    recordedDate: string;
};

export type IncomeDashboard = {
    totalIncome: number;
    todayIncome: number;
    monthlyIncome: number;

    totalRecords: number;
    todayRecords: number;
    monthlyRecords: number;

    categoryBreakdown: {
        category: string;
        total: number;
        records: number;
    }[];

    totalExpenses: number;
    todayExpenses: number;
    monthlyExpenses: number;

    totalExpenseRecords: number;
    todayExpenseRecords: number;
    monthlyExpenseRecords: number;

    netChurchFunds: number;
    todayNetFunds: number;
    monthlyNetFunds: number;
};

export type Expense = {
    expenseId: number;
    category: string;
    description: string;
    amount: number;
    expenseDate: string;
    paymentMethod: string;
    referenceNumber: string;
    recordedBy: string;
    recordedDate?: string;
};

export type ExpenseSummary = {
    totalRecords: number;
    totalExpenses: number;
    todayExpenses: number;
    monthlyExpenses: number;
};

export const financeApi = {

    // =====================================================
    // GIVING
    // =====================================================

    getGiving: () =>
        request<GivingRecord[]>("/Giving"),

    getGivingDashboard: () =>
        request<GivingDashboard>(
            "/Giving/dashboard"
        ),

    createGiving: (data: any) =>
        request<GivingRecord>(
            "/Giving",
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        ),

    updateGiving: (
        id: number,
        data: any
    ) =>
        request<GivingRecord>(
            `/Giving/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(data),
            }
        ),

    deleteGiving: (id: number) =>
        request<void>(
            `/Giving/${id}`,
            {
                method: "DELETE",
            }
        ),

    // =====================================================
    // INCOME
    // =====================================================

    getIncome: () =>
        request<IncomeRecord[]>("/Income"),

    getIncomeDashboard: () =>
        request<IncomeDashboard>(
            "/Income/dashboard"
        ),

    createIncome: (data: any) =>
        request<IncomeRecord>(
            "/Income",
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        ),

    updateIncome: (
        id: number,
        data: any
    ) =>
        request<IncomeRecord>(
            `/Income/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(data),
            }
        ),

    deleteIncome: (id: number) =>
        request<void>(
            `/Income/${id}`,
            {
                method: "DELETE",
            }
        ),

    // =====================================================
    // EXPENSES
    // =====================================================

    getExpenses: () =>
        request<Expense[]>("/Expenses"),

    getExpenseSummary: () =>
        request<ExpenseSummary>(
            "/Expenses/summary"
        ),

    createExpense: (data: any) =>
        request<Expense>(
            "/Expenses",
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        ),

    updateExpense: (
        id: number,
        data: any
    ) =>
        request<Expense>(
            `/Expenses/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(data),
            }
        ),

    deleteExpense: (id: number) =>
        request<void>(
            `/Expenses/${id}`,
            {
                method: "DELETE",
            }
        ),
};
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import "./Expenses.css";

/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_BASE_URL =
    "http://192.168.1.10:5109/api";

/*
 * IMPORTANT:
 *
 * API_BASE_URL already contains /api.
 *
 * CORRECT:
 * /Expenses
 * /Expenses/dashboard
 *
 * WRONG:
 * /api/Expenses
 * /api/Expenses/dashboard
 *
 * Otherwise you get:
 * /api/api/Expenses
 */

/* =========================================================
   CONSTANTS
   ========================================================= */

const EXPENSE_CATEGORIES = [
    {
        value: "UTILITIES",
        label: "Utilities",
    },
    {
        value: "SUPPLIES",
        label: "Supplies",
    },
    {
        value: "SALARY",
        label: "Salary",
    },
    {
        value: "MINISTRY",
        label: "Ministry",
    },
    {
        value: "MAINTENANCE",
        label: "Maintenance",
    },
    {
        value: "TRANSPORTATION",
        label: "Transportation",
    },
    {
        value: "FOOD",
        label: "Food",
    },
    {
        value: "OTHER",
        label: "Other",
    },
] as const;

const PAYMENT_METHODS = [
    {
        value: "CASH",
        label: "Cash",
    },
    {
        value: "BANK TRANSFER",
        label: "Bank Transfer",
    },
    {
        value: "GCASH",
        label: "GCash",
    },
    {
        value: "CHECK",
        label: "Check",
    },
    {
        value: "CARD",
        label: "Card",
    },
    {
        value: "OTHER",
        label: "Other",
    },
] as const;

/* =========================================================
   TYPES
   ========================================================= */

type ExpenseRecord = {
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

type ExpenseDashboard = {
    totalExpenses: number;
    todayExpenses: number;
    monthlyExpenses: number;

    totalRecords: number;
    todayRecords: number;
    monthlyRecords: number;

    categoryBreakdown?: {
        category: string;
        total: number;
        records?: number;
    }[];
};

type FormData = {
    category: string;
    description: string;
    amount: string;
    expenseDate: string;
    paymentMethod: string;
    referenceNumber: string;
};

/* =========================================================
   DATE
   ========================================================= */

function getToday(): string {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* =========================================================
   EMPTY FORM
   ========================================================= */

function createEmptyForm(): FormData {
    return {
        category: "UTILITIES",
        description: "",
        amount: "",
        expenseDate: getToday(),
        paymentMethod: "CASH",
        referenceNumber: "",
    };
}

/* =========================================================
   AUTH
   ========================================================= */

function getToken(): string | null {
    const keys = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken",
    ];

    for (const key of keys) {
        const value =
            localStorage.getItem(key);

        if (value) {
            return value
                .replace(/^Bearer\s+/i, "")
                .trim();
        }
    }

    return null;
}

/* =========================================================
   API FETCH
   ========================================================= */

async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {

    const token = getToken();

    const headers = new Headers(
        options.headers || {}
    );

    headers.set(
        "Accept",
        "application/json"
    );

    if (
        options.body &&
        !headers.has("Content-Type")
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    /*
     * endpoint must be:
     *
     * /Expenses
     * /Expenses/dashboard
     *
     * NOT:
     *
     * /api/Expenses
     */

    const fullUrl =
        `${API_BASE_URL}${endpoint}`;

    console.log(
        "EPIC EXPENSE API:",
        fullUrl
    );

    return fetch(
        fullUrl,
        {
            ...options,
            headers,
        }
    );
}

/* =========================================================
   API ERROR
   ========================================================= */

async function getApiError(
    response: Response,
    fallback: string
): Promise<string> {

    try {

        const text =
            await response.text();

        if (!text) {
            return fallback;
        }

        try {

            const data =
                JSON.parse(text);

            return (
                data?.message ||
                data?.title ||
                data?.error ||
                data?.detail ||
                text ||
                fallback
            );

        } catch {

            return text || fallback;

        }

    } catch {

        return fallback;

    }
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizeCategory(
    value?: string | null
): string {

    const category =
        (value || "")
            .trim()
            .toUpperCase();

    return category || "OTHER";
}

function normalizePaymentMethod(
    value?: string | null
): string {

    const payment =
        (value || "")
            .trim()
            .toUpperCase();

    return payment || "CASH";
}

function normalizeExpense(
    expense: ExpenseRecord
): ExpenseRecord {

    return {

        ...expense,

        expenseId:
            Number(
                expense.expenseId
            ),

        category:
            normalizeCategory(
                expense.category
            ),

        description:
            expense.description || "",

        amount:
            Number(
                expense.amount || 0
            ),

        expenseDate:
            expense.expenseDate || "",

        paymentMethod:
            normalizePaymentMethod(
                expense.paymentMethod
            ),

        referenceNumber:
            expense.referenceNumber || "",

        recordedBy:
            expense.recordedBy ||
            "SYSTEM",

    };
}

/* =========================================================
   FORMATTERS
   ========================================================= */

function money(
    value: number
): string {

    return new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }
    ).format(
        Number(value || 0)
    );
}

function dateOnly(
    value: string
): string {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value.substring(
            0,
            10
        );
    }

    return date.toLocaleDateString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
}

function dateValue(
    value: string
): string {

    if (!value) {
        return "";
    }

    return value.substring(
        0,
        10
    );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function Expenses() {

    const [
        expenses,
        setExpenses,
    ] = useState<ExpenseRecord[]>([]);

    const [
        dashboard,
        setDashboard,
    ] = useState<ExpenseDashboard | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState("");

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        categoryFilter,
        setCategoryFilter,
    ] = useState("ALL");

    const [
        paymentFilter,
        setPaymentFilter,
    ] = useState("ALL");

    const [
        dateFilter,
        setDateFilter,
    ] = useState("");

    const [
        showModal,
        setShowModal,
    ] = useState(false);

    const [
        editingId,
        setEditingId,
    ] = useState<number | null>(null);

    const [
        form,
        setForm,
    ] = useState<FormData>(
        createEmptyForm()
    );

    /* =====================================================
       LOAD EXPENSES
       ===================================================== */

    const loadExpenses =
        useCallback(async () => {

            try {

                setError("");

                /*
                 * CORRECT ENDPOINT
                 *
                 * http://192.168.1.10:5109/api/Expenses
                 */

                const response =
                    await apiFetch(
                        "/Expenses"
                    );

                if (
                    response.status === 401
                ) {

                    throw new Error(
                        "Your session has expired. Please login again."
                    );

                }

                if (
                    response.status === 404
                ) {

                    throw new Error(
                        "Expense API endpoint was not found. Check ExpensesController route."
                    );

                }

                if (!response.ok) {

                    throw new Error(
                        await getApiError(
                            response,
                            "Unable to load expenses."
                        )
                    );

                }

                const data =
                    await response.json();

                const normalized =
                    Array.isArray(data)
                        ? data.map(
                            (
                                item: ExpenseRecord
                            ) =>
                                normalizeExpense(
                                    item
                                )
                        )
                        : [];

                setExpenses(
                    normalized
                );

            } catch (err) {

                console.error(
                    "EXPENSE LOAD ERROR:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load expenses."
                );

            }

        }, []);

    /* =====================================================
       LOAD DASHBOARD
       ===================================================== */

    const loadDashboard =
        useCallback(async () => {

            try {

                /*
                 * CORRECT:
                 *
                 * /api/Expenses/dashboard
                 *
                 * because API_BASE_URL already
                 * contains /api.
                 */

                const response =
                    await apiFetch(
                        "/Expenses/dashboard"
                    );

                if (
                    response.status === 404
                ) {

                    console.warn(
                        "Expense dashboard endpoint does not exist."
                    );

                    return;

                }

                if (!response.ok) {

                    console.warn(
                        "Expense dashboard request failed:",
                        response.status
                    );

                    return;

                }

                const data =
                    await response.json();

                setDashboard(
                    data
                );

            } catch (err) {

                console.warn(
                    "Expense dashboard unavailable:",
                    err
                );

            }

        }, []);

    /* =====================================================
       LOAD ALL
       ===================================================== */

    const loadAll =
        useCallback(async () => {

            setLoading(true);
            setError("");

            await Promise.all([
                loadExpenses(),
                loadDashboard(),
            ]);

            setLoading(false);

        }, [
            loadExpenses,
            loadDashboard,
        ]);

    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    useEffect(() => {

        void loadAll();

    }, [loadAll]);

    /* =====================================================
       AUTO REFRESH
       ===================================================== */

    useEffect(() => {

        const interval =
            window.setInterval(() => {

                void loadExpenses();
                void loadDashboard();

            }, 30000);

        return () => {

            window.clearInterval(
                interval
            );

        };

    }, [
        loadExpenses,
        loadDashboard,
    ]);

    /* =====================================================
       TOTAL EXPENSES
       ===================================================== */

    const totalExpenses =
        useMemo(() => {

            return expenses.reduce(
                (
                    total,
                    expense
                ) =>
                    total +
                    Number(
                        expense.amount || 0
                    ),
                0
            );

        }, [expenses]);

    /* =====================================================
       TODAY
       ===================================================== */

    const todayExpenses =
        useMemo(() => {

            const today =
                getToday();

            return expenses.reduce(
                (
                    total,
                    expense
                ) => {

                    if (
                        dateValue(
                            expense.expenseDate
                        ) === today
                    ) {

                        return (
                            total +
                            Number(
                                expense.amount ||
                                0
                            )
                        );

                    }

                    return total;

                },
                0
            );

        }, [expenses]);

    /* =====================================================
       MONTH
       ===================================================== */

    const monthlyExpenses =
        useMemo(() => {

            const now =
                new Date();

            const year =
                now.getFullYear();

            const month =
                now.getMonth();

            return expenses.reduce(
                (
                    total,
                    expense
                ) => {

                    const date =
                        new Date(
                            expense.expenseDate
                        );

                    if (
                        Number.isNaN(
                            date.getTime()
                        )
                    ) {
                        return total;
                    }

                    if (
                        date.getFullYear() ===
                        year &&
                        date.getMonth() ===
                        month
                    ) {

                        return (
                            total +
                            Number(
                                expense.amount ||
                                0
                            )
                        );

                    }

                    return total;

                },
                0
            );

        }, [expenses]);

    /* =====================================================
       CATEGORY TOTALS
       ===================================================== */

    const categoryTotals =
        useMemo(() => {

            const map =
                new Map<
                    string,
                    {
                        total: number;
                        records: number;
                    }
                >();

            expenses.forEach(
                (expense) => {

                    const category =
                        normalizeCategory(
                            expense.category
                        );

                    const current =
                        map.get(
                            category
                        ) || {
                            total: 0,
                            records: 0,
                        };

                    map.set(
                        category,
                        {
                            total:
                                current.total +
                                Number(
                                    expense.amount ||
                                    0
                                ),

                            records:
                                current.records +
                                1,
                        }
                    );

                }
            );

            return Array.from(
                map.entries()
            )
                .map(
                    ([
                        category,
                        values,
                    ]) => ({
                        category,
                        total:
                            values.total,
                        records:
                            values.records,
                    })
                )
                .sort(
                    (a, b) =>
                        b.total -
                        a.total
                );

        }, [expenses]);

    /* =====================================================
       FILTER
       ===================================================== */

    const filteredExpenses =
        useMemo(() => {

            const searchValue =
                search
                    .trim()
                    .toLowerCase();

            return expenses.filter(
                (expense) => {

                    const category =
                        normalizeCategory(
                            expense.category
                        );

                    const payment =
                        normalizePaymentMethod(
                            expense.paymentMethod
                        );

                    const matchesSearch =
                        !searchValue ||
                        category
                            .toLowerCase()
                            .includes(
                                searchValue
                            ) ||
                        expense.description
                            .toLowerCase()
                            .includes(
                                searchValue
                            ) ||
                        payment
                            .toLowerCase()
                            .includes(
                                searchValue
                            ) ||
                        expense.referenceNumber
                            .toLowerCase()
                            .includes(
                                searchValue
                            ) ||
                        expense.recordedBy
                            .toLowerCase()
                            .includes(
                                searchValue
                            );

                    const matchesCategory =
                        categoryFilter ===
                        "ALL" ||
                        category ===
                        categoryFilter;

                    const matchesPayment =
                        paymentFilter ===
                        "ALL" ||
                        payment ===
                        paymentFilter;

                    const matchesDate =
                        !dateFilter ||
                        dateValue(
                            expense.expenseDate
                        ) ===
                        dateFilter;

                    return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesPayment &&
                        matchesDate
                    );

                }
            );

        }, [
            expenses,
            search,
            categoryFilter,
            paymentFilter,
            dateFilter,
        ]);

    /* =====================================================
       FILTERED TOTAL
       ===================================================== */

    const filteredTotal =
        useMemo(() => {

            return filteredExpenses.reduce(
                (
                    total,
                    expense
                ) =>
                    total +
                    Number(
                        expense.amount || 0
                    ),
                0
            );

        }, [filteredExpenses]);

    /* =====================================================
       DASHBOARD VALUES
       ===================================================== */

    const dashboardTotal =
        Number(
            dashboard?.totalExpenses ??
            totalExpenses
        );

    const dashboardToday =
        Number(
            dashboard?.todayExpenses ??
            todayExpenses
        );

    const dashboardMonthly =
        Number(
            dashboard?.monthlyExpenses ??
            monthlyExpenses
        );

    /* =====================================================
       CATEGORY CARD
       ===================================================== */

    function categoryTotal(
        category: string
    ): number {

        return (
            categoryTotals.find(
                (item) =>
                    item.category ===
                    category
            )?.total || 0
        );

    }

    /* =====================================================
       ADD
       ===================================================== */

    function openAddModal() {

        setEditingId(null);

        setForm(
            createEmptyForm()
        );

        setError("");
        setSuccess("");

        setShowModal(true);

    }

    /* =====================================================
       EDIT
       ===================================================== */

    function openEditModal(
        expense: ExpenseRecord
    ) {

        setEditingId(
            expense.expenseId
        );

        setForm({

            category:
                normalizeCategory(
                    expense.category
                ),

            description:
                expense.description || "",

            amount:
                String(
                    expense.amount || ""
                ),

            expenseDate:
                dateValue(
                    expense.expenseDate
                ) ||
                getToday(),

            paymentMethod:
                normalizePaymentMethod(
                    expense.paymentMethod
                ),

            referenceNumber:
                expense.referenceNumber ||
                "",

        });

        setError("");
        setSuccess("");

        setShowModal(true);

    }

    /* =====================================================
       CLOSE
       ===================================================== */

    function closeModal() {

        if (saving) {
            return;
        }

        setShowModal(false);

        setEditingId(null);

        setForm(
            createEmptyForm()
        );

    }

    /* =====================================================
       UPDATE FORM
       ===================================================== */

    function updateForm(
        field: keyof FormData,
        value: string
    ) {

        setForm(
            (current) => ({
                ...current,
                [field]: value,
            })
        );

    }

    /* =====================================================
       SAVE
       ===================================================== */

    async function saveExpense(
        event: React.FormEvent
    ) {

        event.preventDefault();

        setError("");
        setSuccess("");

        const amount =
            Number(form.amount);

        if (!form.category) {

            setError(
                "Please select an expense category."
            );

            return;

        }

        if (
            !form.description.trim()
        ) {

            setError(
                "Please enter an expense description."
            );

            return;

        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            setError(
                "Please enter a valid expense amount."
            );

            return;

        }

        if (!form.expenseDate) {

            setError(
                "Please select an expense date."
            );

            return;

        }

        setSaving(true);

        try {

            const payload = {

                category:
                    normalizeCategory(
                        form.category
                    ),

                description:
                    form.description.trim(),

                amount,

                expenseDate:
                    form.expenseDate,

                paymentMethod:
                    normalizePaymentMethod(
                        form.paymentMethod
                    ),

                referenceNumber:
                    form.referenceNumber.trim(),

            };

            /*
             * IMPORTANT:
             *
             * CORRECT:
             * /Expenses/5
             *
             * NOT:
             * /api/Expenses/5
             */

            const endpoint =
                editingId !== null
                    ? `/Expenses/${editingId}`
                    : "/Expenses";

            const method =
                editingId !== null
                    ? "PUT"
                    : "POST";

            const response =
                await apiFetch(
                    endpoint,
                    {
                        method,
                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            if (!response.ok) {

                throw new Error(
                    await getApiError(
                        response,
                        editingId !== null
                            ? "Unable to update expense."
                            : "Unable to record expense."
                    )
                );

            }

            setSuccess(
                editingId !== null
                    ? "Expense updated successfully."
                    : "Expense recorded successfully."
            );

            setShowModal(false);

            setEditingId(null);

            setForm(
                createEmptyForm()
            );

            await loadAll();

        } catch (err) {

            console.error(
                "SAVE EXPENSE ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save expense."
            );

        } finally {

            setSaving(false);

        }

    }

    /* =====================================================
       DELETE
       ===================================================== */

    async function deleteExpense(
        expense: ExpenseRecord
    ) {

        const confirmed =
            window.confirm(
                `Delete this expense?\n\n${expense.description}\n${money(
                    expense.amount
                )}`
            );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");

        try {

            const response =
                await apiFetch(
                    `/Expenses/${expense.expenseId}`,
                    {
                        method: "DELETE",
                    }
                );

            if (!response.ok) {

                throw new Error(
                    await getApiError(
                        response,
                        "Unable to delete expense."
                    )
                );

            }

            setSuccess(
                "Expense deleted successfully."
            );

            await loadAll();

        } catch (err) {

            console.error(
                "DELETE EXPENSE ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete expense."
            );

        }

    }

    /* =====================================================
       CLEAR FILTERS
       ===================================================== */

    function clearFilters() {

        setSearch("");

        setCategoryFilter(
            "ALL"
        );

        setPaymentFilter(
            "ALL"
        );

        setDateFilter("");

    }

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="expenses-page">

            {/* HEADER */}

            <div className="expenses-header">

                <div className="expenses-title-section">

                    <div className="expenses-icon">
                        ₱
                    </div>

                    <div>

                        <h1 className="expenses-title">
                            Expenses Management
                        </h1>

                        <p className="expenses-subtitle">
                            Track and manage church
                            operating expenses.
                        </p>

                    </div>

                </div>

                <div className="expenses-header-actions">

                    <button
                        type="button"
                        className="expense-refresh-btn"
                        onClick={() =>
                            void loadAll()
                        }
                        disabled={loading}
                    >
                        ↻ Refresh
                    </button>

                    <button
                        type="button"
                        className="expense-add-btn"
                        onClick={
                            openAddModal
                        }
                    >
                        + Record Expense
                    </button>

                </div>

            </div>

            {/* ALERTS */}

            {error && (

                <div className="expenses-error">

                    <span>⚠</span>

                    <span>
                        {error}
                    </span>

                </div>

            )}

            {success && (

                <div className="expenses-success">

                    <span>✓</span>

                    <span>
                        {success}
                    </span>

                </div>

            )}

            {/* SUMMARY */}

            <div className="expenses-summary">

                <div className="expense-summary-card main-expense-stat">

                    <div className="expense-stat-icon">
                        ₱
                    </div>

                    <div>

                        <span className="expense-summary-label">
                            Total Expenses
                        </span>

                        <strong className="expense-summary-value">
                            {money(
                                dashboardTotal
                            )}
                        </strong>

                        <small>
                            {
                                dashboard
                                    ?.totalRecords ??
                                expenses.length
                            }{" "}
                            records
                        </small>

                    </div>

                </div>

                <div className="expense-summary-card">

                    <span className="expense-summary-label">
                        Today
                    </span>

                    <strong className="expense-summary-value">
                        {money(
                            dashboardToday
                        )}
                    </strong>

                    <small>
                        {
                            dashboard
                                ?.todayRecords ??
                            expenses.filter(
                                (expense) =>
                                    dateValue(
                                        expense.expenseDate
                                    ) ===
                                    getToday()
                            ).length
                        }{" "}
                        records
                    </small>

                </div>

                <div className="expense-summary-card">

                    <span className="expense-summary-label">
                        This Month
                    </span>

                    <strong className="expense-summary-value">
                        {money(
                            dashboardMonthly
                        )}
                    </strong>

                    <small>
                        {
                            dashboard
                                ?.monthlyRecords ??
                            expenses.filter(
                                (expense) => {

                                    const date =
                                        new Date(
                                            expense.expenseDate
                                        );

                                    const now =
                                        new Date();

                                    return (
                                        date.getFullYear() ===
                                        now.getFullYear() &&
                                        date.getMonth() ===
                                        now.getMonth()
                                    );

                                }
                            ).length
                        }{" "}
                        records
                    </small>

                </div>

                <div className="expense-summary-card">

                    <span className="expense-summary-label">
                        Utilities
                    </span>

                    <strong className="expense-summary-value">
                        {money(
                            categoryTotal(
                                "UTILITIES"
                            )
                        )}
                    </strong>

                    <small>
                        Utilities expenses
                    </small>

                </div>

                <div className="expense-summary-card">

                    <span className="expense-summary-label">
                        Ministry
                    </span>

                    <strong className="expense-summary-value">
                        {money(
                            categoryTotal(
                                "MINISTRY"
                            )
                        )}
                    </strong>

                    <small>
                        Ministry expenses
                    </small>

                </div>

                <div className="expense-summary-card">

                    <span className="expense-summary-label">
                        Other Operations
                    </span>

                    <strong className="expense-summary-value">

                        {money(
                            Math.max(
                                0,
                                totalExpenses -
                                categoryTotal(
                                    "UTILITIES"
                                ) -
                                categoryTotal(
                                    "MINISTRY"
                                )
                            )
                        )}

                    </strong>

                    <small>
                        Other operating expenses
                    </small>

                </div>

            </div>

            {/* BREAKDOWN */}

            <div className="expenses-breakdown">

                <div className="breakdown-header">

                    <div>

                        <h2>
                            Expense Breakdown
                        </h2>

                        <p>
                            Total expenses by
                            category.
                        </p>

                    </div>

                </div>

                <div className="expense-breakdown-grid">

                    {categoryTotals.length ===
                        0 ? (

                        <div className="expense-breakdown-empty">
                            No expense data
                            available.
                        </div>

                    ) : (

                        categoryTotals.map(
                            (item) => {

                                const percentage =
                                    totalExpenses >
                                        0
                                        ? Math.round(
                                            (
                                                item.total /
                                                totalExpenses
                                            ) *
                                            100
                                        )
                                        : 0;

                                return (

                                    <div
                                        className="expense-breakdown-item"
                                        key={
                                            item.category
                                        }
                                    >

                                        <div className="breakdown-item-top">

                                            <span
                                                className={`expense-category category-${item.category
                                                    .toLowerCase()
                                                    .replace(
                                                        /\s+/g,
                                                        "-"
                                                    )}`}
                                            >
                                                {
                                                    item.category
                                                }
                                            </span>

                                            <strong>
                                                {money(
                                                    item.total
                                                )}
                                            </strong>

                                        </div>

                                        <div className="breakdown-progress">

                                            <div
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />

                                        </div>

                                        <small>
                                            {
                                                percentage
                                            }%
                                            {" "}
                                            of total
                                            expenses
                                        </small>

                                    </div>

                                );

                            }
                        )

                    )}

                </div>

            </div>

            {/* RECORDS */}

            <div className="expenses-records-card">

                <div className="expenses-records-header">

                    <div>

                        <h2>
                            Expense Records
                        </h2>

                        <p>

                            {
                                filteredExpenses.length
                            }{" "}
                            displayed record
                            {
                                filteredExpenses.length !==
                                    1
                                    ? "s"
                                    : ""
                            }

                            {" • "}

                            {money(
                                filteredTotal
                            )}

                        </p>

                    </div>

                </div>

                {/* FILTERS */}

                <div className="expenses-toolbar">

                    <input
                        className="expense-search"
                        type="text"
                        placeholder="Search description, category, reference..."
                        value={
                            search
                        }
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                    <select
                        value={
                            categoryFilter
                        }
                        onChange={(e) =>
                            setCategoryFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Categories
                        </option>

                        {EXPENSE_CATEGORIES.map(
                            (category) => (

                                <option
                                    key={
                                        category.value
                                    }
                                    value={
                                        category.value
                                    }
                                >
                                    {
                                        category.label
                                    }
                                </option>

                            )
                        )}

                    </select>

                    <select
                        value={
                            paymentFilter
                        }
                        onChange={(e) =>
                            setPaymentFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Payments
                        </option>

                        {PAYMENT_METHODS.map(
                            (method) => (

                                <option
                                    key={
                                        method.value
                                    }
                                    value={
                                        method.value
                                    }
                                >
                                    {
                                        method.label
                                    }
                                </option>

                            )
                        )}

                    </select>

                    <input
                        type="date"
                        value={
                            dateFilter
                        }
                        onChange={(e) =>
                            setDateFilter(
                                e.target.value
                            )
                        }
                    />

                    <button
                        type="button"
                        className="expense-clear-btn"
                        onClick={
                            clearFilters
                        }
                    >
                        Clear
                    </button>

                </div>

                {/* TABLE */}

                <div className="expenses-table-container">

                    <table className="expenses-table">

                        <thead>

                            <tr>

                                <th>Date</th>

                                <th>
                                    Description
                                </th>

                                <th>
                                    Category
                                </th>

                                <th>
                                    Payment
                                </th>

                                <th>
                                    Reference
                                </th>

                                <th>
                                    Amount
                                </th>

                                <th>
                                    Recorded By
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan={8}
                                        className="expenses-empty"
                                    >
                                        Loading
                                        expenses...
                                    </td>

                                </tr>

                            ) : filteredExpenses.length ===
                                0 ? (

                                <tr>

                                    <td
                                        colSpan={8}
                                        className="expenses-empty"
                                    >

                                        <div className="expenses-empty-icon">
                                            ₱
                                        </div>

                                        <h3>
                                            No expenses
                                            found
                                        </h3>

                                        <p>
                                            No expense
                                            records match
                                            your filters.
                                        </p>

                                    </td>

                                </tr>

                            ) : (

                                filteredExpenses.map(
                                    (expense) => (

                                        <tr
                                            key={
                                                expense.expenseId
                                            }
                                        >

                                            <td>
                                                {
                                                    dateOnly(
                                                        expense.expenseDate
                                                    )
                                                }
                                            </td>

                                            <td>

                                                <div className="expense-description">

                                                    <strong>
                                                        {
                                                            expense.description
                                                        }
                                                    </strong>

                                                    <small>
                                                        Expense #
                                                        {
                                                            expense.expenseId
                                                        }
                                                    </small>

                                                </div>

                                            </td>

                                            <td>

                                                <span
                                                    className={`expense-category category-${expense.category
                                                        .toLowerCase()
                                                        .replace(
                                                            /\s+/g,
                                                            "-"
                                                        )}`}
                                                >
                                                    {
                                                        expense.category
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <span className="expense-payment">
                                                    {
                                                        expense.paymentMethod
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    expense.referenceNumber ||
                                                    "—"
                                                }
                                            </td>

                                            <td className="expense-amount">
                                                {money(
                                                    expense.amount
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    expense.recordedBy
                                                }
                                            </td>

                                            <td>

                                                <div className="expense-actions">

                                                    <button
                                                        type="button"
                                                        className="expense-edit-btn"
                                                        onClick={() =>
                                                            openEditModal(
                                                                expense
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="expense-delete-btn"
                                                        onClick={() =>
                                                            void deleteExpense(
                                                                expense
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* MODAL */}

            {showModal && (

                <div
                    className="expense-modal-overlay"
                    onMouseDown={(
                        event
                    ) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }

                    }}
                >

                    <div className="expense-modal">

                        <div className="expense-modal-header">

                            <div>

                                <h2 className="expense-modal-title">

                                    {editingId !==
                                        null
                                        ? "Edit Expense"
                                        : "Record Expense"}

                                </h2>

                                <p className="expense-modal-subtitle">

                                    {editingId !==
                                        null
                                        ? "Update the expense record below."
                                        : "Enter the details of the church expense."}

                                </p>

                            </div>

                            <button
                                type="button"
                                className="expense-modal-close"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form
                            className="expense-form"
                            onSubmit={
                                saveExpense
                            }
                        >

                            <div className="expense-form-grid">

                                <div className="expense-form-group">

                                    <label>
                                        Category *
                                    </label>

                                    <select
                                        value={
                                            form.category
                                        }
                                        onChange={(e) =>
                                            updateForm(
                                                "category",
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                    >

                                        {EXPENSE_CATEGORIES.map(
                                            (category) => (

                                                <option
                                                    key={
                                                        category.value
                                                    }
                                                    value={
                                                        category.value
                                                    }
                                                >
                                                    {
                                                        category.label
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>

                                <div className="expense-form-group">

                                    <label>
                                        Expense Date *
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            form.expenseDate
                                        }
                                        onChange={(e) =>
                                            updateForm(
                                                "expenseDate",
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>

                                <div className="expense-form-group full-width">

                                    <label>
                                        Description *
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="e.g. Electricity Bill"
                                        value={
                                            form.description
                                        }
                                        onChange={(e) =>
                                            updateForm(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>

                                <div className="expense-form-group">

                                    <label>
                                        Amount *
                                    </label>

                                    <div className="amount-input">

                                        <span>
                                            ₱
                                        </span>

                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={
                                                form.amount
                                            }
                                            onChange={(e) =>
                                                updateForm(
                                                    "amount",
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>

                                </div>

                                <div className="expense-form-group">

                                    <label>
                                        Payment Method
                                    </label>

                                    <select
                                        value={
                                            form.paymentMethod
                                        }
                                        onChange={(e) =>
                                            updateForm(
                                                "paymentMethod",
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                    >

                                        {PAYMENT_METHODS.map(
                                            (method) => (

                                                <option
                                                    key={
                                                        method.value
                                                    }
                                                    value={
                                                        method.value
                                                    }
                                                >
                                                    {
                                                        method.label
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>

                                <div className="expense-form-group full-width">

                                    <label>

                                        Reference Number

                                        <span className="optional-label">
                                            Optional
                                        </span>

                                    </label>

                                    <input
                                        type="text"
                                        placeholder="e.g. EB-2026-0802"
                                        value={
                                            form.referenceNumber
                                        }
                                        onChange={(e) =>
                                            updateForm(
                                                "referenceNumber",
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>

                            </div>

                            <div className="expense-form-actions">

                                <button
                                    type="button"
                                    className="expense-cancel-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="expense-save-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId !==
                                            null
                                            ? "Update Expense"
                                            : "Save Expense"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );
}
import { useCallback, useEffect, useMemo, useState } from "react";
import "./Income.css";

import { apiClient } from "../api/apiClient";
import { API_BASE_URL } from "../config";
/* =========================================================
   CONSTANTS
========================================================= */

const SUNDAY_WORSHIP_TOTAL_INCOME = "SUNDAY WORSHIP TOTAL INCOME";

const INCOME_CATEGORIES = [
    {
        value: SUNDAY_WORSHIP_TOTAL_INCOME,
        label: "Sunday Worship Total Income",
    },
    {
        value: "DONATION",
        label: "Donation",
    },
    {
        value: "EVENT",
        label: "Event",
    },
    {
        value: "BOOKS",
        label: "Books",
    },
    {
        value: "MERCHANDISE",
        label: "Merchandise",
    },
    {
        value: "REGISTRATION",
        label: "Registration",
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
        value: "GCASH",
        label: "GCash",
    },
    {
        value: "BANK TRANSFER",
        label: "Bank Transfer",
    },
    {
        value: "CHECK",
        label: "Check",
    },
    {
        value: "OTHER",
        label: "Other",
    },
] as const;

/* =========================================================
   TYPES
========================================================= */

type IncomeRecord = {
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

type CategoryBreakdown = {
    category: string;
    total: number;
    records: number;
};

type Dashboard = {
    totalIncome: number;
    todayIncome: number;
    monthlyIncome: number;

    totalRecords: number;
    todayRecords: number;
    monthlyRecords: number;

    categoryBreakdown: CategoryBreakdown[];

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

type FormData = {
    category: string;
    description: string;
    amount: string;
    incomeDate: string;
    paymentMethod: string;
    referenceNumber: string;
};

/* =========================================================
   HELPERS
========================================================= */

function getToday(): string {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function createEmptyForm(): FormData {
    return {
        category: SUNDAY_WORSHIP_TOTAL_INCOME,
        description: "",
        amount: "",
        incomeDate: getToday(),
        paymentMethod: "CASH",
        referenceNumber: "",
    };
}


/* =========================================================
   API
========================================================= */

async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    console.log("EPIC INCOME API:", endpoint);

    return apiClient(endpoint, options);


    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    headers.set("Accept", "application/json");
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt");

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });
}

/* =========================================================
   READ RESPONSE SAFELY
========================================================= */

async function readJson(response: Response): Promise<any> {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

/* =========================================================
   ARRAY EXTRACTION
========================================================= */

function extractArray<T>(
    data: any,
    keys: string[] = []
): T[] {
    if (Array.isArray(data)) {
        return data;
    }

    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    return [];
}

/* =========================================================
   CATEGORY NORMALIZATION
========================================================= */

function normalizeIncomeCategory(
    category: string | null | undefined
): string {
    const value = String(category || "")
        .trim()
        .toUpperCase();

    /*
       Old RENTAL records are treated as
       Sunday Worship Total Income.
    */
    if (value === "RENTAL") {
        return SUNDAY_WORSHIP_TOTAL_INCOME;
    }

    return value || "OTHER";
}

/* =========================================================
   RECORD NORMALIZATION
========================================================= */

function normalizeIncomeRecord(
    record: any
): IncomeRecord {
    return {
        incomeId: Number(
            record?.incomeId ??
            record?.IncomeId ??
            0
        ),

        category:
            normalizeIncomeCategory(
                record?.category ??
                record?.Category
            ),

        description:
            String(
                record?.description ??
                record?.Description ??
                ""
            ),

        amount:
            Number(
                record?.amount ??
                record?.Amount ??
                0
            ),

        incomeDate:
            String(
                record?.incomeDate ??
                record?.IncomeDate ??
                ""
            ),

        paymentMethod:
            String(
                record?.paymentMethod ??
                record?.PaymentMethod ??
                "CASH"
            )
                .trim()
                .toUpperCase(),

        referenceNumber:
            String(
                record?.referenceNumber ??
                record?.ReferenceNumber ??
                ""
            ),

        recordedBy:
            String(
                record?.recordedBy ??
                record?.RecordedBy ??
                "SYSTEM"
            ),

        recordedDate:
            String(
                record?.recordedDate ??
                record?.RecordedDate ??
                ""
            ),
    };
}

/* =========================================================
   CATEGORY BREAKDOWN
========================================================= */

function normalizeCategoryBreakdown(
    breakdown: any
): CategoryBreakdown[] {
    const list = extractArray<any>(
        breakdown,
        [
            "categoryBreakdown",
            "incomeCategoryBreakdown",
            "categories",
            "data",
            "items",
        ]
    );

    if (!list.length) {
        return [];
    }

    const categoryMap = new Map<
        string,
        {
            total: number;
            records: number;
        }
    >();

    list.forEach((item) => {
        const category =
            normalizeIncomeCategory(
                item?.category ??
                item?.Category
            );

        const total = Number(
            item?.total ??
            item?.Total ??
            0
        );

        const records = Number(
            item?.records ??
            item?.Records ??
            item?.count ??
            item?.Count ??
            0
        );

        const current =
            categoryMap.get(category) || {
                total: 0,
                records: 0,
            };

        categoryMap.set(category, {
            total: current.total + total,
            records: current.records + records,
        });
    });

    return Array.from(categoryMap.entries())
        .map(([category, values]) => ({
            category,
            total: values.total,
            records: values.records,
        }))
        .sort((a, b) => b.total - a.total);
}

/* =========================================================
   DASHBOARD NORMALIZATION
========================================================= */

function normalizeDashboard(
    data: any
): Dashboard {
    const financialPosition =
        data?.financialPosition || {};

    const expenses =
        data?.expenses || {};

    const totalIncome = Number(
        data?.totalIncome ??
        data?.TotalIncome ??
        financialPosition?.totalIncome ??
        financialPosition?.TotalIncome ??
        0
    );

    const totalExpenses = Number(
        data?.totalExpenses ??
        data?.TotalExpenses ??
        financialPosition?.totalExpenses ??
        financialPosition?.TotalExpenses ??
        expenses?.totalExpenses ??
        expenses?.TotalExpenses ??
        0
    );

    const netChurchFunds = Number(
        data?.netChurchFunds ??
        data?.NetChurchFunds ??
        financialPosition?.netChurchFunds ??
        financialPosition?.NetChurchFunds ??
        totalIncome - totalExpenses
    );

    return {
        totalIncome,

        todayIncome: Number(
            data?.todayIncome ??
            data?.TodayIncome ??
            0
        ),

        monthlyIncome: Number(
            data?.monthlyIncome ??
            data?.MonthlyIncome ??
            0
        ),

        totalRecords: Number(
            data?.totalRecords ??
            data?.TotalRecords ??
            0
        ),

        todayRecords: Number(
            data?.todayRecords ??
            data?.TodayRecords ??
            0
        ),

        monthlyRecords: Number(
            data?.monthlyRecords ??
            data?.MonthlyRecords ??
            0
        ),

        categoryBreakdown:
            normalizeCategoryBreakdown(
                data?.categoryBreakdown ??
                data?.incomeCategoryBreakdown ??
                []
            ),

        totalExpenses,

        todayExpenses: Number(
            data?.todayExpenses ??
            data?.TodayExpenses ??
            0
        ),

        monthlyExpenses: Number(
            data?.monthlyExpenses ??
            data?.MonthlyExpenses ??
            0
        ),

        totalExpenseRecords: Number(
            data?.totalExpenseRecords ??
            data?.TotalExpenseRecords ??
            expenses?.totalRecords ??
            expenses?.TotalRecords ??
            0
        ),

        todayExpenseRecords: Number(
            data?.todayExpenseRecords ??
            data?.TodayExpenseRecords ??
            0
        ),

        monthlyExpenseRecords: Number(
            data?.monthlyExpenseRecords ??
            data?.MonthlyExpenseRecords ??
            0
        ),

        netChurchFunds,

        todayNetFunds: Number(
            data?.todayNetFunds ??
            data?.TodayNetFunds ??
            0
        ),

        monthlyNetFunds: Number(
            data?.monthlyNetFunds ??
            data?.MonthlyNetFunds ??
            0
        ),
    };
}

/* =========================================================
   MONEY
========================================================= */

function money(value: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
    }).format(Number(value) || 0);
}

/* =========================================================
   DATE
========================================================= */

function dateInput(value: string): string {
    if (!value) {
        return "";
    }

    return String(value).slice(0, 10);
}

function dateOnly(value: string): string {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10);
    }

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Income() {
    const [dashboard, setDashboard] =
        useState<Dashboard | null>(null);

    const [records, setRecords] =
        useState<IncomeRecord[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [showModal, setShowModal] =
        useState(false);

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [search, setSearch] =
        useState("");

    const [categoryFilter, setCategoryFilter] =
        useState("ALL");

    const [paymentFilter, setPaymentFilter] =
        useState("ALL");

    const [dateFilter, setDateFilter] =
        useState("");

    const [form, setForm] =
        useState<FormData>(
            createEmptyForm()
        );

    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    const loadDashboard = useCallback(
        async () => {
            const response =
                await apiFetch(
                    "/Income/dashboard"
                );

            const data =
                await readJson(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    `Unable to load income dashboard. Server returned ${response.status}.`
                );
            }

            setDashboard(
                normalizeDashboard(data)
            );
        },
        []
    );

    /* =====================================================
       LOAD RECORDS
    ===================================================== */

    const loadRecords = useCallback(
        async () => {
            const response =
                await apiFetch(
                    "/Income"
                );

            const data =
                await readJson(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    `Unable to load income records. Server returned ${response.status}.`
                );
            }

            const list =
                extractArray<any>(
                    data,
                    [
                        "records",
                        "income",
                        "incomes",
                        "data",
                        "items",
                    ]
                );

            setRecords(
                list.map(
                    normalizeIncomeRecord
                )
            );
        },
        []
    );

    /* =====================================================
       LOAD ALL
    ===================================================== */

    const loadAll = useCallback(
        async () => {
            setLoading(true);
            setError("");

            try {
                await Promise.all([
                    loadDashboard(),
                    loadRecords(),
                ]);
            } catch (err) {
                console.error(
                    "INCOME LOAD ERROR:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load income information."
                );
            } finally {
                setLoading(false);
            }
        },
        [
            loadDashboard,
            loadRecords,
        ]
    );

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    /* =====================================================
       AUTO REFRESH DASHBOARD
    ===================================================== */

    useEffect(() => {
        const interval =
            window.setInterval(() => {
                void loadDashboard();
            }, 30000);

        return () => {
            window.clearInterval(
                interval
            );
        };
    }, [loadDashboard]);

    /* =====================================================
       FILTER RECORDS
    ===================================================== */

    const filteredRecords =
        useMemo(() => {
            const searchValue =
                search
                    .trim()
                    .toLowerCase();

            return records.filter(
                (record) => {
                    const category =
                        normalizeIncomeCategory(
                            record.category
                        );

                    const description =
                        (
                            record.description ||
                            ""
                        ).toLowerCase();

                    const payment =
                        (
                            record.paymentMethod ||
                            ""
                        ).toLowerCase();

                    const reference =
                        (
                            record.referenceNumber ||
                            ""
                        ).toLowerCase();

                    const recordedBy =
                        (
                            record.recordedBy ||
                            ""
                        ).toLowerCase();

                    const matchesSearch =
                        !searchValue ||
                        category
                            .toLowerCase()
                            .includes(
                                searchValue
                            ) ||
                        description.includes(
                            searchValue
                        ) ||
                        payment.includes(
                            searchValue
                        ) ||
                        reference.includes(
                            searchValue
                        ) ||
                        recordedBy.includes(
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
                        record.paymentMethod ===
                        paymentFilter;

                    const matchesDate =
                        !dateFilter ||
                        dateInput(
                            record.incomeDate
                        ) === dateFilter;

                    return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesPayment &&
                        matchesDate
                    );
                }
            );
        }, [
            records,
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
            return filteredRecords.reduce(
                (total, record) =>
                    total +
                    Number(
                        record.amount || 0
                    ),
                0
            );
        }, [filteredRecords]);

    /* =====================================================
       FINANCIAL VALUES
    ===================================================== */

    const totalIncome =
        dashboard?.totalIncome || 0;

    const totalExpenses =
        dashboard?.totalExpenses || 0;

    const netChurchFunds =
        dashboard?.netChurchFunds ??
        totalIncome - totalExpenses;

    /* =====================================================
       OPEN ADD
    ===================================================== */

    function openAddModal() {
        setEditingId(null);
        setForm(createEmptyForm());
        setError("");
        setSuccess("");
        setShowModal(true);
    }

    /* =====================================================
       OPEN EDIT
    ===================================================== */

    function openEditModal(
        record: IncomeRecord
    ) {
        setEditingId(
            record.incomeId
        );

        setForm({
            category:
                normalizeIncomeCategory(
                    record.category
                ),

            description:
                record.description || "",

            amount:
                String(
                    record.amount ?? ""
                ),

            incomeDate:
                dateInput(
                    record.incomeDate
                ),

            paymentMethod:
                record.paymentMethod ||
                "CASH",

            referenceNumber:
                record.referenceNumber ||
                "",
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    }

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeModal() {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingId(null);
        setForm(createEmptyForm());
    }

    /* =====================================================
       UPDATE FORM
    ===================================================== */

    function updateForm(
        field: keyof FormData,
        value: string
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    /* =====================================================
       SAVE
    ===================================================== */

    async function saveIncome() {
        setError("");
        setSuccess("");

        const amount =
            Number(form.amount);

        if (!form.category) {
            setError(
                "Please select an income category."
            );
            return;
        }

        if (!form.description.trim()) {
            setError(
                "Please enter an income description."
            );
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            setError(
                "Please enter a valid income amount."
            );
            return;
        }

        if (!form.incomeDate) {
            setError(
                "Please select an income date."
            );
            return;
        }

        setSaving(true);

        try {
            const payload = {
                category:
                    normalizeIncomeCategory(
                        form.category
                    ),

                description:
                    form.description.trim(),

                amount,

                incomeDate:
                    form.incomeDate,

                paymentMethod:
                    form.paymentMethod
                        .trim()
                        .toUpperCase(),

                referenceNumber:
                    form.referenceNumber.trim(),
            };

            console.log(
                "INCOME PAYLOAD:",
                payload
            );

            const endpoint =
                editingId !== null
                    ? `/Income/${editingId}`
                    : "/Income";

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

            const data =
                await readJson(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    (typeof data === "string"
                        ? data
                        : `Unable to save income record. Server returned ${response.status}.`)
                );
            }

            setSuccess(
                editingId !== null
                    ? "Income record updated successfully."
                    : "Income recorded successfully."
            );

            setShowModal(false);
            setEditingId(null);
            setForm(createEmptyForm());

            await Promise.all([
                loadDashboard(),
                loadRecords(),
            ]);
        } catch (err) {
            console.error(
                "SAVE INCOME ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save income record."
            );
        } finally {
            setSaving(false);
        }
    }

    /* =====================================================
       DELETE
    ===================================================== */

    async function deleteIncome(
        id: number
    ) {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this income record?"
            );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            const response =
                await apiFetch(
                    `/Income/${id}`,
                    {
                        method: "DELETE",
                    }
                );

            const data =
                await readJson(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    (typeof data === "string"
                        ? data
                        : `Unable to delete income record. Server returned ${response.status}.`)
                );
            }

            setSuccess(
                "Income record deleted successfully."
            );

            await Promise.all([
                loadDashboard(),
                loadRecords(),
            ]);
        } catch (err) {
            console.error(
                "DELETE INCOME ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete income record."
            );
        }
    }

    /* =====================================================
       REFRESH
    ===================================================== */

    async function refresh() {
        setSuccess("");
        await loadAll();
    }

    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    function clearFilters() {
        setSearch("");
        setCategoryFilter("ALL");
        setPaymentFilter("ALL");
        setDateFilter("");
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="income-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="income-header">
                <div>
                    <h1>
                        Income Management
                    </h1>

                    <p>
                        Manage church income,
                        revenue sources, and
                        other financial receipts.
                    </p>
                </div>

                <div className="income-header-actions">

                    <button
                        className="btn btn-secondary"
                        onClick={refresh}
                        disabled={loading}
                    >
                        ↻ Refresh
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={openAddModal}
                    >
                        ＋ Record Income
                    </button>

                </div>
            </div>

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
                <div className="income-alert income-alert-error">
                    <strong>!</strong>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="income-alert income-alert-success">
                    ✓ {success}
                </div>
            )}

            {/* =================================================
                DASHBOARD
            ================================================= */}

            <section className="income-dashboard">

                <div className="income-stat-card main-stat">
                    <div className="stat-icon">
                        ₱
                    </div>

                    <div>
                        <span>
                            Total Income
                        </span>

                        <strong>
                            {money(totalIncome)}
                        </strong>

                        <small>
                            {dashboard?.totalRecords || 0}{" "}
                            records
                        </small>
                    </div>
                </div>

                <div className="income-stat-card">
                    <span>
                        Total Expenses
                    </span>

                    <strong>
                        {money(totalExpenses)}
                    </strong>

                    <small>
                        {dashboard?.totalExpenseRecords || 0}{" "}
                        expense records
                    </small>
                </div>

                <div className="income-stat-card">
                    <span>
                        Net Church Funds
                    </span>

                    <strong>
                        {money(netChurchFunds)}
                    </strong>

                    <small>
                        Income − Expenses
                    </small>
                </div>

                <div className="income-stat-card">
                    <span>
                        Today
                    </span>

                    <strong>
                        {money(
                            dashboard?.todayIncome || 0
                        )}
                    </strong>

                    <small>
                        {dashboard?.todayRecords || 0}{" "}
                        records
                    </small>
                </div>

                <div className="income-stat-card">
                    <span>
                        This Month
                    </span>

                    <strong>
                        {money(
                            dashboard?.monthlyIncome || 0
                        )}
                    </strong>

                    <small>
                        {dashboard?.monthlyRecords || 0}{" "}
                        records
                    </small>
                </div>

                <div className="income-stat-card">
                    <span>
                        Total Records
                    </span>

                    <strong>
                        {dashboard?.totalRecords || 0}
                    </strong>

                    <small>
                        Income transactions
                    </small>
                </div>

            </section>

            {/* =================================================
                CATEGORY BREAKDOWN
            ================================================= */}

            <section className="income-breakdown">

                <div className="breakdown-header">
                    <div>
                        <h2>
                            Income Breakdown
                        </h2>

                        <p>
                            Total income by category.
                        </p>
                    </div>
                </div>

                <div className="breakdown-grid">

                    {dashboard?.categoryBreakdown?.length ? (

                        dashboard.categoryBreakdown.map(
                            (item) => (
                                <div
                                    className="breakdown-item"
                                    key={item.category}
                                >
                                    <span>
                                        {normalizeIncomeCategory(
                                            item.category
                                        )}
                                    </span>

                                    <strong>
                                        {money(item.total)}
                                    </strong>

                                    <small>
                                        {item.records} records
                                    </small>
                                </div>
                            )
                        )

                    ) : (

                        <div className="no-breakdown">
                            No income categories yet.
                        </div>

                    )}

                </div>
            </section>

            {/* =================================================
                RECORDS
            ================================================= */}

            <section className="income-records-card">

                <div className="records-header">
                    <div>
                        <h2>
                            Income Records
                        </h2>

                        <p>
                            {filteredRecords.length} displayed
                            records {" • "}
                            {money(filteredTotal)}
                        </p>
                    </div>
                </div>

                {/* FILTERS */}

                <div className="income-filters">

                    <input
                        type="text"
                        placeholder="Search category, description, reference..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                    <select
                        value={categoryFilter}
                        onChange={(e) =>
                            setCategoryFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            All Categories
                        </option>

                        {INCOME_CATEGORIES.map(
                            (category) => (
                                <option
                                    key={category.value}
                                    value={category.value}
                                >
                                    {category.label}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={paymentFilter}
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
                            (payment) => (
                                <option
                                    key={payment.value}
                                    value={payment.value}
                                >
                                    {payment.label}
                                </option>
                            )
                        )}
                    </select>

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) =>
                            setDateFilter(
                                e.target.value
                            )
                        }
                    />

                    {(search ||
                        categoryFilter !== "ALL" ||
                        paymentFilter !== "ALL" ||
                        dateFilter) && (
                            <button
                                className="btn btn-light"
                                onClick={clearFilters}
                            >
                                Clear
                            </button>
                        )}

                </div>

                {/* TABLE */}

                <div className="table-wrapper">

                    <table className="income-table">

                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Reference</th>
                                <th>Recorded By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td
                                        colSpan={8}
                                        className="empty-cell"
                                    >
                                        Loading income records...
                                    </td>
                                </tr>

                            ) : filteredRecords.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan={8}
                                        className="empty-cell"
                                    >
                                        No income records found.
                                    </td>
                                </tr>

                            ) : (

                                filteredRecords.map(
                                    (record) => (
                                        <tr
                                            key={
                                                record.incomeId
                                            }
                                        >

                                            <td>
                                                {dateOnly(
                                                    record.incomeDate
                                                )}
                                            </td>

                                            <td>
                                                <span className="income-category">
                                                    {normalizeIncomeCategory(
                                                        record.category
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <strong>
                                                    {record.description ||
                                                        "—"}
                                                </strong>
                                            </td>

                                            <td className="amount-cell">
                                                {money(
                                                    Number(
                                                        record.amount
                                                    )
                                                )}
                                            </td>

                                            <td>
                                                {record.paymentMethod ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {record.referenceNumber ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {record.recordedBy ||
                                                    "SYSTEM"}
                                            </td>

                                            <td>
                                                <div className="action-buttons">

                                                    <button
                                                        className="action-edit"
                                                        onClick={() =>
                                                            openEditModal(
                                                                record
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="action-delete"
                                                        onClick={() =>
                                                            deleteIncome(
                                                                record.incomeId
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
            </section>

            {/* =================================================
                MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="income-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    {editingId !== null
                                        ? "Edit Income"
                                        : "Record Income"}
                                </h2>

                                <p>
                                    Record a church income
                                    transaction.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                ×
                            </button>

                        </div>

                        <div className="modal-body">

                            <div className="form-grid">

                                {/* CATEGORY */}

                                <div className="form-group">

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
                                        disabled={saving}
                                    >

                                        {INCOME_CATEGORIES.map(
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

                                {/* AMOUNT */}

                                <div className="form-group">

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
                                            disabled={saving}
                                        />

                                    </div>

                                </div>

                                {/* DESCRIPTION */}

                                <div className="form-group full-width">

                                    <label>
                                        Description *
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="e.g. Sunday worship offerings and income"
                                        value={
                                            form.description
                                        }
                                        onChange={(e) =>
                                            updateForm(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        disabled={saving}
                                    />

                                </div>

                                {/* DATE */}

                                <div className="form-group">

                                    <label>
                                        Income Date *
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            form.incomeDate
                                        }
                                        onChange={(e) =>
                                            updateForm(
                                                "incomeDate",
                                                e.target.value
                                            )
                                        }
                                        disabled={saving}
                                    />

                                </div>

                                {/* PAYMENT */}

                                <div className="form-group">

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
                                        disabled={saving}
                                    >

                                        {PAYMENT_METHODS.map(
                                            (payment) => (
                                                <option
                                                    key={
                                                        payment.value
                                                    }
                                                    value={
                                                        payment.value
                                                    }
                                                >
                                                    {
                                                        payment.label
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* REFERENCE */}

                                <div className="form-group full-width">

                                    <label>
                                        Reference Number
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="OR number, receipt number..."
                                        value={
                                            form.referenceNumber
                                        }
                                        onChange={(e) =>
                                            updateForm(
                                                "referenceNumber",
                                                e.target.value
                                            )
                                        }
                                        disabled={saving}
                                    />

                                </div>

                            </div>
                        </div>

                        <div className="modal-footer">

                            <button
                                className="btn btn-secondary"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={saveIncome}
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId !== null
                                        ? "Update Income"
                                        : "Save Income"}
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
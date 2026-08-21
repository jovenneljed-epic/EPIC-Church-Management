import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";
import "./FinancialReportBuilder.css";

import { API_BASE_URL } from "../../config";

// =========================================================
// TYPES
// =========================================================

type TransactionType =
    | "INCOME"
    | "GIVING"
    | "EXPENSE"
    | "OTHER";

interface FinancialTransaction {
    id: number | string;

    date?: string | null;

    reference?: string | null;

    description?: string | null;

    category?: string | null;

    type?: TransactionType | string | null;

    amount?: number | null;

    income?: number | null;

    expense?: number | null;

    paymentMethod?: string | null;

    ministry?: string | null;

    fund?: string | null;

    status?: string | null;
}

interface FinancialSummary {
    totalIncome: number;
    totalGiving: number;
    totalRevenue: number;
    totalExpenses: number;
    netPosition: number;
    transactionCount: number;
}

interface EndpointStatus {
    income: boolean;
    giving: boolean;
    expenses: boolean;
}

// =========================================================
// COMPONENT
// =========================================================

const FinancialReportBuilder: React.FC = () => {

    // =====================================================
    // STATE
    // =====================================================

    const [transactions, setTransactions] =
        useState<FinancialTransaction[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [searchText, setSearchText] =
        useState("");

    const [dateFrom, setDateFrom] =
        useState("");

    const [dateTo, setDateTo] =
        useState("");

    const [typeFilter, setTypeFilter] =
        useState("ALL");

    const [categoryFilter, setCategoryFilter] =
        useState("ALL");

    const [paymentFilter, setPaymentFilter] =
        useState("ALL");

    const [endpointStatus, setEndpointStatus] =
        useState<EndpointStatus>({
            income: true,
            giving: true,
            expenses: true,
        });

    // =====================================================
    // AUTH CONFIG
    // =====================================================

    const getAuthConfig = useCallback(() => {

        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt");

        if (!token) {
            return {};
        }

        return {
            headers: {
                Authorization:
                    `Bearer ${token}`,
            },
        };
    }, []);

    // =====================================================
    // NUMBER NORMALIZER
    // =====================================================

    const numberValue = (
        value: any
    ): number => {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return 0;
        }

        if (typeof value === "number") {
            return Number.isFinite(value)
                ? value
                : 0;
        }

        const cleaned =
            String(value)
                .replace(/,/g, "")
                .replace(/[₱$]/g, "")
                .trim();

        const parsed =
            Number(cleaned);

        return Number.isFinite(parsed)
            ? parsed
            : 0;
    };

    // =====================================================
    // GET ARRAY FROM API RESPONSE
    // =====================================================

    const extractArray = (
        responseData: any
    ): any[] => {

        if (Array.isArray(responseData)) {
            return responseData;
        }

        if (
            Array.isArray(
                responseData?.data
            )
        ) {
            return responseData.data;
        }

        if (
            Array.isArray(
                responseData?.items
            )
        ) {
            return responseData.items;
        }

        if (
            Array.isArray(
                responseData?.results
            )
        ) {
            return responseData.results;
        }

        if (
            Array.isArray(
                responseData?.records
            )
        ) {
            return responseData.records;
        }

        return [];
    };

    // =====================================================
    // NORMALIZE TRANSACTION
    // =====================================================

    const normalizeTransaction = (
        item: any,
        index: number,
        forcedType?: TransactionType
    ): FinancialTransaction => {

        const rawType =
            String(
                item?.type ??
                item?.transactionType ??
                item?.entryType ??
                item?.recordType ??
                item?.transactionKind ??
                ""
            )
                .trim()
                .toUpperCase();

        let type: TransactionType =
            forcedType || "OTHER";

        if (!forcedType) {

            if (
                rawType.includes("GIVING") ||
                rawType.includes("DONATION") ||
                rawType.includes("OFFERING") ||
                rawType.includes("TITHE")
            ) {
                type = "GIVING";
            }
            else if (
                rawType.includes("EXPENSE") ||
                rawType.includes("DISBURSEMENT") ||
                rawType.includes("PAYMENT")
            ) {
                type = "EXPENSE";
            }
            else if (
                rawType.includes("INCOME") ||
                rawType.includes("RECEIPT") ||
                rawType.includes("REVENUE")
            ) {
                type = "INCOME";
            }

        }

        const amount =
            numberValue(
                item?.amount ??
                item?.totalAmount ??
                item?.value ??
                item?.grossAmount ??
                item?.netAmount ??
                0
            );

        let income =
            numberValue(
                item?.income ??
                item?.credit ??
                item?.creditAmount ??
                0
            );

        let expense =
            numberValue(
                item?.expense ??
                item?.debit ??
                item?.debitAmount ??
                0
            );

        /*
         * Endpoint-specific normalization is handled
         * by the caller.
         *
         * This fallback is only used when the API
         * itself explicitly supplies income/expense.
         */

        if (
            income === 0 &&
            expense === 0 &&
            !forcedType
        ) {

            if (type === "EXPENSE") {
                expense = amount;
            }
            else if (
                type === "INCOME" ||
                type === "GIVING"
            ) {
                income = amount;
            }

        }

        return {

            id:
                item?.id ??
                item?.transactionId ??
                item?.incomeId ??
                item?.givingId ??
                item?.expenseId ??
                item?.recordId ??
                `${type}-${index}`,

            date:
                item?.date ??
                item?.transactionDate ??
                item?.entryDate ??
                item?.incomeDate ??
                item?.givingDate ??
                item?.expenseDate ??
                item?.createdDate ??
                item?.createdAt ??
                null,

            reference:
                item?.reference ??
                item?.referenceNumber ??
                item?.transactionCode ??
                item?.receiptNumber ??
                item?.receiptNo ??
                item?.voucherNumber ??
                null,

            description:
                item?.description ??
                item?.particulars ??
                item?.title ??
                item?.name ??
                item?.remarks ??
                item?.purpose ??
                null,

            category:
                item?.category ??
                item?.categoryName ??
                item?.incomeCategory ??
                item?.expenseCategory ??
                item?.givingCategory ??
                null,

            type,

            amount,

            income,

            expense,

            paymentMethod:
                item?.paymentMethod ??
                item?.paymentType ??
                item?.method ??
                null,

            ministry:
                item?.ministry ??
                item?.ministryName ??
                item?.ministryTitle ??
                null,

            fund:
                item?.fund ??
                item?.fundName ??
                item?.fundType ??
                null,

            status:
                item?.status ??
                item?.paymentStatus ??
                null,
        };
    };

    // =====================================================
    // LOAD FINANCIAL DATA
    // =====================================================

    const loadFinancialData =
        useCallback(async () => {

            try {

                setLoading(true);
                setError("");
                setSuccess("");

                const requests = [

                    axios.get(
                        `${API_BASE_URL}/Income`,
                        getAuthConfig()
                    ),

                    axios.get(
                        `${API_BASE_URL}/Giving`,
                        getAuthConfig()
                    ),

                    axios.get(
                        `${API_BASE_URL}/Expenses`,
                        getAuthConfig()
                    ),

                ];

                const results =
                    await Promise.allSettled(
                        requests
                    );

                const combined:
                    FinancialTransaction[] = [];

                const status: EndpointStatus = {
                    income: false,
                    giving: false,
                    expenses: false,
                };

                // =================================================
                // INCOME
                // =================================================

                const incomeResult =
                    results[0];

                if (
                    incomeResult?.status ===
                    "fulfilled"
                ) {

                    status.income = true;

                    const data =
                        extractArray(
                            incomeResult.value?.data
                        );

                    data.forEach(
                        (
                            item,
                            index
                        ) => {

                            const transaction =
                                normalizeTransaction(
                                    item,
                                    index,
                                    "INCOME"
                                );

                            transaction.income =
                                numberValue(
                                    item?.income ??
                                    item?.amount ??
                                    item?.totalAmount ??
                                    item?.value ??
                                    0
                                );

                            transaction.expense = 0;

                            transaction.amount =
                                transaction.income;

                            combined.push(
                                transaction
                            );

                        }
                    );

                }

                // =================================================
                // GIVING
                // =================================================

                const givingResult =
                    results[1];

                if (
                    givingResult?.status ===
                    "fulfilled"
                ) {

                    status.giving = true;

                    const data =
                        extractArray(
                            givingResult.value?.data
                        );

                    data.forEach(
                        (
                            item,
                            index
                        ) => {

                            const transaction =
                                normalizeTransaction(
                                    item,
                                    index,
                                    "GIVING"
                                );

                            transaction.income =
                                numberValue(
                                    item?.giving ??
                                    item?.givingAmount ??
                                    item?.donationAmount ??
                                    item?.amount ??
                                    item?.totalAmount ??
                                    item?.value ??
                                    0
                                );

                            transaction.expense = 0;

                            transaction.amount =
                                transaction.income;

                            combined.push(
                                transaction
                            );

                        }
                    );

                }

                // =================================================
                // EXPENSES
                // =================================================

                const expenseResult =
                    results[2];

                if (
                    expenseResult?.status ===
                    "fulfilled"
                ) {

                    status.expenses = true;

                    const data =
                        extractArray(
                            expenseResult.value?.data
                        );

                    data.forEach(
                        (
                            item,
                            index
                        ) => {

                            const transaction =
                                normalizeTransaction(
                                    item,
                                    index,
                                    "EXPENSE"
                                );

                            transaction.expense =
                                numberValue(
                                    item?.expense ??
                                    item?.expenseAmount ??
                                    item?.amount ??
                                    item?.totalAmount ??
                                    item?.value ??
                                    0
                                );

                            transaction.income = 0;

                            transaction.amount =
                                transaction.expense;

                            combined.push(
                                transaction
                            );

                        }
                    );

                }

                setEndpointStatus(
                    status
                );

                // =================================================
                // SORT BY DATE
                // =================================================

                combined.sort(
                    (a, b) => {

                        const dateA =
                            a.date
                                ? new Date(
                                    a.date
                                ).getTime()
                                : 0;

                        const dateB =
                            b.date
                                ? new Date(
                                    b.date
                                ).getTime()
                                : 0;

                        return dateB - dateA;
                    }
                );

                setTransactions(
                    combined
                );

                // =================================================
                // STATUS MESSAGE
                // =================================================

                const failedModules: string[] = [];

                if (!status.income) {
                    failedModules.push(
                        "Income"
                    );
                }

                if (!status.giving) {
                    failedModules.push(
                        "Giving"
                    );
                }

                if (!status.expenses) {
                    failedModules.push(
                        "Expenses"
                    );
                }

                if (
                    combined.length === 0 &&
                    failedModules.length === 3
                ) {

                    setError(
                        "Unable to retrieve financial records from Income, Giving, and Expenses."
                    );

                }
                else if (
                    failedModules.length > 0
                ) {

                    setError(
                        `Some financial modules could not be loaded: ${failedModules.join(
                            ", "
                        )}. The displayed report contains only the available records.`
                    );

                }
                else {

                    setSuccess(
                        `${combined.length} financial records loaded successfully.`
                    );

                }

            }
            catch (err: any) {

                console.error(
                    "Failed to load financial report:",
                    err
                );

                const statusCode =
                    err?.response?.status;

                if (
                    statusCode === 401
                ) {

                    setError(
                        "Your session has expired. Please log in again."
                    );

                }
                else if (
                    statusCode === 403
                ) {

                    setError(
                        "You do not have permission to view financial reports."
                    );

                }
                else {

                    setError(
                        err?.response?.data?.message ||
                        "Unable to load financial records."
                    );

                }

            }
            finally {

                setLoading(false);

            }

        }, [
            getAuthConfig,
        ]);

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadFinancialData();

    }, [
        loadFinancialData,
    ]);

    // =====================================================
    // FORMAT CURRENCY
    // =====================================================

    const formatCurrency = (
        value: number
    ) => {

        return new Intl.NumberFormat(
            "en-PH",
            {
                style: "currency",
                currency: "PHP",
                minimumFractionDigits: 2,
            }
        ).format(
            value
        );

    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        value?: string | null
    ) => {

        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleDateString(
            "en-PH",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
            }
        );

    };

    // =====================================================
    // FILTER TRANSACTIONS
    // =====================================================

    const filteredTransactions =
        useMemo(() => {

            const search =
                searchText
                    .trim()
                    .toLowerCase();

            return transactions.filter(
                transaction => {

                    const transactionDate =
                        transaction.date
                            ? new Date(
                                transaction.date
                            )
                            : null;

                    const searchTarget = [

                        transaction.reference,
                        transaction.description,
                        transaction.category,
                        transaction.paymentMethod,
                        transaction.ministry,
                        transaction.fund,
                        transaction.type,
                        transaction.status,

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    const matchesSearch =
                        !search ||
                        searchTarget.includes(
                            search
                        );

                    const matchesType =
                        typeFilter === "ALL" ||
                        transaction.type ===
                        typeFilter;

                    const matchesCategory =
                        categoryFilter === "ALL" ||
                        transaction.category ===
                        categoryFilter;

                    const matchesPayment =
                        paymentFilter === "ALL" ||
                        transaction.paymentMethod ===
                        paymentFilter;

                    let matchesFrom =
                        true;

                    let matchesTo =
                        true;

                    if (
                        dateFrom
                    ) {

                        if (!transactionDate) {
                            matchesFrom = false;
                        }
                        else {

                            matchesFrom =
                                transactionDate >=
                                new Date(
                                    `${dateFrom}T00:00:00`
                                );

                        }

                    }

                    if (
                        dateTo
                    ) {

                        if (!transactionDate) {
                            matchesTo = false;
                        }
                        else {

                            matchesTo =
                                transactionDate <=
                                new Date(
                                    `${dateTo}T23:59:59`
                                );

                        }

                    }

                    return (
                        matchesSearch &&
                        matchesType &&
                        matchesCategory &&
                        matchesPayment &&
                        matchesFrom &&
                        matchesTo
                    );

                }
            );

        }, [
            transactions,
            searchText,
            typeFilter,
            categoryFilter,
            paymentFilter,
            dateFrom,
            dateTo,
        ]);

    // =====================================================
    // FINANCIAL SUMMARY
    // =====================================================

    const summary =
        useMemo<FinancialSummary>(() => {

            /*
             * IMPORTANT:
             *
             * Giving is intentionally NOT included
             * inside totalIncome.
             *
             * Financial model:
             *
             * Regular Income
             *       +
             * Giving
             *       =
             * Total Revenue
             *
             * Total Revenue
             *       -
             * Expenses
             *       =
             * Net Position
             */

            const totalIncome =
                filteredTransactions
                    .filter(
                        item =>
                            item.type ===
                            "INCOME"
                    )
                    .reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            numberValue(
                                item.income ??
                                item.amount
                            ),
                        0
                    );

            const totalGiving =
                filteredTransactions
                    .filter(
                        item =>
                            item.type ===
                            "GIVING"
                    )
                    .reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            numberValue(
                                item.income ??
                                item.amount
                            ),
                        0
                    );

            const totalExpenses =
                filteredTransactions
                    .filter(
                        item =>
                            item.type ===
                            "EXPENSE"
                    )
                    .reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            numberValue(
                                item.expense ??
                                item.amount
                            ),
                        0
                    );

            const totalRevenue =
                totalIncome +
                totalGiving;

            const netPosition =
                totalRevenue -
                totalExpenses;

            return {

                totalIncome,

                totalGiving,

                totalRevenue,

                totalExpenses,

                netPosition,

                transactionCount:
                    filteredTransactions.length,

            };

        }, [
            filteredTransactions,
        ]);

    // =====================================================
    // BREAKDOWN MAXIMUMS
    // =====================================================

    const revenueMaximum =
        Math.max(
            summary.totalRevenue,
            1
        );


    // =====================================================
    // CATEGORIES
    // =====================================================

    const categories =
        useMemo(() => {

            return Array.from(
                new Set(
                    transactions
                        .map(
                            item =>
                                item.category
                        )
                        .filter(
                            (
                                value
                            ): value is string =>
                                Boolean(value)
                        )
                )
            ).sort();

        }, [
            transactions,
        ]);

    // =====================================================
    // PAYMENT METHODS
    // =====================================================

    const paymentMethods =
        useMemo(() => {

            return Array.from(
                new Set(
                    transactions
                        .map(
                            item =>
                                item.paymentMethod
                        )
                        .filter(
                            (
                                value
                            ): value is string =>
                                Boolean(value)
                        )
                )
            ).sort();

        }, [
            transactions,
        ]);

    // =====================================================
    // RESET FILTERS
    // =====================================================

    const resetFilters = () => {

        setSearchText("");

        setDateFrom("");

        setDateTo("");

        setTypeFilter(
            "ALL"
        );

        setCategoryFilter(
            "ALL"
        );

        setPaymentFilter(
            "ALL"
        );

        setSuccess("");

        setError("");

    };

    // =====================================================
    // PRINT REPORT
    // =====================================================

    const handlePrint = () => {

        if (
            filteredTransactions.length === 0
        ) {

            alert(
                "There are no financial records to print."
            );

            return;
        }

        const rows =
            filteredTransactions
                .map(
                    (
                        transaction,
                        index
                    ) => {

                        const income =
                            numberValue(
                                transaction.income
                            );

                        const expense =
                            numberValue(
                                transaction.expense
                            );

                        const net =
                            income -
                            expense;

                        return `
                            <tr>

                                <td>
                                    ${index + 1}
                                </td>

                                <td>
                                    ${formatDate(
                                        transaction.date
                                    )}
                                </td>

                                <td>
                                    ${transaction.reference || "—"}
                                </td>

                                <td>
                                    <strong>
                                        ${transaction.description || "—"}
                                    </strong>
                                </td>

                                <td>
                                    ${transaction.category || "—"}
                                </td>

                                <td>
                                    ${transaction.type || "OTHER"}
                                </td>

                                <td class="income">
                                    ${
                                        income > 0
                                            ? formatCurrency(
                                                income
                                            )
                                            : "—"
                                    }
                                </td>

                                <td class="expense">
                                    ${
                                        expense > 0
                                            ? formatCurrency(
                                                expense
                                            )
                                            : "—"
                                    }
                                </td>

                                <td class="${
                                    net >= 0
                                        ? "net-positive"
                                        : "net-negative"
                                }">
                                    ${formatCurrency(
                                        net
                                    )}
                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1400,height=950"
            );

        if (!printWindow) {

            alert(
                "Unable to open the print document. Please allow pop-ups."
            );

            return;
        }

        printWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <meta charset="UTF-8" />

                <title>
                    EPIC Financial Report
                </title>

                <style>

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family:
                            Arial,
                            Helvetica,
                            sans-serif;

                        color: #182230;

                        padding: 35px;

                        background: white;
                    }

                    .header {
                        display: flex;

                        justify-content:
                            space-between;

                        border-bottom:
                            2px solid #182230;

                        padding-bottom: 20px;

                        margin-bottom: 25px;
                    }

                    .brand {
                        font-size: 12px;

                        font-weight: 800;

                        letter-spacing: 2px;
                    }

                    h1 {
                        margin: 5px 0;

                        font-size: 28px;
                    }

                    .subtitle {
                        color: #6b7280;
                    }

                    .generated {
                        text-align: right;

                        color: #6b7280;

                        font-size: 11px;
                    }

                    .summary {
                        display: grid;

                        grid-template-columns:
                            repeat(5, 1fr);

                        gap: 12px;

                        margin-bottom: 25px;
                    }

                    .card {
                        border:
                            1px solid #e5e7eb;

                        border-radius: 10px;

                        padding: 15px;
                    }

                    .card span {
                        display: block;

                        color: #6b7280;

                        font-size: 9px;

                        font-weight: 800;

                        letter-spacing: 1px;
                    }

                    .card strong {
                        display: block;

                        margin-top: 5px;

                        font-size: 18px;
                    }

                    table {
                        width: 100%;

                        border-collapse:
                            collapse;

                        font-size: 9px;
                    }

                    th {
                        padding: 9px;

                        text-align: left;

                        background:
                            #182230;

                        color: white;
                    }

                    td {
                        padding: 8px;

                        border-bottom:
                            1px solid #e5e7eb;
                    }

                    .income {
                        color: #15803d;

                        font-weight: 700;
                    }

                    .expense {
                        color: #dc2626;

                        font-weight: 700;
                    }

                    .net-positive {
                        color: #15803d;

                        font-weight: 700;
                    }

                    .net-negative {
                        color: #dc2626;

                        font-weight: 700;
                    }

                    .footer {
                        margin-top: 30px;

                        padding-top: 15px;

                        border-top:
                            1px solid #ddd;

                        color: #6b7280;

                        font-size: 10px;
                    }

                    @media print {

                        body {
                            padding: 15px;
                        }

                        tr {
                            page-break-inside:
                                avoid;
                        }

                    }

                </style>

            </head>

            <body>

                <div class="header">

                    <div>

                        <div class="brand">
                            LUKE 4:18 MINISTRIES
                        </div>

                        <h1>
                            Financial Report
                        </h1>

                        <div class="subtitle">
                            Engaging People Into Christ
                        </div>

                    </div>

                    <div class="generated">

                        GENERATED<br />

                        <strong>
                            ${new Date().toLocaleString(
                                "en-PH"
                            )}
                        </strong>

                    </div>

                </div>

                <div class="summary">

                    <div class="card">

                        <span>
                            TOTAL INCOME
                        </span>

                        <strong>
                            ${formatCurrency(
                                summary.totalIncome
                            )}
                        </strong>

                    </div>

                    <div class="card">

                        <span>
                            TOTAL GIVING
                        </span>

                        <strong>
                            ${formatCurrency(
                                summary.totalGiving
                            )}
                        </strong>

                    </div>

                    <div class="card">

                        <span>
                            TOTAL REVENUE
                        </span>

                        <strong>
                            ${formatCurrency(
                                summary.totalRevenue
                            )}
                        </strong>

                    </div>

                    <div class="card">

                        <span>
                            TOTAL EXPENSES
                        </span>

                        <strong>
                            ${formatCurrency(
                                summary.totalExpenses
                            )}
                        </strong>

                    </div>

                    <div class="card">

                        <span>
                            NET POSITION
                        </span>

                        <strong>
                            ${formatCurrency(
                                summary.netPosition
                            )}
                        </strong>

                    </div>

                </div>

                <table>

                    <thead>

                        <tr>

                            <th>#</th>

                            <th>DATE</th>

                            <th>REFERENCE</th>

                            <th>DESCRIPTION</th>

                            <th>CATEGORY</th>

                            <th>TYPE</th>

                            <th>INCOME / GIVING</th>

                            <th>EXPENSE</th>

                            <th>NET</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${rows}

                    </tbody>

                </table>

                <div class="footer">

                    EPIC Church Management System
                    • Financial Report Builder

                    <br />

                    Total Revenue:
                    ${formatCurrency(
                        summary.totalRevenue
                    )}

                    &nbsp;&nbsp;|&nbsp;&nbsp;

                    Net Position:
                    ${formatCurrency(
                        summary.netPosition
                    )}

                    <br />

                    Records displayed:
                    ${filteredTransactions.length}

                </div>

            </body>

            </html>

        `);

        printWindow.document.close();

        setTimeout(() => {

            printWindow.focus();

            printWindow.print();

        }, 500);

        printWindow.onafterprint = () => {

            setTimeout(() => {

                printWindow.close();

            }, 300);

        };

    };

    // =====================================================
    // ENDPOINT STATUS LABEL
    // =====================================================


      

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="financial-report-page">

            {/* =================================================
                HERO
            ================================================= */}

            <section className="financial-report-hero">

                <div className="hero-content">

                    <div className="hero-icon">

                        <span>
                            ₱
                        </span>

                    </div>

                    <div>

                        <div className="financial-report-eyebrow">
                            EPIC REPORTS CENTER
                        </div>

                        <h1>
                            Financial{" "}
                            <span>
                                Report Builder
                            </span>
                        </h1>

                        <p>
                            Analyze church income,
                            giving, expenses, and
                            overall financial
                            performance directly
                            from EPIC CMS.
                        </p>

                    </div>

                </div>

                <button
                    type="button"
                    className="hero-print-btn"
                    onClick={handlePrint}
                    disabled={
                        filteredTransactions.length === 0
                    }
                >

                    <span className="print-icon">
                        ⎙
                    </span>

                    Print / Save PDF

                </button>

                <div className="hero-glow hero-glow-one" />

                <div className="hero-glow hero-glow-two" />

            </section>

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (

                <div className="financial-error-card">

                    <div className="error-symbol">
                        !
                    </div>

                    <div className="error-content">

                        <strong>
                            Financial Report Notice
                        </strong>

                        <span>
                            {error}
                        </span>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        Dismiss
                    </button>

                </div>

            )}

            {success && !error && (

                <div className="financial-success-card">

                    <span>
                        ✓
                    </span>

                    {success}

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        ×
                    </button>

                </div>

            )}

            {/* =================================================
                REPORT COMMAND
            ================================================= */}

            <section className="financial-command-card">

                <div className="command-header">

                    <div>

                        <span className="command-kicker">
                            REPORT PARAMETERS
                        </span>

                        <h2>
                            Build Financial Report
                        </h2>

                        <p>
                            Define the period and
                            financial data you want
                            to analyze.
                        </p>

                    </div>

                    <div className="command-status">

                        <span className="status-dot" />

                        {loading
                            ? "LOADING DATA"
                            : "LIVE FINANCIAL DATA"}

                    </div>

                </div>

                <div className="financial-filter-grid">

                    <div className="financial-field">

                        <label>
                            FROM DATE
                        </label>

                        <div className="financial-input-shell">

                            <span>
                                ◷
                            </span>

                            <input
                                type="date"
                                value={dateFrom}
                                onChange={
                                    event =>
                                        setDateFrom(
                                            event.target.value
                                        )
                                }
                            />

                        </div>

                    </div>

                    <div className="financial-field">

                        <label>
                            TO DATE
                        </label>

                        <div className="financial-input-shell">

                            <span>
                                ◷
                            </span>

                            <input
                                type="date"
                                value={dateTo}
                                onChange={
                                    event =>
                                        setDateTo(
                                            event.target.value
                                        )
                                }
                            />

                        </div>

                    </div>

                    <div className="financial-field">

                        <label>
                            TRANSACTION TYPE
                        </label>

                        <select
                            value={typeFilter}
                            onChange={
                                event =>
                                    setTypeFilter(
                                        event.target.value
                                    )
                            }
                        >

                            <option value="ALL">
                                All Transactions
                            </option>

                            <option value="INCOME">
                                Income
                            </option>

                            <option value="GIVING">
                                Giving
                            </option>

                            <option value="EXPENSE">
                                Expenses
                            </option>

                        </select>

                    </div>

                    <div className="financial-filter-actions">

                        <button
                            type="button"
                            className="financial-reset-btn"
                            onClick={
                                resetFilters
                            }
                        >
                            Reset
                        </button>

                        <button
                            type="button"
                            className="financial-view-btn"
                            onClick={
                                loadFinancialData
                            }
                            disabled={loading}
                        >

                            {loading
                                ? "Loading..."
                                : "↻ Refresh Report"}

                        </button>

                    </div>

                </div>

                {/* =================================================
                    DATA SOURCE STATUS
                ================================================= */}

                <div className="financial-source-status">

                    <span>
                        DATA SOURCES
                    </span>

                    <div>

                        <span
                            className={
                                endpointStatus.income
                                    ? "source-online"
                                    : "source-offline"
                            }
                        >
                            <i />
                            Income
                        </span>

                        <span
                            className={
                                endpointStatus.giving
                                    ? "source-online"
                                    : "source-offline"
                            }
                        >
                            <i />
                            Giving
                        </span>

                        <span
                            className={
                                endpointStatus.expenses
                                    ? "source-online"
                                    : "source-offline"
                            }
                        >
                            <i />
                            Expenses
                        </span>

                    </div>

                </div>

            </section>

            {/* =================================================
                KPI DASHBOARD
            ================================================= */}

            <section className="financial-dashboard">

                <div className="dashboard-heading">

                    <div>

                        <span>
                            FINANCIAL SNAPSHOT
                        </span>

                        <h2>
                            Financial Performance
                        </h2>

                    </div>

                    <div className="financial-record-count">

                        <strong>
                            {summary.transactionCount}
                        </strong>

                        <span>
                            Transactions
                        </span>

                    </div>

                </div>

                <div className="financial-kpi-grid">

                    {/* INCOME */}

                    <div className="financial-kpi-card income-card">

                        <div className="kpi-card-top">

                            <div className="financial-kpi-icon">
                                ↗
                            </div>

                            <span>
                                TOTAL INCOME
                            </span>

                        </div>

                        <strong className="financial-kpi-value">
                            {formatCurrency(
                                summary.totalIncome
                            )}
                        </strong>

                        <div className="financial-kpi-line" />

                    </div>

                    {/* GIVING */}

                    <div className="financial-kpi-card giving-card">

                        <div className="kpi-card-top">

                            <div className="financial-kpi-icon">
                                ₱
                            </div>

                            <span>
                                TOTAL GIVING
                            </span>

                        </div>

                        <strong className="financial-kpi-value">
                            {formatCurrency(
                                summary.totalGiving
                            )}
                        </strong>

                        <div className="financial-kpi-line" />

                    </div>

                    {/* REVENUE */}

                    <div className="financial-kpi-card revenue-card">

                        <div className="kpi-card-top">

                            <div className="financial-kpi-icon">
                                +
                            </div>

                            <span>
                                TOTAL REVENUE
                            </span>

                        </div>

                        <strong className="financial-kpi-value">
                            {formatCurrency(
                                summary.totalRevenue
                            )}
                        </strong>

                        <div className="financial-kpi-line" />

                    </div>

                    {/* EXPENSE */}

                    <div className="financial-kpi-card expense-card">

                        <div className="kpi-card-top">

                            <div className="financial-kpi-icon">
                                ↘
                            </div>

                            <span>
                                TOTAL EXPENSES
                            </span>

                        </div>

                        <strong className="financial-kpi-value">
                            {formatCurrency(
                                summary.totalExpenses
                            )}
                        </strong>

                        <div className="financial-kpi-line" />

                    </div>

                    {/* NET */}

                    <div
                        className={`financial-kpi-card net-card ${
                            summary.netPosition >= 0
                                ? "net-positive-card"
                                : "net-negative-card"
                        }`}
                    >

                        <div className="kpi-card-top">

                            <div className="financial-kpi-icon">
                                =
                            </div>

                            <span>
                                NET POSITION
                            </span>

                        </div>

                        <strong className="financial-kpi-value">

                            {formatCurrency(
                                summary.netPosition
                            )}

                        </strong>

                        <div className="financial-kpi-line" />

                    </div>

                </div>

                {/* =================================================
                    FINANCIAL PERFORMANCE
                ================================================= */}

                <div className="financial-performance-panel">

                    <div className="performance-header">

                        <div>

                            <span>
                                FINANCIAL PERFORMANCE
                            </span>

                            <strong>
                                Revenue vs Expenses
                            </strong>

                        </div>

                        <div
                            className={
                                summary.netPosition >= 0
                                    ? "net-positive"
                                    : "net-negative"
                            }
                        >
                            {summary.netPosition >= 0
                                ? "POSITIVE BALANCE"
                                : "NEGATIVE BALANCE"}
                        </div>

                    </div>

                    <div className="financial-bars">

                        {/* REVENUE */}

                        <div className="financial-bar-row">

                            <div className="financial-bar-label">

                                <span>
                                    Total Revenue
                                </span>

                                <strong>
                                    {formatCurrency(
                                        summary.totalRevenue
                                    )}
                                </strong>

                            </div>

                            <div className="financial-bar-track">

                                <div
                                    className="financial-bar-fill revenue-fill"
                                    style={{
                                        width:
                                            `${Math.min(
                                                (
                                                    summary.totalRevenue /
                                                    revenueMaximum
                                                ) * 100,
                                                100
                                            )}%`,
                                    }}
                                />

                            </div>

                        </div>

                        {/* INCOME */}

                        <div className="financial-bar-row">

                            <div className="financial-bar-label">

                                <span>
                                    Regular Income
                                </span>

                                <strong>
                                    {formatCurrency(
                                        summary.totalIncome
                                    )}
                                </strong>

                            </div>

                            <div className="financial-bar-track">

                                <div
                                    className="financial-bar-fill income-fill"
                                    style={{
                                        width:
                                            `${Math.min(
                                                (
                                                    summary.totalIncome /
                                                    revenueMaximum
                                                ) * 100,
                                                100
                                            )}%`,
                                    }}
                                />

                            </div>

                        </div>

                        {/* GIVING */}

                        <div className="financial-bar-row">

                            <div className="financial-bar-label">

                                <span>
                                    Giving
                                </span>

                                <strong>
                                    {formatCurrency(
                                        summary.totalGiving
                                    )}
                                </strong>

                            </div>

                            <div className="financial-bar-track">

                                <div
                                    className="financial-bar-fill giving-fill"
                                    style={{
                                        width:
                                            `${Math.min(
                                                (
                                                    summary.totalGiving /
                                                    revenueMaximum
                                                ) * 100,
                                                100
                                            )}%`,
                                    }}
                                />

                            </div>

                        </div>

                        {/* EXPENSE */}

                        <div className="financial-bar-row">

                            <div className="financial-bar-label">

                                <span>
                                    Expenses
                                </span>

                                <strong>
                                    {formatCurrency(
                                        summary.totalExpenses
                                    )}
                                </strong>

                            </div>

                            <div className="financial-bar-track">

                                <div
                                    className="financial-bar-fill expense-fill"
                                    style={{
                                        width:
                                            `${Math.min(
                                                (
                                                    summary.totalExpenses /
                                                    Math.max(
                                                        summary.totalRevenue,
                                                        summary.totalExpenses,
                                                        1
                                                    )
                                                ) * 100,
                                                100
                                            )}%`,
                                    }}
                                />

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* =================================================
                DATA CARD
            ================================================= */}

            <section className="financial-data-card">

                <div className="financial-data-header">

                    <div className="financial-data-title">

                        <div className="financial-data-icon">
                            ₱
                        </div>

                        <div>

                            <span>
                                REPORT OUTPUT
                            </span>

                            <h2>
                                Financial Transactions
                            </h2>

                            <p>
                                Detailed financial
                                records from EPIC CMS.
                            </p>

                        </div>

                    </div>

                    <div className="financial-data-meta">

                        <strong>
                            {filteredTransactions.length}
                        </strong>

                        <span>
                            Records
                        </span>

                    </div>

                </div>

                {/* =================================================
                    SEARCH
                ================================================= */}

                <div className="financial-search-panel">

                    <div className="financial-search-wrapper">

                        <span>
                            ⌕
                        </span>

                        <input
                            type="text"
                            value={searchText}
                            onChange={
                                event =>
                                    setSearchText(
                                        event.target.value
                                    )
                            }
                            placeholder="Search description, reference, category, ministry..."
                        />

                        {searchText && (

                            <button
                                type="button"
                                onClick={() =>
                                    setSearchText("")
                                }
                            >
                                ×
                            </button>

                        )}

                    </div>

                    <select
                        value={categoryFilter}
                        onChange={
                            event =>
                                setCategoryFilter(
                                    event.target.value
                                )
                        }
                    >

                        <option value="ALL">
                            All Categories
                        </option>

                        {categories.map(
                            category => (

                                <option
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </option>

                            )
                        )}

                    </select>

                    <select
                        value={paymentFilter}
                        onChange={
                            event =>
                                setPaymentFilter(
                                    event.target.value
                                )
                        }
                    >

                        <option value="ALL">
                            All Payment Methods
                        </option>

                        {paymentMethods.map(
                            method => (

                                <option
                                    key={method}
                                    value={method}
                                >
                                    {method}
                                </option>

                            )
                        )}

                    </select>

                </div>

                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="financial-table-scroll">

                    {loading ? (

                        <div className="financial-loading">

                            <div className="financial-loading-orbit">

                                <span />

                            </div>

                            <strong>
                                Loading financial records...
                            </strong>

                            <span>
                                Retrieving income,
                                giving and expense
                                information.
                            </span>

                        </div>

                    ) : filteredTransactions.length > 0 ? (

                        <table className="financial-report-table">

                            <thead>

                                <tr>

                                    <th>
                                        #
                                    </th>

                                    <th>
                                        DATE
                                    </th>

                                    <th>
                                        REFERENCE
                                    </th>

                                    <th>
                                        DESCRIPTION
                                    </th>

                                    <th>
                                        CATEGORY
                                    </th>

                                    <th>
                                        TYPE
                                    </th>

                                    <th>
                                        INCOME / GIVING
                                    </th>

                                    <th>
                                        EXPENSE
                                    </th>

                                    <th>
                                        NET
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredTransactions.map(
                                    (
                                        transaction,
                                        index
                                    ) => {

                                        const income =
                                            numberValue(
                                                transaction.income
                                            );

                                        const expense =
                                            numberValue(
                                                transaction.expense
                                            );

                                        const net =
                                            income -
                                            expense;

                                        return (

                                            <tr
                                                key={`${transaction.type}-${transaction.id}-${index}`}
                                            >

                                                <td>

                                                    <span className="financial-row-number">
                                                        {index + 1}
                                                    </span>

                                                </td>

                                                <td>

                                                    <span className="financial-date">
                                                        {formatDate(
                                                            transaction.date
                                                        )}
                                                    </span>

                                                </td>

                                                <td>

                                                    <span className="financial-reference">
                                                        {
                                                            transaction.reference ||
                                                            "—"
                                                        }
                                                    </span>

                                                </td>

                                                <td>

                                                    <div className="financial-description">

                                                        <strong>
                                                            {
                                                                transaction.description ||
                                                                "Financial Transaction"
                                                            }
                                                        </strong>

                                                        {transaction.ministry && (

                                                            <span>
                                                                {
                                                                    transaction.ministry
                                                                }
                                                            </span>

                                                        )}

                                                    </div>

                                                </td>

                                                <td>

                                                    <span className="financial-category">

                                                        <i />

                                                        {
                                                            transaction.category ||
                                                            "General"
                                                        }

                                                    </span>

                                                </td>

                                                <td>

                                                    <span
                                                        className={`financial-type ${String(
                                                            transaction.type ||
                                                            "OTHER"
                                                        ).toLowerCase()}`}
                                                    >
                                                        {
                                                            transaction.type ||
                                                            "OTHER"
                                                        }
                                                    </span>

                                                </td>

                                                <td>

                                                    <span className="financial-income">

                                                        {income > 0
                                                            ? formatCurrency(
                                                                income
                                                            )
                                                            : "—"}

                                                    </span>

                                                </td>

                                                <td>

                                                    <span className="financial-expense">

                                                        {expense > 0
                                                            ? formatCurrency(
                                                                expense
                                                            )
                                                            : "—"}

                                                    </span>

                                                </td>

                                                <td>

                                                    <strong
                                                        className={
                                                            net >= 0
                                                                ? "financial-net-positive"
                                                                : "financial-net-negative"
                                                        }
                                                    >
                                                        {formatCurrency(
                                                            net
                                                        )}
                                                    </strong>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>

                    ) : (

                        <div className="financial-empty">

                            <div className="financial-empty-icon">
                                ₱
                            </div>

                            <strong>
                                No financial records found
                            </strong>

                            <span>
                                Try changing your
                                filters or date range.
                            </span>

                            <button
                                type="button"
                                onClick={
                                    resetFilters
                                }
                            >
                                Clear Filters
                            </button>

                        </div>

                    )}

                </div>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="financial-report-footer">

                    <div>

                        <div className="footer-logo">
                            EPIC
                        </div>

                        <div>

                            <strong>
                                EPIC Church Management System
                            </strong>

                            <span>
                                Financial Report Builder
                            </span>

                        </div>

                    </div>

                    <div>

                        <strong>
                            Records displayed:{" "}
                            {filteredTransactions.length}
                        </strong>

                        <span>
                            Total Revenue:{" "}
                            {formatCurrency(
                                summary.totalRevenue
                            )}
                        </span>

                        <span>
                            Net Position:{" "}
                            {formatCurrency(
                                summary.netPosition
                            )}
                        </span>

                    </div>

                </div>

            </section>

        </div>

    );

};

export default FinancialReportBuilder;
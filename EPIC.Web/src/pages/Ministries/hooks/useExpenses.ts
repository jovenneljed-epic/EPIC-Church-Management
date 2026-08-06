import { useCallback, useEffect, useState } from "react";
import expenseApi from "../services/expenseApi";

import type {
    Expense,
    ExpenseSummary,
    CreateExpenseRequest,
} from "../services/expenseApi";
// ============================================================
// TYPES
// ============================================================

export interface ExpenseForm {
    expenseDate: string;
    category: string;
    description: string;
    amount: number;
    payee?: string;
    paymentMethod: string;
    referenceNumber?: string;
    ministry?: string;
    notes?: string;
    status?: string;
}

const EMPTY_SUMMARY: ExpenseSummary = {
    totalExpenses: 0,
    totalAmount: 0,
    approvedAmount: 0,
    pendingAmount: 0,
    rejectedAmount: 0,
};

// ============================================================
// HOOK
// ============================================================

export default function useExpenses() {
    const [expenses, setExpenses] =
        useState<Expense[]>([]);

    const [summary, setSummary] =
        useState<ExpenseSummary | null>(
            EMPTY_SUMMARY
        );

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    // ========================================================
    // LOAD EXPENSES
    // ========================================================

    const loadExpenses = useCallback(
        async () => {
            try {
                setLoading(true);
                setError("");

                const data =
                    await expenseApi.getExpenses();

                setExpenses(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (err) {
                console.error(
                    "LOAD EXPENSES ERROR:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load expenses."
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // ========================================================
    // LOAD SUMMARY
    // ========================================================

    const loadSummary = useCallback(
        async () => {
            try {
                const data =
                    await expenseApi.getSummary();

                setSummary(data);
            } catch (err) {
                console.error(
                    "LOAD EXPENSE SUMMARY ERROR:",
                    err
                );

                setSummary(EMPTY_SUMMARY);
            }
        },
        []
    );

    // ========================================================
    // LOAD ALL
    // ========================================================

    const loadAll = useCallback(
        async () => {
            await Promise.all([
                loadExpenses(),
                loadSummary(),
            ]);
        },
        [
            loadExpenses,
            loadSummary,
        ]
    );

    // ========================================================
    // CREATE EXPENSE
    // ========================================================

    const createExpense = useCallback(
        async (
            expense: ExpenseForm
        ) => {
            try {
                setSaving(true);
                setError("");

                const payload: CreateExpenseRequest = {
                    expenseDate:
                        expense.expenseDate,

                    category:
                        expense.category,

                    description:
                        expense.description,

                    amount:
                        Number(
                            expense.amount
                        ) || 0,

                    payee:
                        expense.payee || "",

                    paymentMethod:
                        expense.paymentMethod,

                    referenceNumber:
                        expense.referenceNumber ||
                        "",

                    ministry:
                        expense.ministry ||
                        "",

                    notes:
                        expense.notes ||
                        "",

                    status:
                        expense.status ||
                        "PENDING",
                };

                await expenseApi.createExpense(
                    payload
                );

                await loadAll();

                return true;
            } catch (err) {
                console.error(
                    "CREATE EXPENSE ERROR:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to create expense."
                );

                return false;
            } finally {
                setSaving(false);
            }
        },
        [loadAll]
    );

    // ========================================================
    // UPDATE EXPENSE
    // ========================================================

    const updateExpense = useCallback(
        async (
            expenseId: number,
            expense: Partial<ExpenseForm>
        ) => {
            try {
                setSaving(true);
                setError("");

                await expenseApi.updateExpense(
                    expenseId,
                    {
                        expenseDate:
                            expense.expenseDate,

                        category:
                            expense.category,

                        description:
                            expense.description,

                        amount:
                            expense.amount !==
                                undefined
                                ? Number(
                                    expense.amount
                                ) || 0
                                : undefined,

                        payee:
                            expense.payee,

                        paymentMethod:
                            expense.paymentMethod,

                        referenceNumber:
                            expense.referenceNumber,

                        ministry:
                            expense.ministry,

                        notes:
                            expense.notes,

                        status:
                            expense.status,
                    }
                );

                await loadAll();

                return true;
            } catch (err) {
                console.error(
                    "UPDATE EXPENSE ERROR:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to update expense."
                );

                return false;
            } finally {
                setSaving(false);
            }
        },
        [loadAll]
    );

    // ========================================================
    // DELETE EXPENSE
    // ========================================================

    const deleteExpense = useCallback(
        async (
            expenseId: number
        ) => {
            try {
                setSaving(true);
                setError("");

                await expenseApi.deleteExpense(
                    expenseId
                );

                await loadAll();

                return true;
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

                return false;
            } finally {
                setSaving(false);
            }
        },
        [loadAll]
    );

    // ========================================================
    // APPROVE EXPENSE
    // ========================================================

    const approveExpense = useCallback(
        async (
            expenseId: number
        ) => {
            try {
                setSaving(true);
                setError("");

                await expenseApi.approveExpense(
                    expenseId
                );

                await loadAll();

                return true;
            } catch (err) {
                console.error(
                    "APPROVE EXPENSE ERROR:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to approve expense."
                );

                return false;
            } finally {
                setSaving(false);
            }
        },
        [loadAll]
    );

    // ========================================================
    // REJECT EXPENSE
    // ========================================================

    const rejectExpense = useCallback(
        async (
            expenseId: number
        ) => {
            try {
                setSaving(true);
                setError("");

                await expenseApi.rejectExpense(
                    expenseId
                );

                await loadAll();

                return true;
            } catch (err) {
                console.error(
                    "REJECT EXPENSE ERROR:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to reject expense."
                );

                return false;
            } finally {
                setSaving(false);
            }
        },
        [loadAll]
    );

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // ========================================================
    // RETURN
    // ========================================================

    return {
        expenses,
        summary,

        loading,
        saving,
        error,

        loadExpenses,
        loadSummary,
        loadAll,

        createExpense,
        updateExpense,
        deleteExpense,

        approveExpense,
        rejectExpense,

        refresh: loadAll,
    };
}
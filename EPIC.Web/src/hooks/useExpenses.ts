import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { expenseApi } from "../services/expenseApi";

import type { Expense } from "../types/expense";

export function useExpenses() {

    const [expenses, setExpenses] =
        useState<Expense[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

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

            } catch (err: any) {

                console.error(
                    "Failed to load expenses:",
                    err
                );

                if (
                    err?.response?.status === 401
                ) {

                    setError(
                        "Your session has expired. Please login again."
                    );

                } else {

                    setError(
                        err?.response?.data?.message ||
                        "Failed to load expenses."
                    );

                }

            } finally {

                setLoading(false);

            }

        },
        []
    );

    useEffect(() => {

        loadExpenses();

    }, [loadExpenses]);

    return {
        expenses,
        loading,
        error,
        loadExpenses,
    };
}
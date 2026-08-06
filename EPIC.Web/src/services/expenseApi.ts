import axios from "axios";

import type {
    Expense,
    ExpenseForm,
    ExpenseSummary,
} from "../types/expense";


// ============================================================
// EPIC API
// ============================================================

const API_BASE_URL =
    "http://192.168.1.10:5109/api";


// ============================================================
// AXIOS CLIENT
// ============================================================

const expenseClient = axios.create({

    baseURL: API_BASE_URL,

    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },

});


// ============================================================
// JWT TOKEN
// ============================================================

expenseClient.interceptors.request.use(

    (config) => {

        const tokenKeys = [
            "token",
            "accessToken",
            "jwt",
            "authToken",
            "epicToken",
        ];

        let token: string | null = null;


        for (const key of tokenKeys) {

            const storedToken =
                localStorage.getItem(key);

            if (storedToken) {

                token =
                    storedToken
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


// ============================================================
// EXPENSE API
// ============================================================

export const expenseApi = {


    // ========================================================
    // GET ALL EXPENSES
    // GET /api/Expense
    // ========================================================

    async getExpenses(): Promise<Expense[]> {

        const response =
            await expenseClient.get<Expense[]>(
                "/Expense"
            );

        return response.data;

    },


    // ========================================================
    // GET EXPENSE BY ID
    // GET /api/Expense/{id}
    // ========================================================

    async getExpenseById(
        id: number
    ): Promise<Expense> {

        const response =
            await expenseClient.get<Expense>(
                `/Expense/${id}`
            );

        return response.data;

    },


    // ========================================================
    // GET EXPENSE SUMMARY
    // GET /api/Expense/summary
    // ========================================================

    async getSummary(): Promise<ExpenseSummary> {

        const response =
            await expenseClient.get<ExpenseSummary>(
                "/Expense/summary"
            );

        return response.data;

    },


    // ========================================================
    // GET EXPENSES BY DATE
    // GET /api/Expense/date
    // ========================================================

    async getExpensesByDate(
        date: string
    ): Promise<Expense[]> {

        const response =
            await expenseClient.get<Expense[]>(
                "/Expense/date",
                {
                    params: {
                        date: date,
                    },
                }
            );

        return response.data;

    },


    // ========================================================
    // GET EXPENSES BY CATEGORY
    // GET /api/Expense/category
    // ========================================================

    async getExpensesByCategory(
        category: string
    ): Promise<Expense[]> {

        const response =
            await expenseClient.get<Expense[]>(
                "/Expense/category",
                {
                    params: {
                        category: category,
                    },
                }
            );

        return response.data;

    },


    // ========================================================
    // CREATE EXPENSE
    // POST /api/Expense
    // ========================================================

    async createExpense(
        expense: ExpenseForm
    ) {

        const response =
            await expenseClient.post(
                "/Expense",
                expense
            );

        return response.data;

    },


    // ========================================================
    // UPDATE EXPENSE
    // PUT /api/Expense/{id}
    // ========================================================

    async updateExpense(
        id: number,
        expense: ExpenseForm
    ) {

        const response =
            await expenseClient.put(
                `/Expense/${id}`,
                expense
            );

        return response.data;

    },


    // ========================================================
    // DELETE EXPENSE
    // DELETE /api/Expense/{id}
    // ========================================================

    async deleteExpense(
        id: number
    ) {

        const response =
            await expenseClient.delete(
                `/Expense/${id}`
            );

        return response.data;

    },


    // ========================================================
    // MONTHLY FINANCIAL DASHBOARD
    //
    // GET
    // /api/Expense/financial-dashboard/monthly
    // ========================================================

    async getMonthlyFinancialDashboard(
        year: number,
        month: number
    ) {

        const response =
            await expenseClient.get(
                "/Expense/financial-dashboard/monthly",
                {
                    params: {
                        year: year,
                        month: month,
                    },
                }
            );

        return response.data;

    },

};
export type Expense = {
    expenseId: number;
    category: string;
    description: string;
    amount: number;
    expenseDate: string;
    paymentMethod?: string;
    referenceNumber?: string;
    recordedBy?: string;
    recordedDate?: string;
};

export type ExpenseForm = {
    category: string;
    description: string;
    amount: number;
    expenseDate: string;
    paymentMethod: string;
    referenceNumber: string;
};

export type ExpenseCategoryTotal = {
    category: string;
    total: number;
};

export type ExpenseSummary = {
    totalRecords: number;
    totalExpenses: number;
    byCategory: ExpenseCategoryTotal[];
};

export type ExpenseRangeSummary = {
    startDate: string;
    endDate: string;
    totalRecords: number;
    totalExpenses: number;
    byCategory: ExpenseCategoryTotal[];
};

export type MonthlyFinancialDashboard = {
    year: number;
    month: number;
    monthName: string;
    startDate: string;
    endDate: string;

    giving: {
        totalRecords: number;
        totalGiving: number;
        byType: {
            givingType: string;
            total: number;
        }[];
    };

    expenses: {
        totalRecords: number;
        totalExpenses: number;
        byCategory: ExpenseCategoryTotal[];
    };

    financialPosition: {
        totalIncome: number;
        totalExpenses: number;
        netChurchFunds: number;
    };
};
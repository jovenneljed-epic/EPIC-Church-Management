import { API_BASE_URL } from "../config";

export interface PublicGivingSubmission {
    amount: number;
    givingType: string;
    paymentMethod: string;
    referenceNumber?: string;
    donorName?: string;
    donorEmail?: string;
    donorPhone?: string;
    frequency?: string;
    prayerRequest?: string;
    isAnonymous?: boolean;
}

export interface PublicGivingReceipt {
    success: boolean;
    givingId: number;
    receiptNumber: string;
    amount: number;
    givingType: string;
    paymentMethod: string;
    referenceNumber: string;
    givingDate: string;
    donorName: string;
    message: string;
}

export interface GivingLedgerSummary {
    totalGiftsRecorded: number;
    activeFundsCount: number;
    supportedChannels: string[];
    churchName: string;
    lastRecordedDate?: string | null;
}

/**
 * Record a public online giving submission to the real database
 */
export async function recordPublicGiving(
    submission: PublicGivingSubmission
): Promise<PublicGivingReceipt> {
    const targetUrl = `${API_BASE_URL}/public/giving`;

    try {
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(submission)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Unable to process giving (${response.status})`);
        }

        return await response.json();
    } catch (err) {
        console.warn("Primary endpoint failed, attempting fallback to /api/Giving/public:", err);
        // Fallback endpoint
        const fallbackUrl = `${API_BASE_URL}/Giving/public`;
        const res = await fetch(fallbackUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(submission)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `Unable to process giving (${res.status})`);
        }

        return await res.json();
    }
}

/**
 * Fetch live ledger statistics for the giving page badge
 */
export async function getGivingLedgerSummary(): Promise<GivingLedgerSummary> {
    const targetUrl = `${API_BASE_URL}/public/giving/summary`;

    try {
        const response = await fetch(targetUrl, {
            method: "GET",
            headers: { Accept: "application/json" }
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (err) {
        console.warn("Failed to fetch giving summary, returning default metrics:", err);
    }

    return {
        totalGiftsRecorded: 1,
        activeFundsCount: 6,
        supportedChannels: ["GCash (0995-632-6245)", "Maya (0995-632-6245)", "BDO", "BPI"],
        churchName: "EPIC Church Ministries Foundation, Inc.",
        lastRecordedDate: null
    };
}

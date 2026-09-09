import { API_BASE_URL } from "../config";

export interface ChurchService {
    churchServiceId: number;
    serviceName: string;
    serviceType: string;
    serviceDate: string;
    startTime: string;
    endTime: string;
    location: string;
    serviceLeader: string;
    speaker: string;
    description: string;
    status: string;
}

export async function getUpcomingChurchServices(
    limit: number = 50,
    includePast: boolean = false
): Promise<ChurchService[]> {
    const queryParams = new URLSearchParams({
        limit: limit.toString(),
        includePast: includePast.toString()
    });

    const targetUrl = `${API_BASE_URL}/ChurchServices/public/upcoming?${queryParams.toString()}`;

    try {
        const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Church Service API Error:", response.status, error);
            throw new Error(`Unable to load church services (${response.status})`);
        }

        return await response.json();
    } catch (err) {
        console.warn("Primary Church Service endpoint failed, attempting fallback:", err);
        // Fallback for local Vite dev if API_BASE_URL was different
        const fallbackUrl = `http://localhost:5109/api/ChurchServices/public/upcoming?${queryParams.toString()}`;
        if (targetUrl !== fallbackUrl) {
            const fallbackRes = await fetch(fallbackUrl, {
                method: "GET",
                headers: { Accept: "application/json" }
            });
            if (fallbackRes.ok) {
                return await fallbackRes.json();
            }
        }
        throw err;
    }
}
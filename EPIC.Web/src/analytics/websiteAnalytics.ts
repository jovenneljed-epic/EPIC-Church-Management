const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "https://epic-api-m2av.onrender.com/api";

interface WebsiteVisitData {
    visitorId: string;
    sessionId: string;
    pageUrl: string;
    pagePath?: string;
    pageTitle?: string;
    landingPage?: string;
    referrer?: string;
    trafficSource?: string;
    trafficMedium?: string;
    trafficCampaign?: string;
    deviceType?: string;
    browser?: string;
    operatingSystem?: string;
    country?: string;
    region?: string;
    city?: string;
    timeOnPageSeconds?: number;
    isBounce?: boolean;
    isReturningVisitor?: boolean;
}

const VISITOR_ID_KEY = "epic_analytics_visitor_id";
const SESSION_ID_KEY = "epic_analytics_session_id";

/**
 * Generate a unique ID.
 */
function generateId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}`;
}

/**
 * Get or create persistent visitor ID.
 */
function getVisitorId(): string {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
        visitorId = generateId();
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    return visitorId;
}

/**
 * Get or create session ID.
 */
function getSessionId(): string {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (!sessionId) {
        sessionId = generateId();
        sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    return sessionId;
}

/**
 * Detect basic device type.
 */
function getDeviceType(): string {
    const width = window.innerWidth;

    if (width <= 767) {
        return "Mobile";
    }

    if (width <= 1024) {
        return "Tablet";
    }

    return "Desktop";
}

/**
 * Detect browser.
 */
function getBrowser(): string {
    const userAgent = navigator.userAgent;

    if (/Edg\//i.test(userAgent)) {
        return "Microsoft Edge";
    }

    if (/Chrome\//i.test(userAgent)) {
        return "Google Chrome";
    }

    if (/Firefox\//i.test(userAgent)) {
        return "Mozilla Firefox";
    }

    if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
        return "Safari";
    }

    if (/MSIE|Trident/i.test(userAgent)) {
        return "Internet Explorer";
    }

    return "Unknown";
}

/**
 * Detect operating system.
 */
function getOperatingSystem(): string {
    const userAgent = navigator.userAgent;

    if (/Windows/i.test(userAgent)) {
        return "Windows";
    }

    if (/Android/i.test(userAgent)) {
        return "Android";
    }

    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return "iOS";
    }

    if (/Mac OS X/i.test(userAgent)) {
        return "macOS";
    }

    if (/Linux/i.test(userAgent)) {
        return "Linux";
    }

    return "Unknown";
}

/**
 * Detect traffic source.
 */
function getTrafficSource(): string {
    const params = new URLSearchParams(window.location.search);

    const utmSource = params.get("utm_source");

    if (utmSource) {
        return utmSource;
    }

    const referrer = document.referrer;

    if (!referrer) {
        return "direct";
    }

    try {
        const referrerHost = new URL(referrer).hostname.toLowerCase();

        if (referrerHost.includes("google.")) {
            return "google";
        }

        if (referrerHost.includes("bing.")) {
            return "bing";
        }

        if (referrerHost.includes("facebook.")) {
            return "facebook";
        }

        if (referrerHost.includes("instagram.")) {
            return "instagram";
        }

        if (referrerHost.includes("youtube.")) {
            return "youtube";
        }

        if (referrerHost.includes("tiktok.")) {
            return "tiktok";
        }

        return referrerHost;
    } catch {
        return "referral";
    }
}

/**
 * Detect traffic medium.
 */
function getTrafficMedium(): string {
    const params = new URLSearchParams(window.location.search);

    const utmMedium = params.get("utm_medium");

    if (utmMedium) {
        return utmMedium;
    }

    const referrer = document.referrer;

    if (!referrer) {
        return "none";
    }

    const source = getTrafficSource();

    if (
        source === "google" ||
        source === "bing"
    ) {
        return "organic";
    }

    return "referral";
}

/**
 * Get UTM campaign.
 */
function getTrafficCampaign(): string {
    const params = new URLSearchParams(window.location.search);

    return params.get("utm_campaign") || "";
}

/**
 * Check whether this visitor has visited before.
 */


/**
 * Record a website visit.
 */
export async function recordWebsiteVisit(
    overrides: Partial<WebsiteVisitData> = {}
): Promise<void> {
    try {
        const visitorIdBefore = localStorage.getItem(VISITOR_ID_KEY);

        const visitorId = getVisitorId();
        const sessionId = getSessionId();

        const returningVisitor =
            visitorIdBefore !== null;

        const visitData: WebsiteVisitData = {
            visitorId,
            sessionId,

            pageUrl: window.location.href,

            pagePath:
                window.location.pathname +
                window.location.search,

            pageTitle: document.title,

            landingPage: window.location.href,

            referrer: document.referrer || "",

            trafficSource: getTrafficSource(),

            trafficMedium: getTrafficMedium(),

            trafficCampaign: getTrafficCampaign(),

            deviceType: getDeviceType(),

            browser: getBrowser(),

            operatingSystem: getOperatingSystem(),

            country: "",

            region: "",

            city: "",

            timeOnPageSeconds: 0,

            isBounce: true,

            isReturningVisitor:
                returningVisitor,

            ...overrides,
        };

        await fetch(`${API_BASE_URL}/WebsiteAnalytics`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            credentials: "include",

            body: JSON.stringify(visitData),
        });
    } catch (error) {
        console.warn(
            "EPIC Website Analytics:",
            error
        );
    }
}

/**
 * Track the current page.
 */
export function initializeWebsiteAnalytics(): void {
    if (typeof window === "undefined") {
        return;
    }

    // Don't track API / authenticated application pages
    // if they are not part of the public website.
    if (
        window.location.pathname.startsWith("/dashboard") ||
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/admin")
    ) {
        return;
    }

    void recordWebsiteVisit();
}
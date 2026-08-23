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

    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;

    deviceType?: string;
    browser?: string;
    operatingSystem?: string;
    screenResolution?: string;

    country?: string;
    region?: string;
    city?: string;

    timeOnPageSeconds?: number;
    isBounce?: boolean;
    isReturningVisitor?: boolean;

    visitedAt?: string;
    lastActivityAt?: string;

    userAgent?: string;
    language?: string;
    timeZone?: string;
}

const VISITOR_ID_KEY =
    "epic_analytics_visitor_id";

const SESSION_ID_KEY =
    "epic_analytics_session_id";

const TRACKING_STARTED_KEY =
    "epic_analytics_tracking_started";

let trackingInitialized = false;

let visitStartedAt = 0;

let currentVisitData:
    WebsiteVisitData | null = null;

let currentVisitId:
    number | null = null;

let engagementTimer:
    number | null = null;


/**
 * =========================================================
 * GENERATE UNIQUE ID
 * =========================================================
 */

function generateId(): string {

    if (
        typeof crypto !== "undefined" &&
        crypto.randomUUID
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}`;
}


/**
 * =========================================================
 * VISITOR ID
 * Persistent across browser sessions.
 * =========================================================
 */

function getVisitorId(): string {

    let visitorId =
        localStorage.getItem(
            VISITOR_ID_KEY
        );

    if (!visitorId) {

        visitorId = generateId();

        localStorage.setItem(
            VISITOR_ID_KEY,
            visitorId
        );
    }

    return visitorId;
}


/**
 * =========================================================
 * SESSION ID
 * New browser session gets a new session ID.
 * =========================================================
 */

function getSessionId(): string {

    let sessionId =
        sessionStorage.getItem(
            SESSION_ID_KEY
        );

    if (!sessionId) {

        sessionId = generateId();

        sessionStorage.setItem(
            SESSION_ID_KEY,
            sessionId
        );
    }

    return sessionId;
}


/**
 * =========================================================
 * DEVICE TYPE
 * =========================================================
 */

function getDeviceType(): string {

    const width =
        window.innerWidth;

    if (width <= 767) {
        return "Mobile";
    }

    if (width <= 1024) {
        return "Tablet";
    }

    return "Desktop";
}


/**
 * =========================================================
 * BROWSER
 * =========================================================
 */

function getBrowser(): string {

    const userAgent =
        navigator.userAgent;

    if (/Edg\//i.test(userAgent)) {
        return "Microsoft Edge";
    }

    if (/OPR\//i.test(userAgent)) {
        return "Opera";
    }

    if (/Chrome\//i.test(userAgent)) {
        return "Google Chrome";
    }

    if (/Firefox\//i.test(userAgent)) {
        return "Mozilla Firefox";
    }

    if (
        /Safari\//i.test(userAgent) &&
        !/Chrome\//i.test(userAgent)
    ) {
        return "Safari";
    }

    if (/MSIE|Trident/i.test(userAgent)) {
        return "Internet Explorer";
    }

    return "Unknown";
}


/**
 * =========================================================
 * OPERATING SYSTEM
 * =========================================================
 */

function getOperatingSystem(): string {

    const userAgent =
        navigator.userAgent;

    if (/Windows/i.test(userAgent)) {
        return "Windows";
    }

    if (/Android/i.test(userAgent)) {
        return "Android";
    }

    if (
        /iPhone|iPad|iPod/i.test(userAgent)
    ) {
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
 * =========================================================
 * SCREEN RESOLUTION
 * =========================================================
 */

function getScreenResolution(): string {

    return `${window.screen.width}x${window.screen.height}`;
}


/**
 * =========================================================
 * TRAFFIC SOURCE
 * =========================================================
 */

function getTrafficSource(): string {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const utmSource =
        params.get("utm_source");

    if (utmSource) {
        return utmSource;
    }

    const referrer =
        document.referrer;

    if (!referrer) {
        return "direct";
    }

    try {

        const hostname =
            new URL(referrer)
                .hostname
                .toLowerCase();

        if (hostname.includes("google.")) {
            return "google";
        }

        if (hostname.includes("bing.")) {
            return "bing";
        }

        if (hostname.includes("facebook.")) {
            return "facebook";
        }

        if (hostname.includes("instagram.")) {
            return "instagram";
        }

        if (hostname.includes("youtube.")) {
            return "youtube";
        }

        if (hostname.includes("tiktok.")) {
            return "tiktok";
        }

        return hostname;

    } catch {

        return "referral";
    }
}


/**
 * =========================================================
 * TRAFFIC MEDIUM
 * =========================================================
 */

function getTrafficMedium(): string {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const utmMedium =
        params.get("utm_medium");

    if (utmMedium) {
        return utmMedium;
    }

    const referrer =
        document.referrer;

    if (!referrer) {
        return "none";
    }

    const source =
        getTrafficSource();

    if (
        source === "google" ||
        source === "bing"
    ) {
        return "organic";
    }

    return "referral";
}


/**
 * =========================================================
 * UTM PARAMETERS
 * =========================================================
 */

function getUtmParameters() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return {

        utmSource:
            params.get("utm_source") || "",

        utmMedium:
            params.get("utm_medium") || "",

        utmCampaign:
            params.get("utm_campaign") || "",

        utmTerm:
            params.get("utm_term") || "",

        utmContent:
            params.get("utm_content") || ""
    };
}


/**
 * =========================================================
 * LANDING PAGE
 * =========================================================
 */

function getLandingPage(): string {

    const stored =
        sessionStorage.getItem(
            "epic_analytics_landing_page"
        );

    if (stored) {
        return stored;
    }

    const current =
        window.location.href;

    sessionStorage.setItem(
        "epic_analytics_landing_page",
        current
    );

    return current;
}


/**
 * =========================================================
 * BUILD VISIT DATA
 * =========================================================
 */

function buildVisitData(): WebsiteVisitData {

    const visitorIdBefore =
        localStorage.getItem(
            VISITOR_ID_KEY
        );

    const visitorId =
        getVisitorId();

    const sessionId =
        getSessionId();

    const utm =
        getUtmParameters();

    const now =
        new Date();

    return {

        visitorId,

        sessionId,

        pageUrl:
            window.location.href,

        pagePath:
            window.location.pathname +
            window.location.search,

        pageTitle:
            document.title,

        landingPage:
            getLandingPage(),

        referrer:
            document.referrer || "",

        trafficSource:
            getTrafficSource(),

        trafficMedium:
            getTrafficMedium(),

        trafficCampaign:
            utm.utmCampaign,

        utmSource:
            utm.utmSource,

        utmMedium:
            utm.utmMedium,

        utmCampaign:
            utm.utmCampaign,

        utmTerm:
            utm.utmTerm,

        utmContent:
            utm.utmContent,

        deviceType:
            getDeviceType(),

        browser:
            getBrowser(),

        operatingSystem:
            getOperatingSystem(),

        screenResolution:
            getScreenResolution(),

        country:
            "",

        region:
            "",

        city:
            "",

        timeOnPageSeconds:
            0,

        isBounce:
            true,

        isReturningVisitor:
            visitorIdBefore !== null,

        visitedAt:
            now.toISOString(),

        lastActivityAt:
            now.toISOString(),

        userAgent:
            navigator.userAgent,

        language:
            navigator.language,

        timeZone:
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone
    };
}


/**
 * =========================================================
 * RECORD WEBSITE VISIT
 * =========================================================
 */

export async function recordWebsiteVisit(
    overrides: Partial<WebsiteVisitData> = {}
): Promise<number | null> {

    try {

        const visitData: WebsiteVisitData = {
            ...buildVisitData(),
            ...overrides
        };

        currentVisitData =
            visitData;

        const response =
            await fetch(
                `${API_BASE_URL}/WebsiteAnalytics`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    credentials: "include",

                    body:
                        JSON.stringify(
                            visitData
                        )
                }
            );

        if (!response.ok) {

            console.warn(
                "EPIC Website Analytics:",
                `Server returned ${response.status}`
            );

            return null;
        }

        const data =
            await response.json();

        if (
            data &&
            typeof data.visitId === "number"
        ) {

            currentVisitId =
                data.visitId;

        }

        return currentVisitId;

    } catch (error) {

        console.warn(
            "EPIC Website Analytics:",
            error
        );

        return null;
    }
}


/**
 * =========================================================
 * UPDATE LOCAL ENGAGEMENT STATE
 * =========================================================
 */

function updateEngagement(): void {

    if (!currentVisitData) {
        return;
    }

    const elapsed =
        Math.floor(
            (Date.now() -
                visitStartedAt) /
            1000
        );

    currentVisitData =
        {
            ...currentVisitData,

            timeOnPageSeconds:
                elapsed,

            isBounce:
                elapsed < 10,

            lastActivityAt:
                new Date()
                    .toISOString()
        };
}


/**
 * =========================================================
 * SEND FINAL ENGAGEMENT DATA
 *
 * NOTE:
 * The current backend creates a new WebsiteVisit
 * on POST. Therefore this sends an engagement record
 * rather than pretending to update the existing row.
 *
 * We will add a dedicated UPDATE endpoint later
 * for precise session/page tracking.
 * =========================================================
 */

async function sendFinalEngagement(): Promise<void> {

    updateEngagement();

    if (!currentVisitData) {
        return;
    }

    try {

        const payload = {
            ...currentVisitData,

            timeOnPageSeconds:
                currentVisitData.timeOnPageSeconds || 0,

            isBounce:
                currentVisitData.isBounce ?? true,

            lastActivityAt:
                new Date()
                    .toISOString(),

            visitedAt:
                currentVisitData.visitedAt ||
                new Date()
                    .toISOString()
        };

        const body =
            JSON.stringify(payload);

        if (
            navigator.sendBeacon
        ) {

            const blob =
                new Blob(
                    [body],
                    {
                        type:
                            "application/json"
                    }
                );

            navigator.sendBeacon(
                `${API_BASE_URL}/WebsiteAnalytics`,
                blob
            );

            return;
        }

        await fetch(
            `${API_BASE_URL}/WebsiteAnalytics`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials: "include",

                keepalive: true,

                body
            }
        );

    } catch (error) {

        console.warn(
            "EPIC Website Analytics engagement:",
            error
        );
    }
}


/**
 * =========================================================
 * ACTIVITY HANDLERS
 * =========================================================
 */

function handleActivity(): void {

    updateEngagement();
}


/**
 * =========================================================
 * INITIALIZE PUBLIC WEBSITE ANALYTICS
 * =========================================================
 */

export function initializeWebsiteAnalytics(): void {

    if (
        typeof window === "undefined"
    ) {
        return;
    }

    if (trackingInitialized) {
        return;
    }

    trackingInitialized = true;
console.log("🔥 EPIC ANALYTICS: initializeWebsiteAnalytics() CALLED");
    // -----------------------------------------------------
    // Don't track authenticated/application pages
    // -----------------------------------------------------

    const path =
        window.location.pathname
            .toLowerCase();

    if (
        path.startsWith("/dashboard") ||
        path.startsWith("/login") ||
        path.startsWith("/admin")
    ) {

        return;
    }

    // -----------------------------------------------------
    // Prevent duplicate tracking in the same page lifecycle
    // -----------------------------------------------------

    if (
        sessionStorage.getItem(
            TRACKING_STARTED_KEY
        ) === "true"
    ) {

        return;
    }

    sessionStorage.setItem(
        TRACKING_STARTED_KEY,
        "true"
    );

    // -----------------------------------------------------
    // Start timer
    // -----------------------------------------------------

    visitStartedAt =
        Date.now();

    // -----------------------------------------------------
    // Record initial visit
    // -----------------------------------------------------

    void recordWebsiteVisit();
console.log("🔥 EPIC ANALYTICS: ABOUT TO RECORD VISIT");

    // -----------------------------------------------------
    // Track visitor activity
    // -----------------------------------------------------

    window.addEventListener(
        "scroll",
        handleActivity,
        {
            passive: true
        }
    );

    window.addEventListener(
        "click",
        handleActivity,
        {
            passive: true
        }
    );

    window.addEventListener(
        "keydown",
        handleActivity,
        {
            passive: true
        }
    );

    window.addEventListener(
        "mousemove",
        handleActivity,
        {
            passive: true
        }
    );

    // -----------------------------------------------------
    // Update engagement periodically
    // -----------------------------------------------------

    engagementTimer =
        window.setInterval(
            () => {

                updateEngagement();

            },
            5000
        );

    // -----------------------------------------------------
    // Track when visitor leaves
    // -----------------------------------------------------

    window.addEventListener(
        "beforeunload",
        () => {

            void sendFinalEngagement();

        }
    );

    window.addEventListener(
        "pagehide",
        () => {

            void sendFinalEngagement();

        }
    );

    // -----------------------------------------------------
    // Handle tab visibility
    // -----------------------------------------------------

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "hidden"
            ) {

                updateEngagement();

            }

        }
    );
}


/**
 * =========================================================
 * CLEANUP
 * =========================================================
 */

export function stopWebsiteAnalytics(): void {

    window.removeEventListener(
        "scroll",
        handleActivity
    );

    window.removeEventListener(
        "click",
        handleActivity
    );

    window.removeEventListener(
        "keydown",
        handleActivity
    );

    window.removeEventListener(
        "mousemove",
        handleActivity
    );

    if (
        engagementTimer !== null
    ) {

        window.clearInterval(
            engagementTimer
        );

        engagementTimer = null;
    }

    trackingInitialized = false;
}
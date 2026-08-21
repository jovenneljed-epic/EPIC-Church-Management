import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import "./MembershipDirectoryReport.css";
import { API_BASE_URL } from "../../config";
import MembershipDirectoryPrint
    from "./MembershipDirectoryPrint";

/* =========================================================
   TYPES
========================================================= */

interface Member {
    memberId: number;
    memberCode?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    suffix?: string;
    gender?: string;
    birthDate?: string;
    civilStatus?: string;
    contactNumber?: string;
    email?: string;
    address?: string;
    ministry?: string;
    status?: string;
    dateJoined?: string;
    occupation?: string;
    notes?: string;
}

interface MembersResponse {
    members?: Member[];
    data?: Member[];
}

export interface MembershipDirectoryReportProps {
    onBack?: () => void;
}

/* =========================================================
   TOKEN
========================================================= */

const getToken = (): string | null => {

    const keys = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken"
    ];

    for (const key of keys) {

        const value =
            localStorage.getItem(key);

        if (value) {

            return value
                .replace(/^Bearer\s+/i, "")
                .trim();
        }
    }

    return null;
};

/* =========================================================
   API
========================================================= */

async function apiFetch<T>(
    endpoint: string
): Promise<T> {

    const baseUrl =
        API_BASE_URL.replace(/\/+$/, "");

    const cleanEndpoint =
        endpoint.replace(/^\/+/, "");

    const token =
        getToken();

    const headers =
        new Headers();

    if (token) {

        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    const response =
        await fetch(
            `${baseUrl}/${cleanEndpoint}`,
            {
                method: "GET",
                headers
            }
        );

    if (response.status === 401) {

        throw new Error(
            "Your session has expired. Please login again."
        );
    }

    if (response.status === 403) {

        throw new Error(
            "You do not have permission to access member records."
        );
    }

    if (!response.ok) {

        throw new Error(
            `Unable to load members (${response.status}).`
        );
    }

    const text =
        await response.text();

    if (!text.trim()) {

        return [] as T;
    }

    return JSON.parse(text) as T;
}

/* =========================================================
   HELPERS
========================================================= */

const normalizeStatus = (
    status?: string
): string => {

    return status
        ?.trim()
        .toUpperCase() === "INACTIVE"
        ? "INACTIVE"
        : "ACTIVE";
};

const getFullName = (
    member: Member
): string => {

    return [
        member.firstName,
        member.middleName,
        member.lastName,
        member.suffix
    ]
        .filter(
            value =>
                Boolean(
                    value?.trim()
                )
        )
        .map(
            value =>
                value!.trim()
        )
        .join(" ") ||
        member.memberCode ||
        "Unnamed Member";
};

const getInitials = (
    name: string
): string => {

    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) {

        return "?";
    }

    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
};

const formatDate = (
    value?: string
): string => {

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
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
};

/* =========================================================
   COMPONENT
========================================================= */

const MembershipDirectoryReport:
    React.FC<MembershipDirectoryReportProps> = ({
        onBack
    }) => {

        /* =====================================================
           STATE
        ===================================================== */

        const [
            members,
            setMembers
        ] = useState<Member[]>([]);

        const [
            loading,
            setLoading
        ] = useState(true);

        const [
            error,
            setError
        ] = useState("");

        const [
            search,
            setSearch
        ] = useState("");

        const [
            statusFilter,
            setStatusFilter
        ] = useState("ALL");

        const [
            genderFilter,
            setGenderFilter
        ] = useState("ALL");

        const [
            ministryFilter,
            setMinistryFilter
        ] = useState("ALL");

        const [
            sortBy,
            setSortBy
        ] = useState<
            "name" |
            "code" |
            "joined"
        >("name");

        /* =====================================================
           LOAD MEMBERS
        ===================================================== */

        const loadMembers =
            async (): Promise<void> => {

                setLoading(true);
                setError("");

                try {

                    const data =
                        await apiFetch<
                            Member[] |
                            MembersResponse
                        >("/Members");

                    let list: Member[] = [];

                    if (
                        Array.isArray(data)
                    ) {

                        list = data;

                    } else if (
                        Array.isArray(
                            data.members
                        )
                    ) {

                        list =
                            data.members;

                    } else if (
                        Array.isArray(
                            data.data
                        )
                    ) {

                        list =
                            data.data;
                    }

                    setMembers(list);

                } catch (err) {

                    console.error(
                        "MEMBERSHIP DIRECTORY ERROR:",
                        err
                    );

                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load member records."
                    );

                } finally {

                    setLoading(false);
                }
            };

        useEffect(() => {

            void loadMembers();

        }, []);

        /* =====================================================
           MINISTRIES
        ===================================================== */

        const ministries =
            useMemo(() => {

                return Array.from(
                    new Set(
                        members
                            .map(
                                member =>
                                    member.ministry?.trim()
                            )
                            .filter(
                                (
                                    value
                                ): value is string =>
                                    Boolean(value)
                            )
                    )
                ).sort();

            }, [members]);

        /* =====================================================
           FILTERED MEMBERS
        ===================================================== */

        const filteredMembers =
            useMemo(() => {

                const query =
                    search
                        .trim()
                        .toLowerCase();

                const result =
                    members.filter(
                        member => {

                            const name =
                                getFullName(
                                    member
                                ).toLowerCase();

                            const code =
                                (
                                    member.memberCode ||
                                    ""
                                ).toLowerCase();

                            const ministry =
                                (
                                    member.ministry ||
                                    ""
                                ).toLowerCase();

                            const contact =
                                (
                                    member.contactNumber ||
                                    ""
                                ).toLowerCase();

                            const email =
                                (
                                    member.email ||
                                    ""
                                ).toLowerCase();

                            const matchesSearch =
                                !query ||
                                name.includes(query) ||
                                code.includes(query) ||
                                ministry.includes(query) ||
                                contact.includes(query) ||
                                email.includes(query);

                            const matchesStatus =
                                statusFilter === "ALL" ||
                                normalizeStatus(
                                    member.status
                                ) === statusFilter;

                            const matchesGender =
                                genderFilter === "ALL" ||
                                (
                                    member.gender ||
                                    ""
                                )
                                    .trim()
                                    .toUpperCase() ===
                                genderFilter;

                            const matchesMinistry =
                                ministryFilter === "ALL" ||
                                (
                                    member.ministry ||
                                    ""
                                ).trim() ===
                                ministryFilter;

                            return (
                                matchesSearch &&
                                matchesStatus &&
                                matchesGender &&
                                matchesMinistry
                            );
                        }
                    );

                return result.sort(
                    (a, b) => {

                        if (
                            sortBy === "code"
                        ) {

                            return (
                                a.memberCode || ""
                            ).localeCompare(
                                b.memberCode || ""
                            );
                        }

                        if (
                            sortBy === "joined"
                        ) {

                            return (
                                new Date(
                                    a.dateJoined || 0
                                ).getTime()
                            ) -
                            (
                                new Date(
                                    b.dateJoined || 0
                                ).getTime()
                            );
                        }

                        return getFullName(a)
                            .localeCompare(
                                getFullName(b)
                            );
                    }
                );

            }, [
                members,
                search,
                statusFilter,
                genderFilter,
                ministryFilter,
                sortBy
            ]);

        /* =====================================================
           STATISTICS
        ===================================================== */

        const total =
            filteredMembers.length;

        const active =
            filteredMembers.filter(
                member =>
                    normalizeStatus(
                        member.status
                    ) === "ACTIVE"
            ).length;

        const inactive =
            filteredMembers.filter(
                member =>
                    normalizeStatus(
                        member.status
                    ) === "INACTIVE"
            ).length;

        const male =
            filteredMembers.filter(
                member =>
                    (
                        member.gender ||
                        ""
                    )
                        .trim()
                        .toUpperCase() ===
                    "MALE"
            ).length;

        const female =
            filteredMembers.filter(
                member =>
                    (
                        member.gender ||
                        ""
                    )
                        .trim()
                        .toUpperCase() ===
                    "FEMALE"
            ).length;

        /* =====================================================
           RESET FILTERS
        ===================================================== */

        const resetFilters = (): void => {

            setSearch("");
            setStatusFilter("ALL");
            setGenderFilter("ALL");
            setMinistryFilter("ALL");
            setSortBy("name");
        };

        /* =====================================================
           GENERATED DATE
        ===================================================== */

        const generatedDate =
            new Date().toLocaleString(
                "en-US",
                {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
                }
            );

        /* =====================================================
           DEDICATED PRINT
           
           IMPORTANT:
           This prints ONLY MembershipDirectoryPrint.
           
           The dashboard is never printed.
        ===================================================== */
const handlePrint = (): void => {

    if (loading) {
        return;
    }

    if (filteredMembers.length === 0) {

        setError(
            "There are no member records available to print."
        );

        return;
    }

    /*
     * Find the actual MembershipDirectoryPrint document.
     */
    const printSource =
        document.querySelector(
            ".membership-print-document"
        ) as HTMLElement | null;

    if (!printSource) {

        setError(
            "MembershipDirectoryPrint could not be found."
        );

        console.error(
            "MembershipDirectoryPrint not found."
        );

        return;
    }

    /*
     * Find MembershipDirectoryPrint.css
     * from the currently loaded stylesheets.
     */
    let printCss = "";

    try {

        const stylesheets =
            Array.from(
                document.styleSheets
            );

        for (const stylesheet of stylesheets) {

            try {

                const rules =
                    Array.from(
                        stylesheet.cssRules
                    );

                const cssText =
                    rules
                        .map(
                            rule =>
                                rule.cssText
                        )
                        .join("\n");

                /*
                 * Only take the CSS belonging to
                 * MembershipDirectoryPrint.
                 */
                if (
                    cssText.includes(
                        ".membership-print-document"
                    ) ||
                    cssText.includes(
                        ".print-header"
                    ) ||
                    cssText.includes(
                        ".print-summary-card"
                    )
                ) {

                    printCss +=
                        cssText + "\n";

                }

            } catch {

                /*
                 * Ignore stylesheets that the browser
                 * does not allow us to read.
                 */
            }
        }

    } catch (error) {

        console.error(
            "Unable to read print stylesheet:",
            error
        );

    }

    /*
     * If CSS could not be extracted,
     * fall back to the loaded stylesheet links.
     */
    if (!printCss.trim()) {

        printCss = `
            @import url("/src/pages/reports/MembershipDirectoryPrint.css");
        `;

    }

    /*
     * Open a separate print window.
     */
    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1200,height=900,scrollbars=yes,resizable=yes"
        );

    if (!printWindow) {

        setError(
            "Unable to open print window. Please allow pop-ups for EPIC CMS."
        );

        return;
    }

    /*
     * Copy ONLY the MembershipDirectoryPrint HTML.
     */
    const html =
        printSource.outerHTML;

    /*
     * Create the print document.
     */
    printWindow.document.open();

    printWindow.document.write(`
        <!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8" />

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />

            <title>
                EPIC CMS - Membership Directory
            </title>

            <style>

                ${printCss}

            </style>

            <style>

                /*
                 * PRINT WINDOW RESET
                 */

                html,
                body {

                    margin: 0 !important;

                    padding: 0 !important;

                    width: 100% !important;

                    background: #ffffff !important;

                }

                body {

                    -webkit-print-color-adjust:
                        exact !important;

                    print-color-adjust:
                        exact !important;

                }

                *,
                *::before,
                *::after {

                    box-sizing: border-box;

                }

                /*
                 * ACTUAL PRINT DOCUMENT
                 */

                .membership-print-document {

                    display: block !important;

                    visibility: visible !important;

                    position: relative !important;

                    left: auto !important;

                    top: auto !important;

                    width: 100% !important;

                    max-width: none !important;

                    margin: 0 !important;

                    padding: 0 !important;

                    background: #ffffff !important;

                }

                /*
                 * A4
                 */

                @page {

                    size: A4 portrait;

                    margin: 10mm;

                }

                @media print {

                    html,
                    body {

                        margin: 0 !important;

                        padding: 0 !important;

                        background: #ffffff !important;

                    }

                    .membership-print-document {

                        display: block !important;

                        visibility: visible !important;

                    }

                }

            </style>

        </head>

        <body>

            ${html}

            <script>

                window.addEventListener(
                    "load",
                    function () {

                        setTimeout(
                            function () {

                                window.focus();

                                window.print();

                            },
                            800
                        );

                    }
                );

                window.addEventListener(
                    "afterprint",
                    function () {

                        setTimeout(
                            function () {

                                window.close();

                            },
                            300
                        );

                    }
                );

            </script>

        </body>

        </html>
    `);

    printWindow.document.close();
};
        /* =====================================================
           RENDER
        ===================================================== */

        return (
            <>

                {/* =================================================
                   NORMAL SCREEN DASHBOARD
                   
                   KEEP THIS EXACTLY AS YOUR DASHBOARD.
                   IT IS NEVER USED FOR PRINTING.
                ================================================= */}

                <div className="membership-directory-screen">

                    <div className="membership-directory">

                        {/* HEADER */}

                        <div className="directory-header">

                            <div className="directory-header-left">

                                {onBack && (

                                    <button
                                        type="button"
                                        className="directory-back-btn"
                                        onClick={onBack}
                                    >
                                        ←
                                    </button>

                                )}

                                <div className="directory-header-icon">
                                    👥
                                </div>

                                <div>

                                    <span className="directory-eyebrow">
                                        EPIC REPORT BUILDER
                                    </span>

                                    <h1>
                                        Membership Directory
                                    </h1>

                                    <p>
                                        Generate a professional
                                        directory of registered
                                        church members.
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                className="directory-print-btn"
                                disabled={
                                    loading ||
                                    filteredMembers.length === 0
                                }
                                onClick={handlePrint}
                            >
                                🖨 Generate / Print
                            </button>

                        </div>

                        {/* SUMMARY */}

                        <div className="directory-summary">

                            <div className="directory-summary-card">

                                <span>
                                    MEMBERS
                                </span>

                                <strong>
                                    {total}
                                </strong>

                                <small>
                                    Matching records
                                </small>

                            </div>

                            <div className="directory-summary-card active">

                                <span>
                                    ACTIVE
                                </span>

                                <strong>
                                    {active}
                                </strong>

                                <small>
                                    Active members
                                </small>

                            </div>

                            <div className="directory-summary-card inactive">

                                <span>
                                    INACTIVE
                                </span>

                                <strong>
                                    {inactive}
                                </strong>

                                <small>
                                    Inactive members
                                </small>

                            </div>

                            <div className="directory-summary-card female">

                                <span>
                                    FEMALE
                                </span>

                                <strong>
                                    {female}
                                </strong>

                                <small>
                                    Female members
                                </small>

                            </div>

                            <div className="directory-summary-card male">

                                <span>
                                    MALE
                                </span>

                                <strong>
                                    {male}
                                </strong>

                                <small>
                                    Male members
                                </small>

                            </div>

                        </div>

                        {/* FILTERS */}

                        <div className="directory-filter-panel">

                            <div className="directory-filter-heading">

                                <div>

                                    <span>
                                        REPORT FILTERS
                                    </span>

                                    <h2>
                                        Configure Directory
                                    </h2>

                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        resetFilters
                                    }
                                    className="directory-reset-btn"
                                >
                                    ↻ Reset Filters
                                </button>

                            </div>

                            <div className="directory-filter-grid">

                                <div className="directory-filter-field search-field">

                                    <label>
                                        SEARCH MEMBERS
                                    </label>

                                    <div className="directory-search">

                                        <span>
                                            ⌕
                                        </span>

                                        <input
                                            type="text"
                                            placeholder="Name, code, email, contact..."
                                            value={search}
                                            onChange={
                                                event =>
                                                    setSearch(
                                                        event.target.value
                                                    )
                                            }
                                        />

                                    </div>

                                </div>

                                <div className="directory-filter-field">

                                    <label>
                                        STATUS
                                    </label>

                                    <select
                                        value={statusFilter}
                                        onChange={
                                            event =>
                                                setStatusFilter(
                                                    event.target.value
                                                )
                                        }
                                    >

                                        <option value="ALL">
                                            All Status
                                        </option>

                                        <option value="ACTIVE">
                                            Active
                                        </option>

                                        <option value="INACTIVE">
                                            Inactive
                                        </option>

                                    </select>

                                </div>

                                <div className="directory-filter-field">

                                    <label>
                                        GENDER
                                    </label>

                                    <select
                                        value={genderFilter}
                                        onChange={
                                            event =>
                                                setGenderFilter(
                                                    event.target.value
                                                )
                                        }
                                    >

                                        <option value="ALL">
                                            All Gender
                                        </option>

                                        <option value="MALE">
                                            Male
                                        </option>

                                        <option value="FEMALE">
                                            Female
                                        </option>

                                    </select>

                                </div>

                                <div className="directory-filter-field">

                                    <label>
                                        MINISTRY
                                    </label>

                                    <select
                                        value={ministryFilter}
                                        onChange={
                                            event =>
                                                setMinistryFilter(
                                                    event.target.value
                                                )
                                        }
                                    >

                                        <option value="ALL">
                                            All Ministries
                                        </option>

                                        {ministries.map(
                                            ministry => (

                                                <option
                                                    key={ministry}
                                                    value={ministry}
                                                >
                                                    {ministry}
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>

                                <div className="directory-filter-field">

                                    <label>
                                        SORT BY
                                    </label>

                                    <select
                                        value={sortBy}
                                        onChange={
                                            event =>
                                                setSortBy(
                                                    event.target.value as
                                                    "name" |
                                                    "code" |
                                                    "joined"
                                                )
                                        }
                                    >

                                        <option value="name">
                                            Name — A to Z
                                        </option>

                                        <option value="code">
                                            Member Code
                                        </option>

                                        <option value="joined">
                                            Date Joined
                                        </option>

                                    </select>

                                </div>

                            </div>

                        </div>

                        {/* SCREEN DOCUMENT */}

                        <div className="directory-document">

                            <div className="directory-document-header">

                                <div>

                                    <span className="document-label">
                                        EPIC CHURCH MANAGEMENT SYSTEM
                                    </span>

                                    <h2>
                                        MEMBERSHIP DIRECTORY
                                    </h2>

                                    <p>
                                        Official Church Member Listing
                                    </p>

                                </div>

                                <div className="document-meta">

                                    <span>
                                        GENERATED
                                    </span>

                                    <strong>
                                        {new Date().toLocaleDateString(
                                            "en-US",
                                            {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            }
                                        )}
                                    </strong>

                                </div>

                            </div>

                            <div className="directory-document-line" />

                            {loading ? (

                                <div className="directory-loading">

                                    <div className="directory-spinner" />

                                    <h3>
                                        Loading Member Directory
                                    </h3>

                                    <p>
                                        Retrieving member records...
                                    </p>

                                </div>

                            ) : error ? (

                                <div className="directory-error">

                                    <div>
                                        !
                                    </div>

                                    <h3>
                                        Unable to Load Directory
                                    </h3>

                                    <p>
                                        {error}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void loadMembers()
                                        }
                                    >
                                        Try Again
                                    </button>

                                </div>

                            ) : filteredMembers.length === 0 ? (

                                <div className="directory-empty">

                                    <div>
                                        👥
                                    </div>

                                    <h3>
                                        No Members Found
                                    </h3>

                                    <p>
                                        No member records match
                                        the selected report filters.
                                    </p>

                                </div>

                            ) : (

                                <div className="directory-table-wrapper">

                                    <table className="directory-table">

                                        <thead>

                                            <tr>

                                                <th>#</th>

                                                <th>MEMBER</th>

                                                <th>CODE</th>

                                                <th>GENDER</th>

                                                <th>CONTACT</th>

                                                <th>MINISTRY</th>

                                                <th>STATUS</th>

                                                <th>DATE JOINED</th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {filteredMembers.map(
                                                (
                                                    member,
                                                    index
                                                ) => (

                                                    <tr
                                                        key={
                                                            member.memberId
                                                        }
                                                    >

                                                        <td className="directory-number">

                                                            {String(
                                                                index + 1
                                                            ).padStart(
                                                                2,
                                                                "0"
                                                            )}

                                                        </td>

                                                        <td>

                                                            <div className="directory-member">

                                                                <div className="directory-avatar">

                                                                    {getInitials(
                                                                        getFullName(
                                                                            member
                                                                        )
                                                                    )}

                                                                </div>

                                                                <div>

                                                                    <strong>
                                                                        {getFullName(
                                                                            member
                                                                        )}
                                                                    </strong>

                                                                    <span>
                                                                        {
                                                                            member.email ||
                                                                            "No email registered"
                                                                        }
                                                                    </span>

                                                                </div>

                                                            </div>

                                                        </td>

                                                        <td>

                                                            <span className="directory-code">

                                                                {
                                                                    member.memberCode ||
                                                                    `MEM-${String(
                                                                        member.memberId
                                                                    ).padStart(
                                                                        4,
                                                                        "0"
                                                                    )}`
                                                                }

                                                            </span>

                                                        </td>

                                                        <td>
                                                            {
                                                                member.gender ||
                                                                "—"
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                member.contactNumber ||
                                                                "—"
                                                            }
                                                        </td>

                                                        <td>

                                                            <span className="directory-ministry">

                                                                {
                                                                    member.ministry ||
                                                                    "General"
                                                                }

                                                            </span>

                                                        </td>

                                                        <td>

                                                            <span
                                                                className={
                                                                    `directory-status ${normalizeStatus(
                                                                        member.status
                                                                    ).toLowerCase()}`
                                                                }
                                                            >

                                                                ●{" "}

                                                                {
                                                                    normalizeStatus(
                                                                        member.status
                                                                    )
                                                                }

                                                            </span>

                                                        </td>

                                                        <td>

                                                            {
                                                                formatDate(
                                                                    member.dateJoined
                                                                )
                                                            }

                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                            {!loading &&
                                !error &&
                                filteredMembers.length > 0 && (

                                    <div className="directory-document-footer">

                                        <span>
                                            Showing{" "}
                                            <strong>
                                                {
                                                    filteredMembers.length
                                                }
                                            </strong>{" "}
                                            member records
                                        </span>

                                        <span>
                                            EPIC CMS • Membership Directory
                                        </span>

                                    </div>

                                )}

                        </div>

                    </div>

                </div>

                {/* =================================================
                   HIDDEN PRINT SOURCE

                   THIS NEVER APPEARS ON THE DASHBOARD.

                   handlePrint() copies ONLY this component.
                ================================================= */}

                <div
                    className="membership-directory-print"
                    aria-hidden="true"
                    style={{
                        display: "none"
                    }}
                >

                    <MembershipDirectoryPrint
                        members={filteredMembers}
                        generatedAt={generatedDate}
                    />

                </div>

            </>
        );
    };

export default MembershipDirectoryReport;
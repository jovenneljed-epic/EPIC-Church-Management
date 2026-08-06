import { useCallback, useEffect, useMemo, useState } from "react";
import "./Giving.css";

const API_BASE_URL = "http://192.168.1.10:5109/api";

// ============================================================
// TYPES
// ============================================================

type GivingRecord = {
    givingId: number;
    memberId: number | null;
    memberCode?: string;
    memberName?: string;
    churchServiceId: number | null;
    serviceName?: string;
    givingType: string;
    amount: number;
    givingDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
    recordedBy?: string;
    recordedDate?: string;
};

type Dashboard = {
    totalGiving: number;
    todayGiving: number;
    monthlyGiving: number;
    totalRecords: number;
    todayRecords: number;
    monthlyRecords: number;
    tithes: number;
    offerings: number;
    missions: number;
    specialOfferings: number;
    pledges: number;
    other: number;
};

type Member = {
    memberId: number;
    memberCode?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    fullName?: string;
    status?: string;
};

type ChurchService = {
    churchServiceId: number;
    serviceName: string;
    serviceDate: string;
    status?: string;
};

type FormData = {
    memberId: string;
    churchServiceId: string;
    givingType: string;
    amount: string;
    givingDate: string;
    paymentMethod: string;
    referenceNumber: string;
    notes: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const GIVING_TYPES = [
    "TITHE",
    "OFFERING",
    "MISSION",
    "SPECIAL OFFERING",
    "PLEDGE",
    "OTHER",
];

const PAYMENT_METHODS = [
    "CASH",
    "GCASH",
    "BANK TRANSFER",
    "CHECK",
    "OTHER",
];

// ============================================================
// HELPERS
// ============================================================

function today(): string {
    const d = new Date();

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function createEmptyForm(): FormData {
    return {
        memberId: "",
        churchServiceId: "",
        givingType: "OFFERING",
        amount: "",
        givingDate: today(),
        paymentMethod: "CASH",
        referenceNumber: "",
        notes: "",
    };
}

function getToken(): string {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("epicToken") ||
        ""
    );
}

async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = getToken();

    const headers = new Headers(options.headers);

    headers.set("Accept", "application/json");

    if (options.body) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });
}

async function readJson(response: Response): Promise<any> {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function money(value: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
    }).format(Number(value) || 0);
}

function dateOnly(value?: string): string {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function dateInput(value?: string): string {
    if (!value) {
        return "";
    }

    return value.substring(0, 10);
}

function getMemberName(member: Member): string {
    if (member.fullName?.trim()) {
        return member.fullName.trim();
    }

    const first =
        member.firstName?.trim() || "";

    const middle =
        member.middleName?.trim() &&
            member.middleName.trim().toUpperCase() !== "N/A"
            ? ` ${member.middleName.trim()}`
            : "";

    const last =
        member.lastName?.trim() || "";

    if (last || first) {
        return `${last}, ${first}${middle}`;
    }

    return member.memberCode || "Unnamed Member";
}

function extractArray<T>(
    data: any,
    keys: string[] = []
): T[] {
    if (Array.isArray(data)) {
        return data;
    }

    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    return [];
}

function formatLabel(value: string): string {
    return value
        .toLowerCase()
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
}

// ============================================================
// COMPONENT
// ============================================================

export default function Giving() {
    const [dashboard, setDashboard] =
        useState<Dashboard | null>(null);

    const [records, setRecords] =
        useState<GivingRecord[]>([]);

    const [members, setMembers] =
        useState<Member[]>([]);

    const [services, setServices] =
        useState<ChurchService[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [showModal, setShowModal] =
        useState(false);

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [search, setSearch] =
        useState("");

    const [typeFilter, setTypeFilter] =
        useState("ALL");

    const [paymentFilter, setPaymentFilter] =
        useState("ALL");

    const [dateFilter, setDateFilter] =
        useState("");

    const [form, setForm] =
        useState<FormData>(createEmptyForm());

    // =========================================================
    // DASHBOARD
    // =========================================================

    const loadDashboard = useCallback(async () => {
        const response = await apiFetch(
            "/Giving/dashboard"
        );

        if (!response.ok) {
            const data = await readJson(response);

            throw new Error(
                data?.message ||
                `Giving dashboard failed. HTTP ${response.status}`
            );
        }

        const data = await readJson(response);

        setDashboard({
            totalGiving: Number(data?.totalGiving) || 0,
            todayGiving: Number(data?.todayGiving) || 0,
            monthlyGiving:
                Number(data?.monthlyGiving) || 0,

            totalRecords:
                Number(data?.totalRecords) || 0,

            todayRecords:
                Number(data?.todayRecords) || 0,

            monthlyRecords:
                Number(data?.monthlyRecords) || 0,

            tithes: Number(data?.tithes) || 0,
            offerings:
                Number(data?.offerings) || 0,

            missions:
                Number(data?.missions) || 0,

            specialOfferings:
                Number(data?.specialOfferings) || 0,

            pledges:
                Number(data?.pledges) || 0,

            other:
                Number(data?.other) || 0,
        });
    }, []);

    // =========================================================
    // RECORDS
    // =========================================================

    const loadRecords = useCallback(async () => {
        const response = await apiFetch(
            "/Giving"
        );

        if (!response.ok) {
            const data = await readJson(response);

            throw new Error(
                data?.message ||
                `Giving records failed. HTTP ${response.status}`
            );
        }

        const data = await readJson(response);

        const list =
            extractArray<GivingRecord>(
                data,
                [
                    "records",
                    "givings",
                    "data",
                    "items",
                ]
            );

        setRecords(list);
    }, []);

    // =========================================================
    // MEMBERS
    // =========================================================

    const loadMembers = useCallback(async () => {
        const endpoints = [
            "/Members",
            "/Member",
        ];

        for (const endpoint of endpoints) {
            try {
                const response =
                    await apiFetch(endpoint);

                if (!response.ok) {
                    continue;
                }

                const data =
                    await readJson(response);

                const list =
                    extractArray<Member>(
                        data,
                        [
                            "members",
                            "Members",
                            "records",
                            "data",
                            "items",
                        ]
                    );

                setMembers(list);

                console.log(
                    `EPIC MEMBERS LOADED: ${list.length}`
                );

                return;
            } catch (err) {
                console.error(
                    `MEMBER LOAD ERROR ${endpoint}:`,
                    err
                );
            }
        }

        setMembers([]);
    }, []);

    // =========================================================
    // CHURCH SERVICES
    // =========================================================

    const loadServices = useCallback(async () => {
        const endpoints = [
            "/ChurchService",
            "/ChurchServices",
        ];

        for (const endpoint of endpoints) {
            try {
                const response =
                    await apiFetch(endpoint);

                if (!response.ok) {
                    continue;
                }

                const data =
                    await readJson(response);

                const list =
                    extractArray<ChurchService>(
                        data,
                        [
                            "services",
                            "Services",
                            "records",
                            "data",
                            "items",
                        ]
                    );

                setServices(list);

                console.log(
                    `EPIC SERVICES LOADED: ${list.length}`
                );

                return;
            } catch (err) {
                console.error(
                    `SERVICE LOAD ERROR ${endpoint}:`,
                    err
                );
            }
        }

        setServices([]);
    }, []);

    // =========================================================
    // LOAD ALL
    // =========================================================

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            await Promise.all([
                loadDashboard(),
                loadRecords(),
                loadMembers(),
                loadServices(),
            ]);
        } catch (err) {
            console.error(
                "EPIC GIVING LOAD ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load giving data."
            );
        } finally {
            setLoading(false);
        }
    }, [
        loadDashboard,
        loadRecords,
        loadMembers,
        loadServices,
    ]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // =========================================================
    // FILTER
    // =========================================================

    const filteredRecords = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        return records.filter(record => {
            const memberName =
                record.memberName || "";

            const memberCode =
                record.memberCode || "";

            const givingType =
                record.givingType || "";

            const paymentMethod =
                record.paymentMethod || "";

            const reference =
                record.referenceNumber || "";

            const matchesSearch =
                !searchValue ||
                memberName
                    .toLowerCase()
                    .includes(searchValue) ||
                memberCode
                    .toLowerCase()
                    .includes(searchValue) ||
                givingType
                    .toLowerCase()
                    .includes(searchValue) ||
                paymentMethod
                    .toLowerCase()
                    .includes(searchValue) ||
                reference
                    .toLowerCase()
                    .includes(searchValue);

            const matchesType =
                typeFilter === "ALL" ||
                givingType === typeFilter;

            const matchesPayment =
                paymentFilter === "ALL" ||
                paymentMethod === paymentFilter;

            const matchesDate =
                !dateFilter ||
                dateInput(record.givingDate) ===
                dateFilter;

            return (
                matchesSearch &&
                matchesType &&
                matchesPayment &&
                matchesDate
            );
        });
    }, [
        records,
        search,
        typeFilter,
        paymentFilter,
        dateFilter,
    ]);

    const filteredTotal = useMemo(() => {
        return filteredRecords.reduce(
            (sum, record) =>
                sum + Number(record.amount || 0),
            0
        );
    }, [filteredRecords]);

    // =========================================================
    // FORM
    // =========================================================

    function updateForm(
        field: keyof FormData,
        value: string
    ) {
        setForm(current => ({
            ...current,
            [field]: value,
        }));
    }

    function openAddModal() {
        setEditingId(null);
        setForm(createEmptyForm());
        setError("");
        setSuccess("");
        setShowModal(true);
    }

    function openEditModal(
        record: GivingRecord
    ) {
        setEditingId(record.givingId);

        setForm({
            memberId:
                record.memberId?.toString() || "",

            churchServiceId:
                record.churchServiceId?.toString() ||
                "",

            givingType:
                record.givingType || "OFFERING",

            amount:
                record.amount?.toString() || "",

            givingDate:
                dateInput(record.givingDate),

            paymentMethod:
                record.paymentMethod || "CASH",

            referenceNumber:
                record.referenceNumber || "",

            notes:
                record.notes || "",
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    }

    function closeModal() {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingId(null);
        setForm(createEmptyForm());
    }

    // =========================================================
    // SAVE
    // =========================================================

    async function saveGiving() {
        setError("");
        setSuccess("");

        const amount =
            Number(form.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            setError(
                "Please enter a valid giving amount."
            );
            return;
        }

        if (!form.givingDate) {
            setError(
                "Please select a giving date."
            );
            return;
        }

        setSaving(true);

        try {
            const payload = {
                memberId:
                    form.memberId
                        ? Number(form.memberId)
                        : null,

                churchServiceId:
                    form.churchServiceId
                        ? Number(
                            form.churchServiceId
                        )
                        : null,

                givingType:
                    form.givingType,

                amount,

                givingDate:
                    form.givingDate,

                paymentMethod:
                    form.paymentMethod,

                referenceNumber:
                    form.referenceNumber.trim(),

                notes:
                    form.notes.trim(),
            };

            console.log(
                "EPIC GIVING PAYLOAD:",
                payload
            );

            const endpoint =
                editingId !== null
                    ? `/Giving/${editingId}`
                    : "/Giving";

            const method =
                editingId !== null
                    ? "PUT"
                    : "POST";

            const response =
                await apiFetch(
                    endpoint,
                    {
                        method,
                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            const data =
                await readJson(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    `Unable to save giving. HTTP ${response.status}`
                );
            }

            setSuccess(
                editingId !== null
                    ? "Giving record updated successfully."
                    : "Giving recorded successfully."
            );

            setShowModal(false);
            setEditingId(null);
            setForm(createEmptyForm());

            await Promise.all([
                loadDashboard(),
                loadRecords(),
            ]);
        } catch (err) {
            console.error(
                "EPIC SAVE GIVING ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save giving."
            );
        } finally {
            setSaving(false);
        }
    }

    // =========================================================
    // DELETE
    // =========================================================

    async function deleteGiving(
        givingId: number
    ) {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this giving record?"
            );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            const response =
                await apiFetch(
                    `/Giving/${givingId}`,
                    {
                        method: "DELETE",
                    }
                );

            const data =
                await readJson(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    `Unable to delete giving. HTTP ${response.status}`
                );
            }

            setSuccess(
                "Giving record deleted successfully."
            );

            await Promise.all([
                loadDashboard(),
                loadRecords(),
            ]);
        } catch (err) {
            console.error(
                "EPIC DELETE GIVING ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete giving."
            );
        }
    }

    // =========================================================
    // CLEAR FILTERS
    // =========================================================

    function clearFilters() {
        setSearch("");
        setTypeFilter("ALL");
        setPaymentFilter("ALL");
        setDateFilter("");
    }

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="giving-page">

            {/* HEADER */}

            <div className="giving-header">

                <div>
                    <h1>
                        Giving Management
                    </h1>

                    <p>
                        Manage tithes, offerings,
                        missions and church
                        giving records.
                    </p>
                </div>

                <div className="giving-header-actions">

                    <button
                        className="btn btn-secondary"
                        onClick={loadAll}
                        disabled={loading}
                    >
                        ↻ Refresh
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={openAddModal}
                    >
                        ＋ Record Giving
                    </button>

                </div>

            </div>

            {/* ERROR */}

            {error && (
                <div className="giving-alert giving-alert-error">
                    <strong>!</strong>
                    <span>{error}</span>
                </div>
            )}

            {/* SUCCESS */}

            {success && (
                <div className="giving-alert giving-alert-success">
                    ✓ {success}
                </div>
            )}

            {/* DASHBOARD */}

            <section className="giving-dashboard">

                <div className="giving-stat-card main-stat">

                    <div className="stat-icon">
                        ₱
                    </div>

                    <div>
                        <span>
                            Total Giving
                        </span>

                        <strong>
                            {money(
                                dashboard?.totalGiving ||
                                0
                            )}
                        </strong>

                        <small>
                            {dashboard?.totalRecords ||
                                0}{" "}
                            records
                        </small>
                    </div>

                </div>

                <div className="giving-stat-card">

                    <span>Today</span>

                    <strong>
                        {money(
                            dashboard?.todayGiving ||
                            0
                        )}
                    </strong>

                    <small>
                        {dashboard?.todayRecords ||
                            0} records
                    </small>

                </div>

                <div className="giving-stat-card">

                    <span>
                        This Month
                    </span>

                    <strong>
                        {money(
                            dashboard?.monthlyGiving ||
                            0
                        )}
                    </strong>

                    <small>
                        {dashboard?.monthlyRecords ||
                            0} records
                    </small>

                </div>

                <div className="giving-stat-card">

                    <span>Tithes</span>

                    <strong>
                        {money(
                            dashboard?.tithes || 0
                        )}
                    </strong>

                </div>

                <div className="giving-stat-card">

                    <span>Offerings</span>

                    <strong>
                        {money(
                            dashboard?.offerings || 0
                        )}
                    </strong>

                </div>

                <div className="giving-stat-card">

                    <span>Missions</span>

                    <strong>
                        {money(
                            dashboard?.missions || 0
                        )}
                    </strong>

                </div>

            </section>

            {/* BREAKDOWN */}

            <section className="giving-breakdown">

                <div className="breakdown-header">

                    <div>
                        <h2>
                            Giving Breakdown
                        </h2>

                        <p>
                            Lifetime giving by
                            category.
                        </p>
                    </div>

                </div>

                <div className="breakdown-grid">

                    <div>
                        <span>Tithes</span>
                        <strong>
                            {money(
                                dashboard?.tithes ||
                                0
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Offerings</span>
                        <strong>
                            {money(
                                dashboard?.offerings ||
                                0
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Missions</span>
                        <strong>
                            {money(
                                dashboard?.missions ||
                                0
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Special Offering
                        </span>
                        <strong>
                            {money(
                                dashboard?.specialOfferings ||
                                0
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Pledges</span>
                        <strong>
                            {money(
                                dashboard?.pledges ||
                                0
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Other</span>
                        <strong>
                            {money(
                                dashboard?.other || 0
                            )}
                        </strong>
                    </div>

                </div>

            </section>

            {/* RECORDS */}

            <section className="giving-records-card">

                <div className="records-header">

                    <div>

                        <h2>
                            Giving Records
                        </h2>

                        <p>
                            {filteredRecords.length}{" "}
                            displayed records
                            {" • "}
                            {money(filteredTotal)}
                        </p>

                    </div>

                </div>

                {/* FILTERS */}

                <div className="giving-filters">

                    <input
                        type="text"
                        placeholder="Search member, type, reference..."
                        value={search}
                        onChange={e =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                    <select
                        value={typeFilter}
                        onChange={e =>
                            setTypeFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Types
                        </option>

                        {GIVING_TYPES.map(type => (
                            <option
                                key={type}
                                value={type}
                            >
                                {formatLabel(type)}
                            </option>
                        ))}

                    </select>

                    <select
                        value={paymentFilter}
                        onChange={e =>
                            setPaymentFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Payments
                        </option>

                        {PAYMENT_METHODS.map(
                            method => (
                                <option
                                    key={method}
                                    value={method}
                                >
                                    {formatLabel(
                                        method
                                    )}
                                </option>
                            )
                        )}

                    </select>

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={e =>
                            setDateFilter(
                                e.target.value
                            )
                        }
                    />

                    {(search ||
                        typeFilter !== "ALL" ||
                        paymentFilter !== "ALL" ||
                        dateFilter) && (
                            <button
                                className="btn btn-light"
                                onClick={
                                    clearFilters
                                }
                            >
                                Clear
                            </button>
                        )}

                </div>

                {/* TABLE */}

                <div className="table-wrapper">

                    <table className="giving-table">

                        <thead>

                            <tr>
                                <th>Date</th>
                                <th>Member</th>
                                <th>Giving Type</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Service</th>
                                <th>Reference</th>
                                <th>Actions</th>
                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="empty-cell"
                                    >
                                        Loading giving
                                        records...
                                    </td>
                                </tr>
                            ) : filteredRecords.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="empty-cell"
                                    >
                                        No giving
                                        records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map(
                                    record => (
                                        <tr
                                            key={
                                                record.givingId
                                            }
                                        >

                                            <td>
                                                {dateOnly(
                                                    record.givingDate
                                                )}
                                            </td>

                                            <td>
                                                <div className="member-cell">

                                                    <strong>
                                                        {
                                                            record.memberName ||
                                                            "Anonymous"
                                                        }
                                                    </strong>

                                                    {record.memberCode && (
                                                        <small>
                                                            {
                                                                record.memberCode
                                                            }
                                                        </small>
                                                    )}

                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`giving-type type-${(
                                                        record.givingType ||
                                                        ""
                                                    )
                                                        .toLowerCase()
                                                        .replace(
                                                            /\s+/g,
                                                            "-"
                                                        )}`}
                                                >
                                                    {
                                                        record.givingType
                                                    }
                                                </span>
                                            </td>

                                            <td className="amount-cell">
                                                {money(
                                                    Number(
                                                        record.amount ||
                                                        0
                                                    )
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    record.paymentMethod
                                                }
                                            </td>

                                            <td>
                                                {
                                                    record.serviceName ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    record.referenceNumber ||
                                                    "—"
                                                }
                                            </td>

                                            <td>

                                                <div className="action-buttons">

                                                    <button
                                                        className="action-edit"
                                                        onClick={() =>
                                                            openEditModal(
                                                                record
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="action-delete"
                                                        onClick={() =>
                                                            deleteGiving(
                                                                record.givingId
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </section>

            {/* MODAL */}

            {showModal && (

                <div
                    className="modal-backdrop"
                    onMouseDown={e => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="giving-modal">

                        {/* HEADER */}

                        <div className="modal-header">

                            <div>

                                <h2>
                                    {editingId !== null
                                        ? "Edit Giving"
                                        : "Record Giving"}
                                </h2>

                                <p>
                                    Record a church
                                    giving transaction.
                                </p>

                            </div>

                            <button
                                className="modal-close"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                ×
                            </button>

                        </div>

                        {/* BODY */}

                        <div className="modal-body">

                            <div className="form-grid">

                                {/* MEMBER */}

                                <div className="form-group full-width">

                                    <label>
                                        Member
                                    </label>

                                    <select
                                        value={
                                            form.memberId
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "memberId",
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="">
                                            Anonymous /
                                            Not a Member
                                        </option>

                                        {members.map(
                                            member => (
                                                <option
                                                    key={
                                                        member.memberId
                                                    }
                                                    value={
                                                        member.memberId
                                                    }
                                                >
                                                    {
                                                        getMemberName(
                                                            member
                                                        )
                                                    }

                                                    {member.memberCode
                                                        ? ` — ${member.memberCode}`
                                                        : ""}
                                                </option>
                                            )
                                        )}

                                    </select>

                                    <small
                                        style={{
                                            display:
                                                "block",
                                            marginTop:
                                                "6px",
                                            opacity:
                                                0.65,
                                        }}
                                    >
                                        {members.length ===
                                            0
                                            ? "No members loaded."
                                            : `${members.length} member${members.length !== 1 ? "s" : ""} available`}
                                    </small>

                                </div>

                                {/* TYPE */}

                                <div className="form-group">

                                    <label>
                                        Giving Type *
                                    </label>

                                    <select
                                        value={
                                            form.givingType
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "givingType",
                                                e.target.value
                                            )
                                        }
                                    >

                                        {GIVING_TYPES.map(
                                            type => (
                                                <option
                                                    key={
                                                        type
                                                    }
                                                    value={
                                                        type
                                                    }
                                                >
                                                    {formatLabel(
                                                        type
                                                    )}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* AMOUNT */}

                                <div className="form-group">

                                    <label>
                                        Amount *
                                    </label>

                                    <div className="amount-input">

                                        <span>₱</span>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={
                                                form.amount
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "amount",
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>

                                {/* DATE */}

                                <div className="form-group">

                                    <label>
                                        Giving Date *
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            form.givingDate
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "givingDate",
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                {/* PAYMENT */}

                                <div className="form-group">

                                    <label>
                                        Payment Method *
                                    </label>

                                    <select
                                        value={
                                            form.paymentMethod
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "paymentMethod",
                                                e.target.value
                                            )
                                        }
                                    >

                                        {PAYMENT_METHODS.map(
                                            method => (
                                                <option
                                                    key={
                                                        method
                                                    }
                                                    value={
                                                        method
                                                    }
                                                >
                                                    {formatLabel(
                                                        method
                                                    )}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* SERVICE */}

                                <div className="form-group">

                                    <label>
                                        Church Service
                                    </label>

                                    <select
                                        value={
                                            form.churchServiceId
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "churchServiceId",
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="">
                                            No Service
                                        </option>

                                        {services.map(
                                            service => (
                                                <option
                                                    key={
                                                        service.churchServiceId
                                                    }
                                                    value={
                                                        service.churchServiceId
                                                    }
                                                >
                                                    {
                                                        service.serviceName
                                                    }
                                                    {" — "}
                                                    {dateOnly(
                                                        service.serviceDate
                                                    )}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* REFERENCE */}

                                <div className="form-group full-width">

                                    <label>
                                        Reference Number
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="OR number, GCash reference, check number..."
                                        value={
                                            form.referenceNumber
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "referenceNumber",
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                {/* NOTES */}

                                <div className="form-group full-width">

                                    <label>
                                        Notes
                                    </label>

                                    <textarea
                                        rows={4}
                                        placeholder="Additional notes..."
                                        value={
                                            form.notes
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "notes",
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="modal-footer">

                            <button
                                className="btn btn-secondary"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={saveGiving}
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId !== null
                                        ? "Update Giving"
                                        : "Save Giving"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}
import React from "react";
import "./MembershipDirectoryPrint.css";

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

interface MembershipDirectoryPrintProps {
    members: Member[];
    generatedAt: string;
}

/* =========================================================
   HELPERS
========================================================= */

const normalizeStatus = (
    status?: string
): string => {

    return status?.trim().toUpperCase() === "INACTIVE"
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
        .filter(Boolean)
        .join(" ")
        .trim()
        || member.memberCode
        || "Unnamed Member";
};

const formatDate = (
    value?: string
): string => {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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

const getInitials = (
    name: string
): string => {

    const parts = name
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

/* =========================================================
   COMPONENT
========================================================= */

const MembershipDirectoryPrint:
    React.FC<MembershipDirectoryPrintProps> = ({
        members,
        generatedAt
    }) => {

        const total = members.length;

        const active = members.filter(
            member =>
                normalizeStatus(member.status) === "ACTIVE"
        ).length;

        const inactive = members.filter(
            member =>
                normalizeStatus(member.status) === "INACTIVE"
        ).length;

        const male = members.filter(
            member =>
                member.gender
                    ?.trim()
                    .toUpperCase() === "MALE"
        ).length;

        const female = members.filter(
            member =>
                member.gender
                    ?.trim()
                    .toUpperCase() === "FEMALE"
        ).length;

        const ministries = new Set(
            members
                .map(member =>
                    member.ministry?.trim()
                )
                .filter(Boolean)
        ).size;

        const today = new Date().toLocaleDateString(
            "en-US",
            {
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );

        return (

            <div className="membership-print-document">

                {/* =================================================
                    TOP ACCENT
                ================================================= */}

                <div className="print-top-accent" />

                {/* =================================================
                    BRAND HEADER
                ================================================= */}

                <header className="print-header">

                    <div className="print-brand">

                        <div className="print-brand-mark">
                            EPIC
                        </div>

                        <div>

                            <div className="print-brand-name">
                                EPIC CHURCH
                            </div>

                            <div className="print-brand-system">
                                CHURCH MANAGEMENT SYSTEM
                            </div>

                        </div>

                    </div>

                    <div className="print-header-right">

                        <div className="print-document-type">
                            OFFICIAL REPORT
                        </div>

                        <div className="print-document-code">
                            CMS / MEMBERS / 001
                        </div>

                    </div>

                </header>

                {/* =================================================
                    REPORT TITLE
                ================================================= */}

                <section className="print-title-section">

                    <div className="print-title-overline">
                        MEMBERSHIP & COMMUNITY RECORDS
                    </div>

                    <h1>
                        Membership Directory
                    </h1>

                    <p>
                        Official listing of registered church members
                        maintained through the EPIC Church Management System.
                    </p>

                    <div className="print-title-meta">

                        <div>
                            <span>REPORT PERIOD</span>
                            <strong>Current Membership</strong>
                        </div>

                        <div>
                            <span>GENERATED</span>
                            <strong>{generatedAt}</strong>
                        </div>

                        <div>
                            <span>RECORDS</span>
                            <strong>{total}</strong>
                        </div>

                    </div>

                </section>

                {/* =================================================
                    SUMMARY
                ================================================= */}

                <section className="print-summary">

                    <div className="print-summary-card primary">

                        <span className="summary-label">
                            TOTAL MEMBERS
                        </span>

                        <strong>
                            {total}
                        </strong>

                        <small>
                            Registered records
                        </small>

                    </div>

                    <div className="print-summary-card">

                        <span className="summary-label">
                            ACTIVE
                        </span>

                        <strong>
                            {active}
                        </strong>

                        <small>
                            Active membership
                        </small>

                    </div>

                    <div className="print-summary-card">

                        <span className="summary-label">
                            INACTIVE
                        </span>

                        <strong>
                            {inactive}
                        </strong>

                        <small>
                            Inactive membership
                        </small>

                    </div>

                    <div className="print-summary-card">

                        <span className="summary-label">
                            FEMALE
                        </span>

                        <strong>
                            {female}
                        </strong>

                        <small>
                            Female members
                        </small>

                    </div>

                    <div className="print-summary-card">

                        <span className="summary-label">
                            MALE
                        </span>

                        <strong>
                            {male}
                        </strong>

                        <small>
                            Male members
                        </small>

                    </div>

                    <div className="print-summary-card">

                        <span className="summary-label">
                            MINISTRIES
                        </span>

                        <strong>
                            {ministries}
                        </strong>

                        <small>
                            Represented groups
                        </small>

                    </div>

                </section>

                {/* =================================================
                    DIRECTORY SECTION
                ================================================= */}

                <section className="print-directory-section">

                    <div className="print-section-heading">

                        <div>

                            <span>
                                MEMBER RECORDS
                            </span>

                            <h2>
                                Church Membership Listing
                            </h2>

                        </div>

                        <div className="print-section-count">
                            {total} RECORDS
                        </div>

                    </div>

                    <div className="print-section-line" />

                    {/* =================================================
                        TABLE
                    ================================================= */}

                    <table className="print-members-table">

                        <thead>

                            <tr>

                                <th className="col-no">
                                    #
                                </th>

                                <th className="col-member">
                                    MEMBER
                                </th>

                                <th className="col-code">
                                    MEMBER CODE
                                </th>

                                <th className="col-gender">
                                    GENDER
                                </th>

                                <th className="col-contact">
                                    CONTACT
                                </th>

                                <th className="col-ministry">
                                    MINISTRY
                                </th>

                                <th className="col-status">
                                    STATUS
                                </th>

                                <th className="col-date">
                                    DATE JOINED
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {members.map(
                                (member, index) => {

                                    const name =
                                        getFullName(member);

                                    const status =
                                        normalizeStatus(
                                            member.status
                                        );

                                    return (

                                        <tr
                                            key={
                                                member.memberId
                                            }
                                        >

                                            <td className="member-number">
                                                {String(
                                                    index + 1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </td>

                                            <td>

                                                <div className="print-member">

                                                    <div className="print-avatar">
                                                        {getInitials(name)}
                                                    </div>

                                                    <div className="print-member-info">

                                                        <strong>
                                                            {name}
                                                        </strong>

                                                        <span>
                                                            {member.email ||
                                                                "No email registered"}
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>

                                                <span className="print-member-code">

                                                    {member.memberCode ||
                                                        `MEM-${String(
                                                            member.memberId
                                                        ).padStart(
                                                            4,
                                                            "0"
                                                        )}`}

                                                </span>

                                            </td>

                                            <td>
                                                {member.gender || "—"}
                                            </td>

                                            <td>
                                                {member.contactNumber || "—"}
                                            </td>

                                            <td>

                                                <span className="print-ministry">

                                                    {member.ministry ||
                                                        "General"}

                                                </span>

                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        status === "ACTIVE"
                                                            ? "print-status active"
                                                            : "print-status inactive"
                                                    }
                                                >

                                                    <i />

                                                    {status}

                                                </span>

                                            </td>

                                            <td>
                                                {formatDate(
                                                    member.dateJoined
                                                )}
                                            </td>

                                        </tr>

                                    );
                                }
                            )}

                        </tbody>

                    </table>

                </section>

                {/* =================================================
                    CERTIFICATION
                ================================================= */}

                <section className="print-certification">

                    <div className="certification-icon">
                        ✓
                    </div>

                    <div>

                        <span>
                            REPORT CERTIFICATION
                        </span>

                        <p>
                            This report contains membership information
                            generated from the EPIC Church Management System.
                            The information presented is based on the member
                            records available at the time this report was
                            generated.
                        </p>

                    </div>

                </section>

                {/* =================================================
                    SIGNATURE AREA
                ================================================= */}

                <section className="print-signatures">

                    <div className="signature-block">

                        <div className="signature-line" />

                        <strong>
                            Prepared By
                        </strong>

                        <span>
                            EPIC Church Management System
                        </span>

                    </div>

                    <div className="signature-block">

                        <div className="signature-line" />

                        <strong>
                            Verified By
                        </strong>

                        <span>
                            Church Administrator
                        </span>

                    </div>

                    <div className="signature-block">

                        <div className="signature-line" />

                        <strong>
                            Approved By
                        </strong>

                        <span>
                            Senior Pastor / Authorized Officer
                        </span>

                    </div>

                </section>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="print-footer">

                    <div>

                        <strong>
                            EPIC CHURCH
                        </strong>

                        <span>
                            Engaging People Into Christ
                        </span>

                    </div>

                    <div className="print-footer-center">
                        CONFIDENTIAL • CHURCH ADMINISTRATION
                    </div>

                    <div className="print-footer-right">

                        <span>
                            Generated
                        </span>

                        <strong>
                            {today}
                        </strong>

                    </div>

                </footer>

                <div className="print-footer-bar" />

            </div>
        );
    };

export default MembershipDirectoryPrint;
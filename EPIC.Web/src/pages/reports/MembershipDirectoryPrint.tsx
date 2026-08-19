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
}

interface MembershipDirectoryPrintProps {
    members: Member[];
    generatedAt?: string;
}

/* =========================================================
   COMPONENT
========================================================= */

const MembershipDirectoryPrint: React.FC<
    MembershipDirectoryPrintProps
> = ({
    members,
    generatedAt
}) => {

    /* =====================================================
       STATISTICS
    ===================================================== */

    const totalMembers = members.length;

    const activeMembers =
        members.filter(
            member =>
                normalizeStatus(member.status) === "ACTIVE"
        ).length;

    const inactiveMembers =
        members.filter(
            member =>
                normalizeStatus(member.status) === "INACTIVE"
        ).length;

    const maleMembers =
        members.filter(
            member =>
                member.gender
                    ?.trim()
                    .toUpperCase() === "MALE"
        ).length;

    const femaleMembers =
        members.filter(
            member =>
                member.gender
                    ?.trim()
                    .toUpperCase() === "FEMALE"
        ).length;

    const ministries =
        new Set(
            members
                .map(
                    member =>
                        member.ministry?.trim()
                )
                .filter(Boolean)
        ).size;

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="membership-print-document">

            {/* =================================================
                DOCUMENT HEADER
            ================================================= */}

            <header className="membership-print-header">

                <div className="membership-print-brand">

                    <div className="membership-print-logo">
                        EPIC
                    </div>

                    <div className="membership-print-brand-text">

                        <span className="membership-print-eyebrow">
                            EPIC CHURCH MANAGEMENT SYSTEM
                        </span>

                        <h1>
                            MEMBERSHIP DIRECTORY
                        </h1>

                        <p>
                            Official Church Member Listing
                        </p>

                    </div>

                </div>

                <div className="membership-print-meta">

                    <span>
                        REPORT GENERATED
                    </span>

                    <strong>
                        {generatedAt ||
                            formatGeneratedDate()}
                    </strong>

                </div>

            </header>


            {/* =================================================
                HEADER ACCENT
            ================================================= */}

            <div className="membership-print-accent-line" />


            {/* =================================================
                REPORT TITLE
            ================================================= */}

            <section className="membership-print-title">

                <div>

                    <span>
                        OFFICIAL MEMBERSHIP REPORT
                    </span>

                    <h2>
                        Church Member Directory
                    </h2>

                    <p>
                        Complete listing of registered church
                        members maintained through the EPIC
                        Church Management System.
                    </p>

                </div>

                <div className="membership-print-report-badge">

                    <span>
                        REPORT TYPE
                    </span>

                    <strong>
                        MEMBERSHIP
                    </strong>

                </div>

            </section>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="membership-print-summary">

                <div className="print-stat total">

                    <span>
                        TOTAL MEMBERS
                    </span>

                    <strong>
                        {totalMembers}
                    </strong>

                </div>

                <div className="print-stat active">

                    <span>
                        ACTIVE
                    </span>

                    <strong>
                        {activeMembers}
                    </strong>

                </div>

                <div className="print-stat inactive">

                    <span>
                        INACTIVE
                    </span>

                    <strong>
                        {inactiveMembers}
                    </strong>

                </div>

                <div className="print-stat female">

                    <span>
                        FEMALE
                    </span>

                    <strong>
                        {femaleMembers}
                    </strong>

                </div>

                <div className="print-stat male">

                    <span>
                        MALE
                    </span>

                    <strong>
                        {maleMembers}
                    </strong>

                </div>

                <div className="print-stat ministry">

                    <span>
                        MINISTRIES
                    </span>

                    <strong>
                        {ministries}
                    </strong>

                </div>

            </section>


            {/* =================================================
                TABLE SECTION
            ================================================= */}

            <section className="membership-print-table-section">

                <div className="membership-print-section-header">

                    <div>

                        <span>
                            MEMBER RECORDS
                        </span>

                        <h3>
                            Complete Membership Directory
                        </h3>

                    </div>

                    <div className="membership-print-record-count">

                        {totalMembers}{" "}
                        {totalMembers === 1
                            ? "REGISTERED MEMBER"
                            : "REGISTERED MEMBERS"}

                    </div>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                <table className="membership-print-table">

                    <thead>

                        <tr>

                            <th className="col-number">
                                #
                            </th>

                            <th className="col-member">
                                MEMBER
                            </th>

                            <th className="col-code">
                                CODE
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
                            (
                                member,
                                index
                            ) => {

                                const status =
                                    normalizeStatus(
                                        member.status
                                    );

                                const memberName =
                                    getFullName(
                                        member
                                    );

                                return (

                                    <tr
                                        key={
                                            member.memberId
                                        }
                                    >

                                        {/* NUMBER */}

                                        <td className="member-number">

                                            {String(
                                                index + 1
                                            ).padStart(
                                                2,
                                                "0"
                                            )}

                                        </td>


                                        {/* MEMBER */}

                                        <td>

                                            <div className="print-member">

                                                <div className="print-member-avatar">

                                                    {getInitials(
                                                        memberName
                                                    )}

                                                </div>

                                                <div className="print-member-info">

                                                    <strong>
                                                        {memberName}
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


                                        {/* CODE */}

                                        <td>

                                            <span className="print-code">

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


                                        {/* GENDER */}

                                        <td>

                                            <span className="print-gender">

                                                {
                                                    member.gender ||
                                                    "—"
                                                }

                                            </span>

                                        </td>


                                        {/* CONTACT */}

                                        <td className="print-contact">

                                            {
                                                member.contactNumber ||
                                                "—"
                                            }

                                        </td>


                                        {/* MINISTRY */}

                                        <td>

                                            <span className="print-ministry">

                                                {
                                                    member.ministry ||
                                                    "General"
                                                }

                                            </span>

                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <span
                                                className={
                                                    `print-status ${status.toLowerCase()}`
                                                }
                                            >

                                                <i>
                                                    ●
                                                </i>

                                                {status}

                                            </span>

                                        </td>


                                        {/* DATE */}

                                        <td className="print-date">

                                            {
                                                formatDate(
                                                    member.dateJoined
                                                )
                                            }

                                        </td>

                                    </tr>

                                );

                            }
                        )}

                    </tbody>

                </table>

            </section>


            {/* =================================================
                VERIFICATION
            ================================================= */}

            <section className="membership-print-verification">

                <div>

                    <span>
                        RECORD STATUS
                    </span>

                    <strong>
                        OFFICIAL
                    </strong>

                </div>

                <div>

                    <span>
                        TOTAL RECORDS
                    </span>

                    <strong>
                        {totalMembers}
                    </strong>

                </div>

                <div>

                    <span>
                        ACTIVE RECORDS
                    </span>

                    <strong>
                        {activeMembers}
                    </strong>

                </div>

                <div>

                    <span>
                        REPORT DATE
                    </span>

                    <strong>
                        {formatShortDate()}
                    </strong>

                </div>

            </section>


            {/* =================================================
                SIGNATURES
            ================================================= */}

            <section className="membership-print-signatures">

                <div className="signature-block">

                    <div className="signature-line" />

                    <strong>
                        CHURCH ADMINISTRATOR
                    </strong>

                    <span>
                        Authorized Representative
                    </span>

                </div>

                <div className="signature-block">

                    <div className="signature-line" />

                    <strong>
                        SENIOR PASTOR
                    </strong>

                    <span>
                        Church Leadership
                    </span>

                </div>

                <div className="signature-block">

                    <div className="signature-line" />

                    <strong>
                        DATE VERIFIED
                    </strong>

                    <span>
                        Official Record Verification
                    </span>

                </div>

            </section>


            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="membership-print-footer">

                <div>

                    <strong>
                        EPIC
                    </strong>

                    <span>
                        Engaging People Into Christ
                    </span>

                </div>

                <div>

                    <span>
                        Confidential Church Record
                    </span>

                    <strong>
                        MEMBERSHIP DIRECTORY
                    </strong>

                </div>

            </footer>

        </div>
    );
};


/* =========================================================
   HELPERS
========================================================= */

const getFullName = (
    member: Member
): string => {

    const parts = [
        member.firstName,
        member.middleName,
        member.lastName,
        member.suffix
    ]
        .filter(
            value =>
                Boolean(
                    value &&
                    value.trim()
                )
        )
        .map(
            value =>
                value!.trim()
        );

    return (
        parts.join(" ") ||
        member.memberCode ||
        "Unnamed Member"
    );
};


/* =========================================================
   INITIALS
========================================================= */

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


/* =========================================================
   STATUS
========================================================= */

const normalizeStatus = (
    status?: string
): string => {

    return (
        status
            ?.trim()
            .toUpperCase() === "INACTIVE"
    )
        ? "INACTIVE"
        : "ACTIVE";
};


/* =========================================================
   DATE
========================================================= */

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
   GENERATED DATE
========================================================= */

const formatGeneratedDate = (): string => {

    return new Date().toLocaleString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
};


/* =========================================================
   SHORT DATE
========================================================= */

const formatShortDate = (): string => {

    return new Date().toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
};


export default MembershipDirectoryPrint;
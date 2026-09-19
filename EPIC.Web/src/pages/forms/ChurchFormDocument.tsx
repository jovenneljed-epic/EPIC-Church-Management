import React, { useState } from "react";
import "./ChurchFormDocument.css";

export interface FormDefinition {
    id: string;
    title: string;
    description: string;
    icon: string;
}

export interface ChurchFormDocumentProps {
    form: FormDefinition;
    onBack: () => void;
}

// -------------------------------------------------------------
// HELPER: FIELD COMPONENT (SCREEN WIDGET + PRINT-READY UNDERLINE)
// -------------------------------------------------------------
interface PrintFieldProps {
    label: string;
    name: string;
    value?: string;
    placeholder?: string;
    type?: string;
    options?: { value: string; label: string }[];
    rows?: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const PrintField: React.FC<PrintFieldProps> = ({
    label,
    name,
    value,
    placeholder,
    type = "text",
    options,
    rows,
    onChange,
}) => {
    return (
        <div className="epic-form-field">
            <label>{label}</label>

            {/* SCREEN WIDGET */}
            <div className="screen-only">
                {options ? (
                    <select className="epic-form-select" name={name} value={value || ""} onChange={onChange}>
                        <option value="">{placeholder || "Select..."}</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : rows ? (
                    <textarea
                        className="epic-form-textarea"
                        name={name}
                        value={value || ""}
                        onChange={onChange}
                        rows={rows}
                        placeholder={placeholder}
                    />
                ) : (
                    <input
                        className="epic-form-input"
                        type={type}
                        name={name}
                        value={value || ""}
                        onChange={onChange}
                        placeholder={placeholder}
                    />
                )}
            </div>

            {/* PRINT WIDGET: PURE ELEGANT TYPOGRAPHY ON CRISP RULED LINE */}
            <div className="epic-print-value print-only">
                {value && value.trim() ? (
                    <span className="epic-print-text">{value}</span>
                ) : (
                    <span className="epic-print-blank" />
                )}
            </div>
        </div>
    );
};

// -------------------------------------------------------------
// HELPER: CHECKBOX COMPONENT (SCREEN INPUT + CRISP PRINT BOX)
// -------------------------------------------------------------
interface PrintCheckboxProps {
    label: string;
    checked: boolean;
    onChange: () => void;
}

const PrintCheckbox: React.FC<PrintCheckboxProps> = ({
    label,
    checked,
    onChange,
}) => {
    return (
        <label className="epic-form-checkbox-label">
            <span className="screen-only">
                <input type="checkbox" checked={checked} onChange={onChange} />
            </span>
            <span className="epic-print-box print-only">
                {checked ? "☒" : "☐"}
            </span>
            <span>{label}</span>
        </label>
    );
};

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
export const ChurchFormDocument: React.FC<ChurchFormDocumentProps> = ({
    form,
    onBack,
}) => {
    const today = new Date().toISOString().split("T")[0];

    const [fields, setFields] = useState<Record<string, string>>({
        date: today,
    });

    const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({});

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFields((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name: string) => {
        setCheckboxes((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleClear = () => {
        setFields({ date: today });
        setCheckboxes({});
    };

    const handleFillSample = () => {
        if (form.id === "membership-registration") {
            setFields({
                date: today,
                memberCode: "MEM-2026-0182",
                fullName: "Juan Dela Cruz",
                nickname: "Juan",
                dob: "1994-08-15",
                gender: "Male",
                civilStatus: "Married",
                nationality: "Filipino",
                occupation: "Teacher",
                contactNo: "0917-123-4567",
                email: "juan.delacruz@example.com",
                address: "Barangay San Vicente, Umingan, Pangasinan",
                dateAcceptedChrist: "2018-04-12",
                baptizedDate: "2018-06-20",
                previousChurch: "None",
                reasonForJoining: "Spiritual growth and active ministry service in San Vicente",
                referredBy: "Bro. Manuel Santos",
                spouseName: "Maria Dela Cruz",
                childrenCount: "2",
                applicantSignature: "Juan Dela Cruz",
                pastorSignature: "Pastor Danilo Reyes",
            });
            setCheckboxes({
                interestWorship: true,
                interestUsher: false,
                interestTech: true,
                interestKids: false,
                interestYouth: false,
                interestPrayer: true,
                interestOutreach: true,
            });
        } else if (form.id === "membership-information") {
            setFields({
                date: today,
                memberCode: "MEM-2026-0094",
                fullName: "Grace Perez Santos",
                nickname: "Grace",
                dob: "1998-03-22",
                gender: "Female",
                civilStatus: "Single",
                bloodType: "O+",
                contactNo: "0928-555-8901",
                email: "grace.santos@example.com",
                address: "Purok 4, San Vicente, Umingan, Pangasinan",
                emergencyContact: "Elena Santos (Mother)",
                emergencyPhone: "0920-111-2233",
                education: "Bachelor of Science in Accountancy",
                occupation: "Accountant",
                company: "Umingan Commercial Corp.",
                cellGroupLeader: "Sis. Teresa Ramos",
                ministry: "Worship Ministry - Vocalist",
                spiritualGifts: "Exhortation, Music, Administration",
                memberSignature: "Grace P. Santos",
                officerSignature: "Secretary Maria Clara",
            });
            setCheckboxes({ statusActive: true });
        } else if (form.id === "family-information") {
            setFields({
                date: today,
                familyCode: "FAM-2026-042",
                headName: "Roberto Gomez",
                headContact: "0919-876-5432",
                address: "Barangay San Vicente, Umingan, Pangasinan",
                spouseName: "Anita Gomez",
                spouseContact: "0919-876-5433",
                weddingDate: "2010-12-18",
                child1Name: "Joshua Gomez", child1Dob: "2012-05-10", child1Baptized: "Yes", child1School: "Umingan NHS",
                child2Name: "Sarah Gomez", child2Dob: "2015-09-24", child2Baptized: "Yes", child2School: "San Vicente Central",
                child3Name: "Elijah Gomez", child3Dob: "2020-02-14", child3Baptized: "No", child3School: "Preparatory",
                prayerRequests: "Good health for parents, financial provision for children's studies",
                headSignature: "Roberto Gomez",
                pastorSignature: "Pastor Danilo Reyes",
            });
            setCheckboxes({ regularDevotion: true, ministryTogether: true });
        } else if (form.id === "visitor-card") {
            setFields({
                date: today,
                serviceAttended: "Sunday Morning Service (9:00 AM)",
                fullName: "Mark Anthony Villanueva",
                ageGroup: "Young Adult (21-35)",
                contactNo: "0935-789-0123",
                email: "mark.villanueva@example.com",
                address: "Barangay San Vicente, Umingan, Pangasinan",
                howDidYouHear: "Invited by friend / family",
                invitedBy: "Bro. Juan Dela Cruz",
                prayerRequest: "Direction for newly opened job opportunity and peace of mind.",
                assignedTo: "Follow-up Team Lead",
            });
            setCheckboxes({
                firstTime: true,
                decisionJesus: true,
                interestWaterBaptism: true,
                interestLifeGroup: true,
                requestCall: true,
            });
        } else if (form.id === "ministry-volunteer") {
            setFields({
                date: today,
                fullName: "Daniel Cruz",
                memberCode: "MEM-2026-0155",
                contactNo: "0918-444-3210",
                email: "daniel.cruz@example.com",
                lifeGroupLeader: "Bro. Manuel Santos",
                desiredMinistry: "Technical & Multimedia Ministry",
                specificSkills: "Sound mixing (digital consoles), OBS Studio live streaming, Video editing",
                experienceYears: "3 years experience handling audio in campus ministry",
                scheduleAvailability: "Sunday Mornings & Saturday Rehearsals",
                volunteerSignature: "Daniel Cruz",
                ministryHeadSignature: "Head Engr. Carlos D.",
                pastorSignature: "Pastor Danilo Reyes",
            });
            setCheckboxes({
                agreePledge: true,
                agreePunctual: true,
            });
        } else if (form.id === "ministry-assignment") {
            setFields({
                date: today,
                docNo: "APPT-2026-014",
                appointeeName: "Bro. Manuel Santos",
                memberCode: "MEM-2025-0042",
                department: "Ushers & Greeters Protocol Ministry",
                assignedRole: "Ministry Assistant Head & Protocol Officer",
                termStart: today,
                termEnd: "2027-12-31",
                responsibilities: "1. Coordinate usher schedules for Sunday services\n2. Oversee offering collection integrity\n3. Ensure warm reception for all guests and seniors",
                supervisor: "Elder Renato Rivera",
                appointeeSignature: "Manuel Santos",
                pastorSignature: "Pastor Danilo Reyes",
            });
        } else if (form.id === "baptism") {
            setFields({
                date: today,
                candidateName: "Christine Joy Mendoza",
                dob: "2006-11-04",
                age: "20",
                gender: "Female",
                contactNo: "0946-123-9876",
                address: "Purok 2, San Vicente, Umingan, Pangasinan",
                dateAcceptedChrist: "2024-05-15",
                mentorName: "Sis. Teresa Ramos",
                classDateCompleted: "2026-09-12",
                instructor: "Elder Renato Rivera",
                baptismDate: "2026-10-04",
                venue: "Luke 4:18 Sanctuary Baptistry",
                officiatingPastor: "Pastor Danilo Reyes",
                certNo: "BPT-2026-019",
                candidateSignature: "Christine Joy Mendoza",
                pastorSignature: "Pastor Danilo Reyes",
            });
            setCheckboxes({ parentConsent: true, classCompleted: true });
        } else if (form.id === "child-dedication") {
            setFields({
                date: today,
                childName: "Nathaniel James Dela Cruz",
                nickname: "Nate",
                dob: "2026-04-18",
                pob: "Umingan Medicare Community Hospital",
                gender: "Male",
                fatherName: "Juan Dela Cruz",
                fatherContact: "0917-123-4567",
                motherName: "Maria Clara Dela Cruz",
                motherContact: "0917-987-6543",
                weddingDate: "2022-01-15",
                address: "San Vicente, Umingan, Pangasinan",
                dedicationDate: "2026-10-18",
                serviceSlot: "Sunday 9:00 AM Worship Service",
                officiatingPastor: "Pastor Danilo Reyes",
                sponsor1: "Bro. Manuel Santos (Luke 4:18 Ministries)",
                sponsor2: "Sis. Teresa Ramos (Luke 4:18 Ministries)",
                sponsor3: "Engr. Carlos Diaz (Christian Fellowship Church)",
                sponsor4: "Elena Gomez (Luke 4:18 Ministries)",
                fatherSignature: "Juan Dela Cruz",
                motherSignature: "Maria Clara Dela Cruz",
                pastorSignature: "Pastor Danilo Reyes",
            });
        } else if (form.id === "marriage") {
            setFields({
                date: today,
                groomName: "David Joseph Morales",
                groomDob: "1997-06-14",
                groomAge: "29",
                groomContact: "0915-222-3344",
                groomAddress: "Umingan, Pangasinan",
                groomParents: "Joseph & Rebecca Morales",
                groomReligion: "Evangelical Christian (Luke 4:18)",
                brideName: "Sarah Jane Perez",
                brideDob: "1999-09-20",
                brideAge: "27",
                brideContact: "0916-333-4455",
                brideAddress: "San Vicente, Umingan, Pangasinan",
                brideParents: "Manuel & Elena Perez",
                brideReligion: "Evangelical Christian (Luke 4:18)",
                counselorPastor: "Pastor Danilo Reyes",
                counselingDates: "Sessions completed: Aug 8, Aug 15, Aug 22, Aug 29, 2026",
                weddingDate: "2026-12-12",
                weddingTime: "3:00 PM",
                venue: "Luke 4:18 Ministries Sanctuary",
                officiatingMinister: "Pastor Danilo Reyes (Lic. #98721)",
                marriageLicenseNo: "ML-2026-9041 issued at Umingan, Pangasinan",
                groomSignature: "David J. Morales",
                brideSignature: "Sarah Jane Perez",
                pastorSignature: "Pastor Danilo Reyes",
            });
            setCheckboxes({ groomBaptized: true, brideBaptized: true, counselingPassed: true });
        }
    };

    return (
        <div className="epic-form-container">
            {/* Top Toolbar (Hidden on Print) */}
            <div className="epic-form-toolbar no-print">
                <div className="epic-form-toolbar-left">
                    <button type="button" className="epic-form-back-btn" onClick={onBack}>
                        ← Back to Forms & Documents
                    </button>
                    <div className="epic-form-title-badge">
                        <h3>{form.title}</h3>
                        <span>Official Printable Church Document</span>
                    </div>
                </div>

                <div className="epic-form-toolbar-right">
                    <button
                        type="button"
                        className="epic-form-btn epic-form-btn-secondary"
                        onClick={handleFillSample}
                        title="Populate realistic sample data to preview"
                    >
                        ✍️ Fill Sample Data
                    </button>
                    <button
                        type="button"
                        className="epic-form-btn epic-form-btn-secondary"
                        onClick={handleClear}
                        title="Clear all fields to print a blank form"
                    >
                        🧹 Clear / Blank
                    </button>
                    <button
                        type="button"
                        className="epic-form-btn epic-form-btn-primary"
                        onClick={handlePrint}
                    >
                        🖨️ Print Form / Save as PDF
                    </button>
                </div>
            </div>

            {/* Printable Paper Sheet */}
            <article id="epic-printable-sheet" className="epic-printable-sheet">
                {/* Official Church Letterhead */}
                <header className="epic-form-header">
                    <div className="epic-form-letterhead">
                        <div className="epic-form-brand-seal">
                            EPIC
                            <small>CHURCH</small>
                        </div>
                        <div className="epic-form-letterhead-info">
                            <h1>Luke 4:18 Ministries</h1>
                            <h2>San Vicente Church • Umingan, Pangasinan</h2>
                            <p>Official Ministry Document & Records • "The Spirit of the Lord is upon me..." (Luke 4:18)</p>
                        </div>
                    </div>

                    <div className="epic-form-meta-box">
                        <span className="epic-form-code">
                            {form.id === "membership-registration" && "EPIC-FRM-01"}
                            {form.id === "membership-information" && "EPIC-FRM-02"}
                            {form.id === "family-information" && "EPIC-FRM-03"}
                            {form.id === "visitor-card" && "EPIC-FRM-04"}
                            {form.id === "ministry-volunteer" && "EPIC-FRM-05"}
                            {form.id === "ministry-assignment" && "EPIC-FRM-06"}
                            {form.id === "baptism" && "EPIC-FRM-07"}
                            {form.id === "child-dedication" && "EPIC-FRM-08"}
                            {form.id === "marriage" && "EPIC-FRM-09"}
                        </span>
                        <span className="epic-form-meta-date">Date: {fields.date || today}</span>
                    </div>
                </header>

                {/* Form Title Banner */}
                <div className="epic-form-title-bar">
                    <h2>{form.title.toUpperCase()}</h2>
                    <p>{form.description}</p>
                </div>

                {/* =========================================================
                    FORM 1: NEW MEMBER REGISTRATION
                ========================================================= */}
                {form.id === "membership-registration" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">1. Personal Information</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Member Code / ID" name="memberCode" value={fields.memberCode} placeholder="MEM-YYYY-XXXX" onChange={handleInputChange} />
                                <PrintField label="Full Legal Name" name="fullName" value={fields.fullName} placeholder="Last Name, First Name, Middle Name" onChange={handleInputChange} />
                                <PrintField label="Nickname" name="nickname" value={fields.nickname} onChange={handleInputChange} />
                            </div>

                            <div className="epic-form-grid epic-form-grid-4">
                                <PrintField label="Date of Birth" type="date" name="dob" value={fields.dob} onChange={handleInputChange} />
                                <PrintField label="Gender" name="gender" value={fields.gender} options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]} onChange={handleInputChange} />
                                <PrintField label="Civil Status" name="civilStatus" value={fields.civilStatus} options={[{ value: "Single", label: "Single" }, { value: "Married", label: "Married" }, { value: "Widowed", label: "Widowed" }, { value: "Separated", label: "Separated" }]} onChange={handleInputChange} />
                                <PrintField label="Occupation" name="occupation" value={fields.occupation} onChange={handleInputChange} />
                            </div>

                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Contact Number" name="contactNo" value={fields.contactNo} placeholder="09XX-XXX-XXXX" onChange={handleInputChange} />
                                <PrintField label="Email Address" type="email" name="email" value={fields.email} placeholder="example@domain.com" onChange={handleInputChange} />
                            </div>

                            <PrintField label="Complete Home Address" name="address" value={fields.address} placeholder="Barangay, Municipality, Province" onChange={handleInputChange} />
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Spiritual Journey & Church Background</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Date Accepted Christ" type="date" name="dateAcceptedChrist" value={fields.dateAcceptedChrist} onChange={handleInputChange} />
                                <PrintField label="Date Water Baptized" type="date" name="baptizedDate" value={fields.baptizedDate} onChange={handleInputChange} />
                                <PrintField label="Referred / Invited By" name="referredBy" value={fields.referredBy} onChange={handleInputChange} />
                            </div>
                            <PrintField label="Previous Church Affiliation (if transferring)" name="previousChurch" value={fields.previousChurch} onChange={handleInputChange} />
                            <PrintField label="Reason for Joining Luke 4:18 Ministries" name="reasonForJoining" value={fields.reasonForJoining} rows={2} onChange={handleInputChange} />
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Ministry Interests & Involvement</div>
                            <div className="epic-form-checkbox-group">
                                <PrintCheckbox label="Praise & Worship / Music" checked={!!checkboxes.interestWorship} onChange={() => handleCheckboxChange("interestWorship")} />
                                <PrintCheckbox label="Technical & Multimedia" checked={!!checkboxes.interestTech} onChange={() => handleCheckboxChange("interestTech")} />
                                <PrintCheckbox label="Ushering & Protocol" checked={!!checkboxes.interestUsher} onChange={() => handleCheckboxChange("interestUsher")} />
                                <PrintCheckbox label="Children's Church" checked={!!checkboxes.interestKids} onChange={() => handleCheckboxChange("interestKids")} />
                                <PrintCheckbox label="Youth Ministry" checked={!!checkboxes.interestYouth} onChange={() => handleCheckboxChange("interestYouth")} />
                                <PrintCheckbox label="Intercessory Prayer" checked={!!checkboxes.interestPrayer} onChange={() => handleCheckboxChange("interestPrayer")} />
                                <PrintCheckbox label="Community Outreach" checked={!!checkboxes.interestOutreach} onChange={() => handleCheckboxChange("interestOutreach")} />
                            </div>
                        </section>

                        <div className="epic-form-declaration-box">
                            <strong>MEMBERSHIP COVENANT:</strong> Having received Jesus Christ as my personal Savior, and being in agreement with the vision, mission, and beliefs of Luke 4:18 Ministries, I hereby apply for church membership. I commit to attend worship faithfully, give of my tithes and offerings, and live a lifestyle honoring Christ.
                        </div>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.applicantSignature || ""}</div>
                                <span className="epic-form-sig-label">Applicant Signature</span>
                                <span className="epic-form-sig-sub">Signature over Printed Name</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.pastorSignature || ""}</div>
                                <span className="epic-form-sig-label">Senior Pastor / Minister</span>
                                <span className="epic-form-sig-sub">San Vicente Church • Umingan</span>
                            </div>
                            <div className="epic-form-seal-box">
                                Official Church Seal
                            </div>
                        </div>
                    </>
                )}

                {/* =========================================================
                    FORM 2: MEMBERSHIP INFORMATION FORM
                ========================================================= */}
                {form.id === "membership-information" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">1. Member Identification & Status</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Member ID Code" name="memberCode" value={fields.memberCode} onChange={handleInputChange} />
                                <PrintField label="Membership Status" name="membershipStatus" value={fields.membershipStatus || "Active"} options={[{ value: "Active", label: "Active Member" }, { value: "Probationary", label: "Probationary" }, { value: "Inactive", label: "Inactive" }]} onChange={handleInputChange} />
                                <PrintField label="Blood Type" name="bloodType" value={fields.bloodType} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Personal Profile & Emergency Contact</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Full Name" name="fullName" value={fields.fullName} onChange={handleInputChange} />
                                <PrintField label="Date of Birth" type="date" name="dob" value={fields.dob} onChange={handleInputChange} />
                                <PrintField label="Civil Status & Gender" name="civilStatus" value={fields.civilStatus || "Single / Female"} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Contact Phone" name="contactNo" value={fields.contactNo} onChange={handleInputChange} />
                                <PrintField label="Email Address" type="email" name="email" value={fields.email} onChange={handleInputChange} />
                            </div>
                            <PrintField label="Residence Address" name="address" value={fields.address} onChange={handleInputChange} />
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Emergency Contact Person & Relation" name="emergencyContact" value={fields.emergencyContact} onChange={handleInputChange} />
                                <PrintField label="Emergency Phone" name="emergencyPhone" value={fields.emergencyPhone} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Vocation & Church Involvement</div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Educational Attainment" name="education" value={fields.education} onChange={handleInputChange} />
                                <PrintField label="Occupation / Workplace" name="occupation" value={fields.occupation} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Current Ministry Assigned" name="ministry" value={fields.ministry} onChange={handleInputChange} />
                                <PrintField label="Cell Group / Life Group Leader" name="cellGroupLeader" value={fields.cellGroupLeader} onChange={handleInputChange} />
                            </div>
                            <PrintField label="Spiritual Gifts & Ministry Skills" name="spiritualGifts" value={fields.spiritualGifts} onChange={handleInputChange} />
                        </section>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.memberSignature || ""}</div>
                                <span className="epic-form-sig-label">Member Signature</span>
                                <span className="epic-form-sig-sub">Certified Correct</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.officerSignature || ""}</div>
                                <span className="epic-form-sig-label">Church Records Officer</span>
                                <span className="epic-form-sig-sub">San Vicente Church • Umingan</span>
                            </div>
                            <div className="epic-form-seal-box">
                                Records Seal
                            </div>
                        </div>
                    </>
                )}

                {/* =========================================================
                    FORM 3: FAMILY INFORMATION FORM
                ========================================================= */}
                {form.id === "family-information" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">1. Household & Parents Information</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Head of Household" name="headName" value={fields.headName} onChange={handleInputChange} />
                                <PrintField label="Head Contact Number" name="headContact" value={fields.headContact} onChange={handleInputChange} />
                                <PrintField label="Family ID Code" name="familyCode" value={fields.familyCode} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Spouse Full Name" name="spouseName" value={fields.spouseName} onChange={handleInputChange} />
                                <PrintField label="Spouse Contact" name="spouseContact" value={fields.spouseContact} onChange={handleInputChange} />
                                <PrintField label="Church / Civil Wedding Date" type="date" name="weddingDate" value={fields.weddingDate} onChange={handleInputChange} />
                            </div>
                            <PrintField label="Family Residence Address" name="address" value={fields.address} onChange={handleInputChange} />
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Children & Dependents</div>
                            <table className="epic-form-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "35%" }}>Child Full Name</th>
                                        <th style={{ width: "20%" }}>Birth Date</th>
                                        <th style={{ width: "15%" }}>Water Baptized</th>
                                        <th style={{ width: "30%" }}>School / Grade / Work</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4].map((num) => {
                                        const nameKey = `child${num}Name`;
                                        const dobKey = `child${num}Dob`;
                                        const bapKey = `child${num}Baptized`;
                                        const schKey = `child${num}School`;
                                        return (
                                            <tr key={num}>
                                                <td>
                                                    <input className="screen-only" name={nameKey} value={fields[nameKey] || ""} onChange={handleInputChange} placeholder="Name" />
                                                    <span className="print-only">{fields[nameKey] || ""}</span>
                                                </td>
                                                <td>
                                                    <input className="screen-only" name={dobKey} value={fields[dobKey] || ""} onChange={handleInputChange} placeholder="YYYY-MM-DD" />
                                                    <span className="print-only">{fields[dobKey] || ""}</span>
                                                </td>
                                                <td>
                                                    <input className="screen-only" name={bapKey} value={fields[bapKey] || ""} onChange={handleInputChange} placeholder="Yes/No" />
                                                    <span className="print-only">{fields[bapKey] || ""}</span>
                                                </td>
                                                <td>
                                                    <input className="screen-only" name={schKey} value={fields[schKey] || ""} onChange={handleInputChange} placeholder="School/Occupation" />
                                                    <span className="print-only">{fields[schKey] || ""}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Family Prayer Requests</div>
                            <PrintField label="Specific Family Prayer Requests" name="prayerRequests" value={fields.prayerRequests} rows={2} onChange={handleInputChange} />
                        </section>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.headSignature || ""}</div>
                                <span className="epic-form-sig-label">Head of Household</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.pastorSignature || ""}</div>
                                <span className="epic-form-sig-label">Family Life Pastor</span>
                            </div>
                            <div className="epic-form-seal-box">Church Seal</div>
                        </div>
                    </>
                )}

                {/* =========================================================
                    FORM 4: VISITOR INFORMATION CARD
                ========================================================= */}
                {form.id === "visitor-card" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">Visitor Information & Welcome</div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Service Attended" name="serviceAttended" value={fields.serviceAttended} onChange={handleInputChange} />
                                <PrintField label="Full Name" name="fullName" value={fields.fullName} placeholder="Your name" onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Age Group" name="ageGroup" value={fields.ageGroup} options={[{ value: "Youth (13-20)", label: "Youth (13-20)" }, { value: "Young Adult (21-35)", label: "Young Adult (21-35)" }, { value: "Adult (36-59)", label: "Adult (36-59)" }, { value: "Senior (60+)", label: "Senior (60+)" }]} onChange={handleInputChange} />
                                <PrintField label="Contact Number" name="contactNo" value={fields.contactNo} onChange={handleInputChange} />
                                <PrintField label="Email Address" type="email" name="email" value={fields.email} onChange={handleInputChange} />
                            </div>
                            <PrintField label="Address / Residence" name="address" value={fields.address} onChange={handleInputChange} />
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="How did you hear about us?" name="howDidYouHear" value={fields.howDidYouHear} onChange={handleInputChange} />
                                <PrintField label="Invited by (Church Member)" name="invitedBy" value={fields.invitedBy} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">My Decision / Next Steps Today</div>
                            <div className="epic-form-checkbox-group">
                                <PrintCheckbox label="This is my 1st time visiting" checked={!!checkboxes.firstTime} onChange={() => handleCheckboxChange("firstTime")} />
                                <PrintCheckbox label="I received Jesus Christ today" checked={!!checkboxes.decisionJesus} onChange={() => handleCheckboxChange("decisionJesus")} />
                                <PrintCheckbox label="I want to be water baptized" checked={!!checkboxes.interestWaterBaptism} onChange={() => handleCheckboxChange("interestWaterBaptism")} />
                                <PrintCheckbox label="I want to join a Life Group" checked={!!checkboxes.interestLifeGroup} onChange={() => handleCheckboxChange("interestLifeGroup")} />
                                <PrintCheckbox label="I would like a pastoral call / visit" checked={!!checkboxes.requestCall} onChange={() => handleCheckboxChange("requestCall")} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">How can we pray for you?</div>
                            <PrintField label="Prayer Request / Comments" name="prayerRequest" value={fields.prayerRequest} rows={2} onChange={handleInputChange} />
                        </section>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.assignedTo || ""}</div>
                                <span className="epic-form-sig-label">Follow-Up Assigned Worker</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">Follow-Up Logged</div>
                                <span className="epic-form-sig-label">Visitor Ministry Status</span>
                            </div>
                            <div className="epic-form-seal-box">Welcome Team</div>
                        </div>
                    </>
                )}

                {/* =========================================================
                    FORM 5: MINISTRY VOLUNTEER FORM
                ========================================================= */}
                {form.id === "ministry-volunteer" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">1. Volunteer Details</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Full Name" name="fullName" value={fields.fullName} onChange={handleInputChange} />
                                <PrintField label="Member Code" name="memberCode" value={fields.memberCode} onChange={handleInputChange} />
                                <PrintField label="Contact Number" name="contactNo" value={fields.contactNo} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Life Group Leader" name="lifeGroupLeader" value={fields.lifeGroupLeader} onChange={handleInputChange} />
                                <PrintField label="Desired Ministry to Serve In" name="desiredMinistry" value={fields.desiredMinistry} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Talents & Skills</div>
                            <PrintField label="Specific Skills & Instruments Played" name="specificSkills" value={fields.specificSkills} rows={2} onChange={handleInputChange} />
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Previous Ministry Experience" name="experienceYears" value={fields.experienceYears} onChange={handleInputChange} />
                                <PrintField label="Weekly Schedule Availability" name="scheduleAvailability" value={fields.scheduleAvailability} onChange={handleInputChange} />
                            </div>
                        </section>

                        <div className="epic-form-declaration-box">
                            <strong>VOLUNTEER PLEDGE OF SERVICE:</strong> I joyfully offer my gifts and time to serve God at Luke 4:18 Ministries. I commit to remain punctual, faithful, cooperative with leadership, and live a life worthy of Christ.
                        </div>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.volunteerSignature || ""}</div>
                                <span className="epic-form-sig-label">Volunteer Signature</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.ministryHeadSignature || ""}</div>
                                <span className="epic-form-sig-label">Ministry Head</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.pastorSignature || ""}</div>
                                <span className="epic-form-sig-label">Senior Pastor Approval</span>
                            </div>
                        </div>
                    </>
                )}

                {/* =========================================================
                    FORM 6: MINISTRY ASSIGNMENT FORM
                ========================================================= */}
                {form.id === "ministry-assignment" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">1. Official Appointment Details</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Appointment Doc No." name="docNo" value={fields.docNo} onChange={handleInputChange} />
                                <PrintField label="Appointee Full Name" name="appointeeName" value={fields.appointeeName} onChange={handleInputChange} />
                                <PrintField label="Member Code" name="memberCode" value={fields.memberCode} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Ministry / Department" name="department" value={fields.department} onChange={handleInputChange} />
                                <PrintField label="Designated Role Title" name="assignedRole" value={fields.assignedRole} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Term Effective Date" type="date" name="termStart" value={fields.termStart} onChange={handleInputChange} />
                                <PrintField label="Term Renewal Date" type="date" name="termEnd" value={fields.termEnd} onChange={handleInputChange} />
                                <PrintField label="Overseeing Mentor / Pastor" name="supervisor" value={fields.supervisor} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Scope of Responsibilities & Duties</div>
                            <PrintField label="Duties & Expectations" name="responsibilities" value={fields.responsibilities} rows={3} onChange={handleInputChange} />
                        </section>

                        <div className="epic-form-declaration-box">
                            <strong>APPOINTMENT RATIFICATION:</strong> This ministry assignment is issued with the prayer and blessing of Luke 4:18 Ministries leadership. The appointee agrees to shepherd and serve with humility and excellence.
                        </div>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.appointeeSignature || ""}</div>
                                <span className="epic-form-sig-label">Appointee Acceptance</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.pastorSignature || ""}</div>
                                <span className="epic-form-sig-label">Senior Pastor</span>
                            </div>
                            <div className="epic-form-seal-box">Official Seal</div>
                        </div>
                    </>
                )}

                {/* =========================================================
                    FORM 7: BAPTISM INFORMATION FORM
                ========================================================= */}
                {form.id === "baptism" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">1. Baptism Candidate Information</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Candidate Full Name" name="candidateName" value={fields.candidateName} onChange={handleInputChange} />
                                <PrintField label="Date of Birth" type="date" name="dob" value={fields.dob} onChange={handleInputChange} />
                                <PrintField label="Age & Gender" name="ageGender" value={fields.ageGender || "20 / Female"} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Contact Number" name="contactNo" value={fields.contactNo} onChange={handleInputChange} />
                                <PrintField label="Home Address" name="address" value={fields.address} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Spiritual Preparedness & Class Completion</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Date Accepted Christ" type="date" name="dateAcceptedChrist" value={fields.dateAcceptedChrist} onChange={handleInputChange} />
                                <PrintField label="Class Date Completed" type="date" name="classDateCompleted" value={fields.classDateCompleted} onChange={handleInputChange} />
                                <PrintField label="Class Instructor" name="instructor" value={fields.instructor} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Scheduled Water Baptism Ceremony</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Ceremony Date" type="date" name="baptismDate" value={fields.baptismDate} onChange={handleInputChange} />
                                <PrintField label="Baptism Venue" name="venue" value={fields.venue} onChange={handleInputChange} />
                                <PrintField label="Officiating Minister" name="officiatingPastor" value={fields.officiatingPastor} onChange={handleInputChange} />
                            </div>
                        </section>

                        <div className="epic-form-declaration-box">
                            <strong>STATEMENT OF FAITH:</strong> "We are buried therefore with him by baptism into death... even so we also should walk in newness of life." (Romans 6:4). I publicly declare my repentance and faith in Jesus Christ as my Lord.
                        </div>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.candidateSignature || ""}</div>
                                <span className="epic-form-sig-label">Candidate Signature</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.pastorSignature || ""}</div>
                                <span className="epic-form-sig-label">Officiating Minister</span>
                            </div>
                            <div className="epic-form-seal-box">Baptism Seal</div>
                        </div>
                    </>
                )}

                {/* =========================================================
                    FORM 8: CHILD DEDICATION FORM
                ========================================================= */}
                {form.id === "child-dedication" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">1. Child Information</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Child's Full Name" name="childName" value={fields.childName} onChange={handleInputChange} />
                                <PrintField label="Date of Birth" type="date" name="dob" value={fields.dob} onChange={handleInputChange} />
                                <PrintField label="Gender / Nickname" name="genderNickname" value={fields.genderNickname || "Male (Nate)"} onChange={handleInputChange} />
                            </div>
                            <PrintField label="Place of Birth" name="pob" value={fields.pob} onChange={handleInputChange} />
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Parents' Information</div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Father's Full Name" name="fatherName" value={fields.fatherName} onChange={handleInputChange} />
                                <PrintField label="Father's Contact" name="fatherContact" value={fields.fatherContact} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Mother's Full Maiden Name" name="motherName" value={fields.motherName} onChange={handleInputChange} />
                                <PrintField label="Mother's Contact" name="motherContact" value={fields.motherContact} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Parents' Wedding Date" type="date" name="weddingDate" value={fields.weddingDate} onChange={handleInputChange} />
                                <PrintField label="Home Residence Address" name="address" value={fields.address} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Primary Sponsors (Ninong & Ninang)</div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Sponsor 1" name="sponsor1" value={fields.sponsor1} onChange={handleInputChange} />
                                <PrintField label="Sponsor 2" name="sponsor2" value={fields.sponsor2} onChange={handleInputChange} />
                                <PrintField label="Sponsor 3" name="sponsor3" value={fields.sponsor3} onChange={handleInputChange} />
                                <PrintField label="Sponsor 4" name="sponsor4" value={fields.sponsor4} onChange={handleInputChange} />
                            </div>
                        </section>

                        <div className="epic-form-declaration-box">
                            <strong>PARENTS' COVENANT:</strong> We recognize this child as a precious heritage from the Lord (Psalm 127:3) and dedicate him/her to Jesus Christ, promising before God and this congregation to raise him/her in Christian faith.
                        </div>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.fatherSignature || ""}</div>
                                <span className="epic-form-sig-label">Father's Signature</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.motherSignature || ""}</div>
                                <span className="epic-form-sig-label">Mother's Signature</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.pastorSignature || ""}</div>
                                <span className="epic-form-sig-label">Officiating Pastor</span>
                            </div>
                        </div>
                    </>
                )}

                {/* =========================================================
                    FORM 9: MARRIAGE INFORMATION FORM
                ========================================================= */}
                {form.id === "marriage" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">1. Groom Information</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Groom Full Name" name="groomName" value={fields.groomName} onChange={handleInputChange} />
                                <PrintField label="Birth Date & Age" name="groomDobAge" value={fields.groomDobAge || "1997-06-14 (Age 29)"} onChange={handleInputChange} />
                                <PrintField label="Contact Number" name="groomContact" value={fields.groomContact} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Parents' Names" name="groomParents" value={fields.groomParents} onChange={handleInputChange} />
                                <PrintField label="Religious Affiliation" name="groomReligion" value={fields.groomReligion} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Bride Information</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Bride Full Name" name="brideName" value={fields.brideName} onChange={handleInputChange} />
                                <PrintField label="Birth Date & Age" name="brideDobAge" value={fields.brideDobAge || "1999-09-20 (Age 27)"} onChange={handleInputChange} />
                                <PrintField label="Contact Number" name="brideContact" value={fields.brideContact} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Parents' Names" name="brideParents" value={fields.brideParents} onChange={handleInputChange} />
                                <PrintField label="Religious Affiliation" name="brideReligion" value={fields.brideReligion} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Pre-Marital Counseling & Wedding Solemnization</div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <PrintField label="Counseling Pastor" name="counselorPastor" value={fields.counselorPastor} onChange={handleInputChange} />
                                <PrintField label="Sessions Completed" name="counselingDates" value={fields.counselingDates} onChange={handleInputChange} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <PrintField label="Scheduled Wedding Date & Time" name="weddingDateTime" value={fields.weddingDateTime || "2026-12-12 at 3:00 PM"} onChange={handleInputChange} />
                                <PrintField label="Officiating Minister" name="officiatingMinister" value={fields.officiatingMinister} onChange={handleInputChange} />
                                <PrintField label="Marriage License No." name="marriageLicenseNo" value={fields.marriageLicenseNo} onChange={handleInputChange} />
                            </div>
                        </section>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.groomSignature || ""}</div>
                                <span className="epic-form-sig-label">Groom's Signature</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.brideSignature || ""}</div>
                                <span className="epic-form-sig-label">Bride's Signature</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.pastorSignature || ""}</div>
                                <span className="epic-form-sig-label">Officiating Minister</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Official Footer Note */}
                <footer className="epic-form-doc-footer">
                    <span>Luke 4:18 Ministries • San Vicente Church, Umingan, Pangasinan</span>
                    <span>Printed via EPIC Church Management System</span>
                </footer>
            </article>
        </div>
    );
};

export default ChurchFormDocument;

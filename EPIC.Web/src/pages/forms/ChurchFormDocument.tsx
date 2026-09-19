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

export const ChurchFormDocument: React.FC<ChurchFormDocumentProps> = ({
    form,
    onBack,
}) => {
    const today = new Date().toISOString().split("T")[0];

    // Generic form state supporting all inputs
    const [fields, setFields] = useState<Record<string, string>>({
        date: today,
    });

    const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
                address: "Barangay San Vicente, Panabo City, Davao del Norte",
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
                address: "Purok 4, San Vicente, Panabo City",
                emergencyContact: "Elena Santos (Mother)",
                emergencyPhone: "0920-111-2233",
                education: "Bachelor of Science in Accountancy",
                occupation: "Accountant",
                company: "Panabo Commercial Corp.",
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
                address: "Block 7, Lot 12, Sunrise Village, San Vicente",
                spouseName: "Anita Gomez",
                spouseContact: "0919-876-5433",
                weddingDate: "2010-12-18",
                child1Name: "Joshua Gomez", child1Dob: "2012-05-10", child1Baptized: "Yes", child1School: "Panabo NHS",
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
                address: "Gredu, Panabo City",
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
                address: "Purok 2, San Vicente, Panabo City",
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
                pob: "Panabo City Doctor's Hospital",
                gender: "Male",
                fatherName: "Juan Dela Cruz",
                fatherContact: "0917-123-4567",
                motherName: "Maria Clara Dela Cruz",
                motherContact: "0917-987-6543",
                weddingDate: "2022-01-15",
                address: "San Vicente, Panabo City",
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
                groomAddress: "Davao City",
                groomParents: "Joseph & Rebecca Morales",
                groomReligion: "Evangelical Christian (Luke 4:18)",
                brideName: "Sarah Jane Perez",
                brideDob: "1999-09-20",
                brideAge: "27",
                brideContact: "0916-333-4455",
                brideAddress: "San Vicente, Panabo City",
                brideParents: "Manuel & Elena Perez",
                brideReligion: "Evangelical Christian (Luke 4:18)",
                counselorPastor: "Pastor Danilo Reyes",
                counselingDates: "Sessions completed: Aug 8, Aug 15, Aug 22, Aug 29, 2026",
                weddingDate: "2026-12-12",
                weddingTime: "3:00 PM",
                venue: "Luke 4:18 Ministries Sanctuary",
                officiatingMinister: "Pastor Danilo Reyes (Lic. #98721)",
                marriageLicenseNo: "ML-2026-9041 issued at Panabo City",
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
            <article className="epic-printable-sheet">
                {/* Official Church Letterhead */}
                <header className="epic-form-header">
                    <div className="epic-form-letterhead">
                        <div className="epic-form-brand-seal">
                            EPIC
                            <small>CHURCH</small>
                        </div>
                        <div className="epic-form-letterhead-info">
                            <h1>Luke 4:18 Ministries</h1>
                            <h2>San Vicente Church • Panabo City</h2>
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
                                <div className="epic-form-field">
                                    <label>Member Code / ID</label>
                                    <input className="epic-form-input" name="memberCode" value={fields.memberCode || ""} onChange={handleInputChange} placeholder="MEM-YYYY-XXXX" />
                                </div>
                                <div className="epic-form-field">
                                    <label>Full Legal Name</label>
                                    <input className="epic-form-input" name="fullName" value={fields.fullName || ""} onChange={handleInputChange} placeholder="Last Name, First Name, Middle Name" />
                                </div>
                                <div className="epic-form-field">
                                    <label>Nickname / Call Name</label>
                                    <input className="epic-form-input" name="nickname" value={fields.nickname || ""} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="epic-form-grid epic-form-grid-4" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Date of Birth</label>
                                    <input className="epic-form-input" type="date" name="dob" value={fields.dob || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Gender</label>
                                    <select className="epic-form-select" name="gender" value={fields.gender || ""} onChange={handleInputChange}>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="epic-form-field">
                                    <label>Civil Status</label>
                                    <select className="epic-form-select" name="civilStatus" value={fields.civilStatus || ""} onChange={handleInputChange}>
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Separated">Separated</option>
                                    </select>
                                </div>
                                <div className="epic-form-field">
                                    <label>Occupation / Profession</label>
                                    <input className="epic-form-input" name="occupation" value={fields.occupation || ""} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="epic-form-grid epic-form-grid-2" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Mobile / Contact Number</label>
                                    <input className="epic-form-input" name="contactNo" value={fields.contactNo || ""} onChange={handleInputChange} placeholder="09XX-XXX-XXXX" />
                                </div>
                                <div className="epic-form-field">
                                    <label>Email Address</label>
                                    <input className="epic-form-input" type="email" name="email" value={fields.email || ""} onChange={handleInputChange} placeholder="example@domain.com" />
                                </div>
                            </div>

                            <div className="epic-form-field" style={{ marginTop: 12 }}>
                                <label>Complete Home Address</label>
                                <input className="epic-form-input" name="address" value={fields.address || ""} onChange={handleInputChange} placeholder="House / Street / Barangay / City / Province" />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Spiritual Journey & Church Background</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <div className="epic-form-field">
                                    <label>Date Accepted Christ as Savior</label>
                                    <input className="epic-form-input" type="date" name="dateAcceptedChrist" value={fields.dateAcceptedChrist || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Date Water Baptized</label>
                                    <input className="epic-form-input" type="date" name="baptizedDate" value={fields.baptizedDate || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Referred / Invited By</label>
                                    <input className="epic-form-input" name="referredBy" value={fields.referredBy || ""} onChange={handleInputChange} placeholder="Member Name" />
                                </div>
                            </div>
                            <div className="epic-form-field" style={{ marginTop: 12 }}>
                                <label>Previous Church Affiliation (if transferring)</label>
                                <input className="epic-form-input" name="previousChurch" value={fields.previousChurch || ""} onChange={handleInputChange} placeholder="Church Name and Location" />
                            </div>
                            <div className="epic-form-field" style={{ marginTop: 12 }}>
                                <label>Reason for Joining Luke 4:18 Ministries</label>
                                <textarea className="epic-form-textarea" name="reasonForJoining" value={fields.reasonForJoining || ""} onChange={handleInputChange} rows={2} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Ministry Interests & Involvement</div>
                            <p style={{ fontSize: 11, color: "#475569", margin: "0 0 10px 0" }}>Check all areas where you feel called or interested in serving:</p>
                            <div className="epic-form-checkbox-group">
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.interestWorship} onChange={() => handleCheckboxChange("interestWorship")} />
                                    Praise & Worship / Music
                                </label>
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.interestTech} onChange={() => handleCheckboxChange("interestTech")} />
                                    Technical, Audio & Multimedia
                                </label>
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.interestUsher} onChange={() => handleCheckboxChange("interestUsher")} />
                                    Ushering, Greeters & Protocol
                                </label>
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.interestKids} onChange={() => handleCheckboxChange("interestKids")} />
                                    Children's Ministry / Sunday School
                                </label>
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.interestYouth} onChange={() => handleCheckboxChange("interestYouth")} />
                                    Youth & Campus Ministry
                                </label>
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.interestPrayer} onChange={() => handleCheckboxChange("interestPrayer")} />
                                    Intercessory Prayer Ministry
                                </label>
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.interestOutreach} onChange={() => handleCheckboxChange("interestOutreach")} />
                                    Evangelism & Community Outreach
                                </label>
                            </div>
                        </section>

                        <div className="epic-form-declaration-box">
                            <strong>MEMBERSHIP COVENANT & DECLARATION:</strong>
                            <br />
                            Having received Jesus Christ as my personal Lord and Savior, and being in agreement with the vision, mission, doctrine, and leadership of Luke 4:18 Ministries, I hereby apply for church membership. I commit to attend church services faithfully, participate in fellowship and small groups, give cheerfully of my tithes and offerings, and live a lifestyle that glorifies Jesus Christ.
                        </div>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.applicantSignature || ""}</div>
                                <span className="epic-form-sig-label">Applicant's Signature</span>
                                <span className="epic-form-sig-sub">Signature over Printed Name</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.pastorSignature || ""}</div>
                                <span className="epic-form-sig-label">Senior Pastor / Minister</span>
                                <span className="epic-form-sig-sub">Approved & Accepted into Fellowship</span>
                            </div>
                            <div className="epic-form-seal-box">
                                Church Seal Stamp
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
                                <div className="epic-form-field">
                                    <label>Member ID Code</label>
                                    <input className="epic-form-input" name="memberCode" value={fields.memberCode || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Membership Status</label>
                                    <select className="epic-form-select" name="membershipStatus" value={fields.membershipStatus || "Active"} onChange={handleInputChange}>
                                        <option value="Active">Active Regular Member</option>
                                        <option value="Probationary">Probationary / Candidate</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Transferred">Transferred</option>
                                    </select>
                                </div>
                                <div className="epic-form-field">
                                    <label>Blood Type</label>
                                    <input className="epic-form-input" name="bloodType" value={fields.bloodType || ""} onChange={handleInputChange} placeholder="e.g. O+, A+, B+" />
                                </div>
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Personal Profile</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <div className="epic-form-field">
                                    <label>Full Name</label>
                                    <input className="epic-form-input" name="fullName" value={fields.fullName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Date of Birth</label>
                                    <input className="epic-form-input" type="date" name="dob" value={fields.dob || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Gender & Civil Status</label>
                                    <input className="epic-form-input" name="genderStatus" value={fields.genderStatus || "Female / Single"} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-grid epic-form-grid-2" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Contact Phone</label>
                                    <input className="epic-form-input" name="contactNo" value={fields.contactNo || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Email Address</label>
                                    <input className="epic-form-input" name="email" value={fields.email || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-field" style={{ marginTop: 12 }}>
                                <label>Residence Address</label>
                                <input className="epic-form-input" name="address" value={fields.address || ""} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Emergency Contact Person</div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <div className="epic-form-field">
                                    <label>Contact Person & Relationship</label>
                                    <input className="epic-form-input" name="emergencyContact" value={fields.emergencyContact || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Emergency Contact Phone</label>
                                    <input className="epic-form-input" name="emergencyPhone" value={fields.emergencyPhone || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">4. Church Involvement & Ministry Roles</div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <div className="epic-form-field">
                                    <label>Current Ministry Assigned</label>
                                    <input className="epic-form-input" name="ministry" value={fields.ministry || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Life Group / Cell Leader</label>
                                    <input className="epic-form-input" name="cellGroupLeader" value={fields.cellGroupLeader || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-field" style={{ marginTop: 12 }}>
                                <label>Spiritual Gifts & Special Talents</label>
                                <input className="epic-form-input" name="spiritualGifts" value={fields.spiritualGifts || ""} onChange={handleInputChange} />
                            </div>
                        </section>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.memberSignature || ""}</div>
                                <span className="epic-form-sig-label">Member Signature</span>
                                <span className="epic-form-sig-sub">Verified & Certified Correct</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.officerSignature || ""}</div>
                                <span className="epic-form-sig-label">Church Records Officer</span>
                                <span className="epic-form-sig-sub">Church Administration & Secretariat</span>
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
                                <div className="epic-form-field">
                                    <label>Head of Household Name</label>
                                    <input className="epic-form-input" name="headName" value={fields.headName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Head Contact Number</label>
                                    <input className="epic-form-input" name="headContact" value={fields.headContact || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Family ID Code</label>
                                    <input className="epic-form-input" name="familyCode" value={fields.familyCode || ""} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="epic-form-grid epic-form-grid-3" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Spouse Full Name</label>
                                    <input className="epic-form-input" name="spouseName" value={fields.spouseName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Spouse Contact Number</label>
                                    <input className="epic-form-input" name="spouseContact" value={fields.spouseContact || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Wedding Date (Church/Civil)</label>
                                    <input className="epic-form-input" type="date" name="weddingDate" value={fields.weddingDate || ""} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="epic-form-field" style={{ marginTop: 12 }}>
                                <label>Family Residence Address</label>
                                <input className="epic-form-input" name="address" value={fields.address || ""} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Children & Household Dependents</div>
                            <table className="epic-form-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "35%" }}>Child / Dependent Full Name</th>
                                        <th style={{ width: "20%" }}>Birth Date</th>
                                        <th style={{ width: "15%" }}>Water Baptized</th>
                                        <th style={{ width: "30%" }}>School / Grade / Work</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><input name="child1Name" value={fields.child1Name || ""} onChange={handleInputChange} placeholder="Name" /></td>
                                        <td><input name="child1Dob" value={fields.child1Dob || ""} onChange={handleInputChange} placeholder="YYYY-MM-DD" /></td>
                                        <td><input name="child1Baptized" value={fields.child1Baptized || ""} onChange={handleInputChange} placeholder="Yes / No" /></td>
                                        <td><input name="child1School" value={fields.child1School || ""} onChange={handleInputChange} placeholder="School / Occupation" /></td>
                                    </tr>
                                    <tr>
                                        <td><input name="child2Name" value={fields.child2Name || ""} onChange={handleInputChange} placeholder="Name" /></td>
                                        <td><input name="child2Dob" value={fields.child2Dob || ""} onChange={handleInputChange} placeholder="YYYY-MM-DD" /></td>
                                        <td><input name="child2Baptized" value={fields.child2Baptized || ""} onChange={handleInputChange} placeholder="Yes / No" /></td>
                                        <td><input name="child2School" value={fields.child2School || ""} onChange={handleInputChange} placeholder="School / Occupation" /></td>
                                    </tr>
                                    <tr>
                                        <td><input name="child3Name" value={fields.child3Name || ""} onChange={handleInputChange} placeholder="Name" /></td>
                                        <td><input name="child3Dob" value={fields.child3Dob || ""} onChange={handleInputChange} placeholder="YYYY-MM-DD" /></td>
                                        <td><input name="child3Baptized" value={fields.child3Baptized || ""} onChange={handleInputChange} placeholder="Yes / No" /></td>
                                        <td><input name="child3School" value={fields.child3School || ""} onChange={handleInputChange} placeholder="School / Occupation" /></td>
                                    </tr>
                                    <tr>
                                        <td><input name="child4Name" value={fields.child4Name || ""} onChange={handleInputChange} placeholder="Name" /></td>
                                        <td><input name="child4Dob" value={fields.child4Dob || ""} onChange={handleInputChange} placeholder="YYYY-MM-DD" /></td>
                                        <td><input name="child4Baptized" value={fields.child4Baptized || ""} onChange={handleInputChange} placeholder="Yes / No" /></td>
                                        <td><input name="child4School" value={fields.child4School || ""} onChange={handleInputChange} placeholder="School / Occupation" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Family Prayer Requests & Spiritual Needs</div>
                            <textarea className="epic-form-textarea" name="prayerRequests" value={fields.prayerRequests || ""} onChange={handleInputChange} rows={3} placeholder="Write any specific prayer requests or spiritual assistance needed..." />
                        </section>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.headSignature || ""}</div>
                                <span className="epic-form-sig-label">Head of Household Signature</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.pastorSignature || ""}</div>
                                <span className="epic-form-sig-label">Family Life Ministry Pastor</span>
                            </div>
                        </div>
                    </>
                )}

                {/* =========================================================
                    FORM 4: VISITOR INFORMATION CARD
                ========================================================= */}
                {form.id === "visitor-card" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">Welcome to Luke 4:18 Ministries!</div>
                            <p style={{ fontSize: 11.5, color: "#475569", margin: "0 0 14px 0" }}>
                                We are so honored to have you worship with us today. Please take a moment to fill out this connection card so we can welcome you and pray for you.
                            </p>

                            <div className="epic-form-grid epic-form-grid-2">
                                <div className="epic-form-field">
                                    <label>Service Attended</label>
                                    <input className="epic-form-input" name="serviceAttended" value={fields.serviceAttended || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Full Name</label>
                                    <input className="epic-form-input" name="fullName" value={fields.fullName || ""} onChange={handleInputChange} placeholder="Your name" />
                                </div>
                            </div>

                            <div className="epic-form-grid epic-form-grid-3" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Age Group</label>
                                    <select className="epic-form-select" name="ageGroup" value={fields.ageGroup || ""} onChange={handleInputChange}>
                                        <option value="">Select Age Group</option>
                                        <option value="Youth (13-20)">Youth (13-20)</option>
                                        <option value="Young Adult (21-35)">Young Adult (21-35)</option>
                                        <option value="Adult (36-59)">Adult (36-59)</option>
                                        <option value="Senior Citizen (60+)">Senior Citizen (60+)</option>
                                    </select>
                                </div>
                                <div className="epic-form-field">
                                    <label>Mobile Contact Number</label>
                                    <input className="epic-form-input" name="contactNo" value={fields.contactNo || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Email Address</label>
                                    <input className="epic-form-input" name="email" value={fields.email || ""} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="epic-form-field" style={{ marginTop: 12 }}>
                                <label>Address / Location</label>
                                <input className="epic-form-input" name="address" value={fields.address || ""} onChange={handleInputChange} />
                            </div>

                            <div className="epic-form-grid epic-form-grid-2" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>How did you hear about our church?</label>
                                    <input className="epic-form-input" name="howDidYouHear" value={fields.howDidYouHear || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Invited by (Church Member)</label>
                                    <input className="epic-form-input" name="invitedBy" value={fields.invitedBy || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">My Next Steps / Decision Today</div>
                            <div className="epic-form-checkbox-group">
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.firstTime} onChange={() => handleCheckboxChange("firstTime")} />
                                    This is my 1st time visiting
                                </label>
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.decisionJesus} onChange={() => handleCheckboxChange("decisionJesus")} />
                                    I made a decision to receive Jesus Christ today
                                </label>
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.interestWaterBaptism} onChange={() => handleCheckboxChange("interestWaterBaptism")} />
                                    I want to be water baptized
                                </label>
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.interestLifeGroup} onChange={() => handleCheckboxChange("interestLifeGroup")} />
                                    I want to join a Life Group / Cell Group
                                </label>
                                <label className="epic-form-checkbox-label">
                                    <input type="checkbox" checked={!!checkboxes.requestCall} onChange={() => handleCheckboxChange("requestCall")} />
                                    I would like a pastoral call / home visit
                                </label>
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">How can we pray for you? (Prayer Requests)</div>
                            <textarea className="epic-form-textarea" name="prayerRequest" value={fields.prayerRequest || ""} onChange={handleInputChange} rows={3} placeholder="Write your prayer request here..." />
                        </section>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.assignedTo || ""}</div>
                                <span className="epic-form-sig-label">Assigned Follow-Up Worker</span>
                                <span className="epic-form-sig-sub">Visitor Care Ministry</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">Completed</div>
                                <span className="epic-form-sig-label">Follow-Up Action Status</span>
                                <span className="epic-form-sig-sub">Recorded in EPIC CMS</span>
                            </div>
                        </div>
                    </>
                )}

                {/* =========================================================
                    FORM 5: MINISTRY VOLUNTEER FORM
                ========================================================= */}
                {form.id === "ministry-volunteer" && (
                    <>
                        <section className="epic-form-section">
                            <div className="epic-form-section-title">1. Volunteer Information</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <div className="epic-form-field">
                                    <label>Volunteer Full Name</label>
                                    <input className="epic-form-input" name="fullName" value={fields.fullName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Member Code</label>
                                    <input className="epic-form-input" name="memberCode" value={fields.memberCode || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Contact Number</label>
                                    <input className="epic-form-input" name="contactNo" value={fields.contactNo || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-grid epic-form-grid-2" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Life Group Leader</label>
                                    <input className="epic-form-input" name="lifeGroupLeader" value={fields.lifeGroupLeader || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Desired Ministry to Serve In</label>
                                    <input className="epic-form-input" name="desiredMinistry" value={fields.desiredMinistry || ""} onChange={handleInputChange} placeholder="e.g. Worship, Media, Ushers, Kids" />
                                </div>
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Talents, Skills & Experience</div>
                            <div className="epic-form-field">
                                <label>Specific Skills & Instruments (Musical, Technical, Teaching, etc.)</label>
                                <textarea className="epic-form-textarea" name="specificSkills" value={fields.specificSkills || ""} onChange={handleInputChange} rows={2} />
                            </div>
                            <div className="epic-form-grid epic-form-grid-2" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Previous Ministry / Serving Experience</label>
                                    <input className="epic-form-input" name="experienceYears" value={fields.experienceYears || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Weekly Schedule Availability</label>
                                    <input className="epic-form-input" name="scheduleAvailability" value={fields.scheduleAvailability || ""} onChange={handleInputChange} placeholder="e.g. Sunday Morning, Saturday Rehearsal" />
                                </div>
                            </div>
                        </section>

                        <div className="epic-form-declaration-box">
                            <strong>VOLUNTEER PLEDGE OF SERVICE:</strong>
                            <br />
                            I joyfully offer my time, talents, and gifts for the service of God and His kingdom through Luke 4:18 Ministries. I commit to remain punctual, faithful, cooperative with church leadership, and maintain a Christian character worthy of the Gospel of Christ.
                        </div>

                        <div className="epic-form-signatures">
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.volunteerSignature || ""}</div>
                                <span className="epic-form-sig-label">Volunteer Signature</span>
                            </div>
                            <div className="epic-form-sig-block">
                                <div className="epic-form-sig-line">{fields.ministryHeadSignature || ""}</div>
                                <span className="epic-form-sig-label">Ministry Department Head</span>
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
                                <div className="epic-form-field">
                                    <label>Appointment Document No.</label>
                                    <input className="epic-form-input" name="docNo" value={fields.docNo || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Appointee Full Name</label>
                                    <input className="epic-form-input" name="appointeeName" value={fields.appointeeName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Member Code</label>
                                    <input className="epic-form-input" name="memberCode" value={fields.memberCode || ""} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="epic-form-grid epic-form-grid-2" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Ministry / Department</label>
                                    <input className="epic-form-input" name="department" value={fields.department || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Designated Role / Position Title</label>
                                    <input className="epic-form-input" name="assignedRole" value={fields.assignedRole || ""} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="epic-form-grid epic-form-grid-3" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Term Effective Date</label>
                                    <input className="epic-form-input" type="date" name="termStart" value={fields.termStart || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Term Expiration / Renewal</label>
                                    <input className="epic-form-input" type="date" name="termEnd" value={fields.termEnd || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Direct Overseer / Mentor</label>
                                    <input className="epic-form-input" name="supervisor" value={fields.supervisor || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Scope of Responsibilities & Duties</div>
                            <textarea className="epic-form-textarea" name="responsibilities" value={fields.responsibilities || ""} onChange={handleInputChange} rows={4} placeholder="Key duties and ministry scope..." />
                        </section>

                        <div className="epic-form-declaration-box">
                            <strong>APPOINTMENT RATIFICATION:</strong>
                            <br />
                            This official ministry assignment is issued with the confidence and spiritual blessing of Luke 4:18 Ministries leadership. The appointee agrees to shepherd and serve with humility, diligence, and spiritual excellence according to 1 Peter 5:2-3.
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
                            <div className="epic-form-seal-box">
                                Official Church Seal
                            </div>
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
                                <div className="epic-form-field">
                                    <label>Candidate Full Name</label>
                                    <input className="epic-form-input" name="candidateName" value={fields.candidateName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Date of Birth</label>
                                    <input className="epic-form-input" type="date" name="dob" value={fields.dob || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Gender & Age</label>
                                    <input className="epic-form-input" name="genderAge" value={fields.genderAge || `${fields.gender || "Female"} / Age ${fields.age || "20"}`} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-grid epic-form-grid-2" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Contact Number</label>
                                    <input className="epic-form-input" name="contactNo" value={fields.contactNo || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Address</label>
                                    <input className="epic-form-input" name="address" value={fields.address || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Spiritual Preparedness & Class Completion</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <div className="epic-form-field">
                                    <label>Date Accepted Jesus Christ</label>
                                    <input className="epic-form-input" type="date" name="dateAcceptedChrist" value={fields.dateAcceptedChrist || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Pre-Baptism Class Date</label>
                                    <input className="epic-form-input" type="date" name="classDateCompleted" value={fields.classDateCompleted || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Class Instructor / Elder</label>
                                    <input className="epic-form-input" name="instructor" value={fields.instructor || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Scheduled Water Baptism Ceremony</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <div className="epic-form-field">
                                    <label>Ceremony Date</label>
                                    <input className="epic-form-input" type="date" name="baptismDate" value={fields.baptismDate || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Baptism Venue</label>
                                    <input className="epic-form-input" name="venue" value={fields.venue || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Officiating Minister</label>
                                    <input className="epic-form-input" name="officiatingPastor" value={fields.officiatingPastor || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                        </section>

                        <div className="epic-form-declaration-box">
                            <strong>STATEMENT OF FAITH:</strong>
                            <br />
                            "We are buried therefore with him by baptism into death: that like as Christ was raised up from the dead by the glory of the Father, even so we also should walk in newness of life." (Romans 6:4). I publicly declare that I have repented of my sins and accepted Jesus Christ as my only Savior and Lord.
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
                            <div className="epic-form-seal-box">
                                Baptism Certificate Seal
                            </div>
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
                                <div className="epic-form-field">
                                    <label>Child's Full Name</label>
                                    <input className="epic-form-input" name="childName" value={fields.childName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Date of Birth</label>
                                    <input className="epic-form-input" type="date" name="dob" value={fields.dob || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Gender / Nickname</label>
                                    <input className="epic-form-input" name="childGender" value={fields.childGender || "Male (Nate)"} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-field" style={{ marginTop: 12 }}>
                                <label>Place of Birth</label>
                                <input className="epic-form-input" name="pob" value={fields.pob || ""} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Parents' Information</div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <div className="epic-form-field">
                                    <label>Father's Full Name</label>
                                    <input className="epic-form-input" name="fatherName" value={fields.fatherName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Father's Contact Number</label>
                                    <input className="epic-form-input" name="fatherContact" value={fields.fatherContact || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-grid epic-form-grid-2" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Mother's Full Maiden Name</label>
                                    <input className="epic-form-input" name="motherName" value={fields.motherName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Mother's Contact Number</label>
                                    <input className="epic-form-input" name="motherContact" value={fields.motherContact || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-field" style={{ marginTop: 12 }}>
                                <label>Home Residence Address</label>
                                <input className="epic-form-input" name="address" value={fields.address || ""} onChange={handleInputChange} />
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Godparents / Sponsors (Ninong & Ninang)</div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <div className="epic-form-field">
                                    <label>Primary Sponsors (Ninong / Ninang)</label>
                                    <input className="epic-form-input" name="sponsor1" value={fields.sponsor1 || ""} onChange={handleInputChange} placeholder="Name & Church" />
                                    <input className="epic-form-input" style={{ marginTop: 6 }} name="sponsor2" value={fields.sponsor2 || ""} onChange={handleInputChange} placeholder="Name & Church" />
                                </div>
                                <div className="epic-form-field">
                                    <label>Secondary Sponsors</label>
                                    <input className="epic-form-input" name="sponsor3" value={fields.sponsor3 || ""} onChange={handleInputChange} placeholder="Name & Church" />
                                    <input className="epic-form-input" style={{ marginTop: 6 }} name="sponsor4" value={fields.sponsor4 || ""} onChange={handleInputChange} placeholder="Name & Church" />
                                </div>
                            </div>
                        </section>

                        <div className="epic-form-declaration-box">
                            <strong>PARENTS' COVENANT OF DEDICATION:</strong>
                            <br />
                            We, the parents, recognize this child as a precious gift and heritage from the Lord (Psalm 127:3). We joyfully dedicate our child to the Lord Jesus Christ, promising in the presence of God and this congregation to raise him/her in the discipline and instruction of the Lord.
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
                                <div className="epic-form-field">
                                    <label>Groom Full Legal Name</label>
                                    <input className="epic-form-input" name="groomName" value={fields.groomName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Birth Date & Age</label>
                                    <input className="epic-form-input" name="groomDobAge" value={fields.groomDobAge || "1997-06-14 (Age 29)"} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Contact Number</label>
                                    <input className="epic-form-input" name="groomContact" value={fields.groomContact || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-grid epic-form-grid-2" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Parents' Names</label>
                                    <input className="epic-form-input" name="groomParents" value={fields.groomParents || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Religious Affiliation & Church</label>
                                    <input className="epic-form-input" name="groomReligion" value={fields.groomReligion || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">2. Bride Information</div>
                            <div className="epic-form-grid epic-form-grid-3">
                                <div className="epic-form-field">
                                    <label>Bride Full Legal Name</label>
                                    <input className="epic-form-input" name="brideName" value={fields.brideName || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Birth Date & Age</label>
                                    <input className="epic-form-input" name="brideDobAge" value={fields.brideDobAge || "1999-09-20 (Age 27)"} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Contact Number</label>
                                    <input className="epic-form-input" name="brideContact" value={fields.brideContact || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-grid epic-form-grid-2" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Parents' Names</label>
                                    <input className="epic-form-input" name="brideParents" value={fields.brideParents || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Religious Affiliation & Church</label>
                                    <input className="epic-form-input" name="brideReligion" value={fields.brideReligion || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                        </section>

                        <section className="epic-form-section">
                            <div className="epic-form-section-title">3. Pre-Marital Counseling & Wedding Solemnization</div>
                            <div className="epic-form-grid epic-form-grid-2">
                                <div className="epic-form-field">
                                    <label>Counseling Pastor</label>
                                    <input className="epic-form-input" name="counselorPastor" value={fields.counselorPastor || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Pre-Marital Sessions Completed</label>
                                    <input className="epic-form-input" name="counselingDates" value={fields.counselingDates || ""} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="epic-form-grid epic-form-grid-3" style={{ marginTop: 12 }}>
                                <div className="epic-form-field">
                                    <label>Scheduled Wedding Date & Time</label>
                                    <input className="epic-form-input" name="weddingDateTime" value={fields.weddingDateTime || "2026-12-12 at 3:00 PM"} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Officiating Minister</label>
                                    <input className="epic-form-input" name="officiatingMinister" value={fields.officiatingMinister || ""} onChange={handleInputChange} />
                                </div>
                                <div className="epic-form-field">
                                    <label>Marriage License / Doc No.</label>
                                    <input className="epic-form-input" name="marriageLicenseNo" value={fields.marriageLicenseNo || ""} onChange={handleInputChange} />
                                </div>
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
                    <span>Luke 4:18 Ministries • San Vicente Church, Panabo City</span>
                    <span>Printed via EPIC Church Management System</span>
                </footer>
            </article>
        </div>
    );
};

export default ChurchFormDocument;

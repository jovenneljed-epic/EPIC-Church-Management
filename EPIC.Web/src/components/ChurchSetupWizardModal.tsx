import React, { useState } from "react";
import axios from "axios";
import {
  Church,
  Calendar,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  User,
  Music,
  Tv,
  Heart,
  Baby,
  Smile,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { API_BASE_URL } from "../config";
import "./ChurchSetupWizardModal.css";

interface ChurchSetupWizardModalProps {
  isOpen: boolean;
  initialChurchName?: string;
  initialPastorName?: string;
  customerId?: number | null;
  onComplete: (completedChurchName: string) => void;
}

interface MinistryOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const DEFAULT_MINISTRIES: MinistryOption[] = [
  {
    id: "worship",
    name: "Worship & Praise Team",
    description: "Musicians, singers, and praise leaders.",
    icon: <Music size={18} className="text-amber-400" />,
  },
  {
    id: "media",
    name: "Multimedia & Live Stream",
    description: "Audio engineering, visual projection, camera operators.",
    icon: <Tv size={18} className="text-cyan-400" />,
  },
  {
    id: "ushers",
    name: "Ushers & Hospitality",
    description: "Greeters, seaters, offering collectors, welcome desk.",
    icon: <Smile size={18} className="text-emerald-400" />,
  },
  {
    id: "youth",
    name: "Youth & Campus Ministry",
    description: "Young adults, students, and next-generation leadership.",
    icon: <Sparkles size={18} className="text-purple-400" />,
  },
  {
    id: "kids",
    name: "Children's Church (EPIC Kids)",
    description: "Sunday school teachers, childcare, and children's workers.",
    icon: <Baby size={18} className="text-pink-400" />,
  },
  {
    id: "prayer",
    name: "Intercessory Prayer Team",
    description: "Prayer warriors and intercessors for the church and congregation.",
    icon: <Heart size={18} className="text-rose-400" />,
  },
];

export const ChurchSetupWizardModal: React.FC<ChurchSetupWizardModalProps> = ({
  isOpen,
  initialChurchName = "",
  initialPastorName = "",
  customerId,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Form State - Step 1: Church Identity
  const [churchName, setChurchName] = useState<string>(initialChurchName || "My Church Fellowship");
  const [pastorName, setPastorName] = useState<string>(initialPastorName || "Senior Pastor");
  const [phone, setPhone] = useState<string>("");
  const [location, setLocation] = useState<string>("Main Sanctuary");

  // Form State - Step 2: Sunday Service Schedule
  const [serviceName, setServiceName] = useState<string>("Sunday Morning Celebration");
  const [serviceType, setServiceType] = useState<string>("Sunday Worship");
  const [startTime, setStartTime] = useState<string>("08:00 AM");
  const [endTime, setEndTime] = useState<string>("10:00 AM");

  // Form State - Step 3: Default Ministries
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([
    "Worship & Praise Team",
    "Multimedia & Live Stream",
    "Ushers & Hospitality",
    "Youth & Campus Ministry",
    "Children's Church (EPIC Kids)",
  ]);

  if (!isOpen) return null;

  const toggleMinistry = (minName: string) => {
    setSelectedMinistries((prev) =>
      prev.includes(minName)
        ? prev.filter((m) => m !== minName)
        : [...prev, minName]
    );
  };

  const handleNext = () => {
    setErrorMessage("");
    if (step === 1) {
      if (!churchName.trim()) {
        setErrorMessage("Please enter your church name.");
        return;
      }
      if (!pastorName.trim()) {
        setErrorMessage("Please enter your senior pastor or lead minister name.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!serviceName.trim()) {
        setErrorMessage("Please specify a service name.");
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setErrorMessage("");
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmitSetup = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("accessToken");

      const payload = {
        churchName: churchName.trim(),
        pastorName: pastorName.trim(),
        phone: phone.trim() || null,
        serviceName: serviceName.trim(),
        serviceType: serviceType.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        location: location.trim(),
        ministries: selectedMinistries,
      };

      const response = await axios.post(
        `${API_BASE_URL}/Customers/complete-setup`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.success) {
        setIsFinished(true);
      } else {
        setIsFinished(true);
      }
    } catch (err: unknown) {
      console.error("Setup completion error:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage("Unable to save setup configuration. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="church-wizard-overlay">
      <div className="church-wizard-card">
        {/* Header Bar */}
        <div className="church-wizard-header">
          <div className="church-wizard-brand">
            <div className="church-wizard-logo-badge">
              <Church size={24} className="text-amber-400" />
            </div>
            <div>
              <h2 className="church-wizard-title">
                {isFinished ? "Workspace Ready!" : "Welcome to EPIC Church Management"}
              </h2>
              <p className="church-wizard-subtitle">
                {isFinished
                  ? "Your dedicated church ecosystem has been initialized."
                  : "First-Time Church Workspace Setup"}
              </p>
            </div>
          </div>

          {customerId && !isFinished && (
            <div className="church-wizard-badge">
              Tenant ID: #{customerId}
            </div>
          )}
        </div>

        {/* Stepper Progress Bar */}
        {!isFinished && (
          <div className="church-wizard-steps">
            <div className={`church-wizard-step-item ${step >= 1 ? "active" : ""}`}>
              <div className="church-step-number">{step > 1 ? <CheckCircle2 size={16} /> : "1"}</div>
              <span className="church-step-label">Church Profile</span>
            </div>
            <div className={`church-wizard-step-line ${step >= 2 ? "active" : ""}`} />
            <div className={`church-wizard-step-item ${step >= 2 ? "active" : ""}`}>
              <div className="church-step-number">{step > 2 ? <CheckCircle2 size={16} /> : "2"}</div>
              <span className="church-step-label">First Service</span>
            </div>
            <div className={`church-wizard-step-line ${step >= 3 ? "active" : ""}`} />
            <div className={`church-wizard-step-item ${step >= 3 ? "active" : ""}`}>
              <div className="church-step-number">3</div>
              <span className="church-step-label">Ministries</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="church-wizard-error">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="church-wizard-body">
          {/* STEP 1: Church Profile */}
          {step === 1 && !isFinished && (
            <div className="church-wizard-step-content animate-fade-in">
              <div className="church-step-intro">
                <Church size={20} className="church-intro-icon" />
                <div>
                  <h3>Tell us about your congregation</h3>
                  <p>Configure your church identity and lead pastoral oversight.</p>
                </div>
              </div>

              <div className="church-wizard-form-grid">
                <div className="church-wizard-field">
                  <label>
                    <Church size={15} /> Church Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="e.g. Grace Fellowship Church"
                    required
                  />
                  <small>This name will appear on member portals, kiosk banners, and reports.</small>
                </div>

                <div className="church-wizard-field">
                  <label>
                    <User size={15} /> Senior Pastor / Lead Minister <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={pastorName}
                    onChange={(e) => setPastorName(e.target.value)}
                    placeholder="e.g. Pastor John Doe"
                    required
                  />
                  <small>Lead shepherd or primary church administrator.</small>
                </div>

                <div className="church-wizard-field">
                  <label>
                    <Phone size={15} /> Contact Phone / Hotline
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +63 912 345 6789"
                  />
                  <small>For administrative and notification messages.</small>
                </div>

                <div className="church-wizard-field">
                  <label>
                    <MapPin size={15} /> Primary Sanctuary Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Main Sanctuary, 2nd Floor"
                  />
                  <small>Default physical meeting location for services.</small>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Sunday Service Schedule */}
          {step === 2 && !isFinished && (
            <div className="church-wizard-step-content animate-fade-in">
              <div className="church-step-intro">
                <Calendar size={20} className="church-intro-icon" />
                <div>
                  <h3>Set Up Your First Worship Service</h3>
                  <p>
                    EPIC CMS will immediately prepare this service for live facial biometrics
                    and QR attendance roster tracking.
                  </p>
                </div>
              </div>

              <div className="church-wizard-form-grid">
                <div className="church-wizard-field">
                  <label>
                    <Church size={15} /> Main Service Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g. Sunday Morning Celebration"
                    required
                  />
                  <small>Visible in the EPIC Smile Scanner and attendance records.</small>
                </div>

                <div className="church-wizard-field">
                  <label>
                    <Calendar size={15} /> Service Category
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    <option value="Sunday Worship">Sunday Worship Service</option>
                    <option value="Midweek Service">Midweek Prayer & Bible Study</option>
                    <option value="Youth Service">Youth & Young Adults Service</option>
                    <option value="Special Service">Special Celebration Service</option>
                  </select>
                </div>

                <div className="church-wizard-field">
                  <label>
                    <Clock size={15} /> Service Start Time <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. 08:00 AM or 09:30 AM"
                    required
                  />
                  <small>Scanners use this time to compute EARLY, PRESENT, or LATE statuses.</small>
                </div>

                <div className="church-wizard-field">
                  <label>
                    <Clock size={15} /> Service End Time
                  </label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="e.g. 10:00 AM or 11:30 AM"
                  />
                  <small>Estimated service conclusion.</small>
                </div>
              </div>

              <div className="church-wizard-tip-box">
                <Sparkles size={18} className="text-amber-400" />
                <span>
                  <strong>Automatic Sunday Scheduling:</strong> This service will automatically be
                  scheduled for the upcoming Sunday, ready for attendee scans and biometric enrollment.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Default Ministries */}
          {step === 3 && !isFinished && (
            <div className="church-wizard-step-content animate-fade-in">
              <div className="church-step-intro">
                <Users size={20} className="church-intro-icon" />
                <div>
                  <h3>Activate Your Ministry Teams</h3>
                  <p>
                    Select the ministry departments you want pre-configured in your new church portal.
                    You can add more or rename them at any time.
                  </p>
                </div>
              </div>

              <div className="church-ministries-grid">
                {DEFAULT_MINISTRIES.map((min) => {
                  const isChecked = selectedMinistries.includes(min.name);
                  return (
                    <div
                      key={min.id}
                      className={`church-ministry-card ${isChecked ? "selected" : ""}`}
                      onClick={() => toggleMinistry(min.name)}
                    >
                      <div className="church-ministry-card-left">
                        <div className="church-ministry-icon">{min.icon}</div>
                        <div>
                          <h4>{min.name}</h4>
                          <p>{min.description}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMinistry(min.name)}
                        className="church-ministry-checkbox"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CELEBRATION / FINISHED SCREEN */}
          {isFinished && (
            <div className="church-wizard-finished animate-fade-in">
              <div className="church-celebration-badge">
                <CheckCircle2 size={48} className="text-emerald-400" />
              </div>
              <h3>Congratulations, {pastorName}!</h3>
              <p className="church-celebration-desc">
                <strong>{churchName}</strong> has been successfully configured in EPIC CMS.
                Your Sunday service schedule, ministry departments, and tenant workspace
                are ready to go.
              </p>

              <div className="church-finished-summary">
                <div className="church-summary-row">
                  <span>Church Name:</span>
                  <strong>{churchName}</strong>
                </div>
                <div className="church-summary-row">
                  <span>First Service:</span>
                  <strong>{serviceName} ({startTime})</strong>
                </div>
                <div className="church-summary-row">
                  <span>Active Ministries:</span>
                  <strong>{selectedMinistries.length} Departments Configured</strong>
                </div>
              </div>

              <button
                type="button"
                className="church-wizard-btn church-wizard-btn-finish"
                onClick={() => onComplete(churchName)}
              >
                <Sparkles size={18} /> Launch Church Workspace
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isFinished && (
          <div className="church-wizard-footer">
            {step > 1 ? (
              <button
                type="button"
                className="church-wizard-btn-secondary"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            <div className="church-wizard-footer-right">
              {step < 3 ? (
                <button
                  type="button"
                  className="church-wizard-btn church-wizard-btn-primary"
                  onClick={handleNext}
                >
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="church-wizard-btn church-wizard-btn-complete"
                  onClick={handleSubmitSetup}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spin" /> Initializing Workspace...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Complete Setup & Launch
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

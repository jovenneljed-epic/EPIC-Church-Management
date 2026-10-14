import React, { useState } from "react";
import axios from "axios";
import {
  Church,
  User,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { API_BASE_URL } from "../config";
import "./ProvisionChurchModal.css";

interface ProvisionChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ProvisionedTenantResult {
  customerId: number;
  churchName: string;
  adminEmail: string;
  temporaryPassword: string;
}

export const ProvisionChurchModal: React.FC<ProvisionChurchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [churchName, setChurchName] = useState("");
  const [pastorName, setPastorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ProvisionedTenantResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!churchName.trim() || !pastorName.trim() || !email.trim() || !password.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("accessToken");

      const payload = {
        churchName: churchName.trim(),
        pastorName: pastorName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        password: password.trim(),
      };

      const response = await axios.post(
        `${API_BASE_URL}/Customers/provision`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.success) {
        setResult({
          customerId: response.data.customerId,
          churchName: response.data.churchName,
          adminEmail: response.data.adminEmail,
          temporaryPassword: password.trim(),
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(response.data?.message || "Failed to provision church.");
      }
    } catch (err: unknown) {
      console.error("Provisioning error:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Unable to provision new church. Please check fields or server logs.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!result) return;
    const text = `⛪ EPIC CMS Church Access Details\n\nChurch Name: ${result.churchName}\nCustomer ID: #${result.customerId}\nAdmin Email: ${result.adminEmail}\nPassword: ${result.temporaryPassword}\nLogin Portal: ${window.location.origin}\n\nNote: Upon first sign-in, the First-Time Setup Wizard will guide you to configure your service schedule and ministries.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleResetAndClose = () => {
    setChurchName("");
    setPastorName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setResult(null);
    setError("");
    onClose();
  };

  return (
    <div className="prov-modal-overlay" onClick={handleResetAndClose}>
      <div className="prov-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="prov-modal-header">
          <div className="prov-modal-title-group">
            <div className="prov-modal-icon-badge">
              <Sparkles size={22} className="text-amber-400" />
            </div>
            <div>
              <h2 className="prov-modal-title">Provision New Church Tenant</h2>
              <small className="prov-modal-subtitle">
                Create a clean, isolated EPIC CMS environment for a client church
              </small>
            </div>
          </div>
          <button
            type="button"
            className="prov-modal-close-btn"
            onClick={handleResetAndClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="prov-modal-body">
          {error && (
            <div className="prov-alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <form onSubmit={handleProvision} className="prov-form">
              <div className="prov-info-callout">
                <ShieldCheck size={18} className="text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Tenant Isolation Guarantee:</strong> This new church will have its own
                  dedicated <code>CustomerId</code>. Your existing church data remains 100% untouched
                  and separated. The new pastor will receive the First-Time Setup Wizard on first login.
                </span>
              </div>

              <div className="prov-form-grid">
                <div className="prov-field full-width">
                  <label>
                    <Church size={15} /> Church Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="e.g. Christ Fellowship Church"
                    required
                  />
                </div>

                <div className="prov-field">
                  <label>
                    <User size={15} /> Pastor / Lead Admin Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={pastorName}
                    onChange={(e) => setPastorName(e.target.value)}
                    placeholder="e.g. Pastor Michael Vance"
                    required
                  />
                </div>

                <div className="prov-field">
                  <label>
                    <Phone size={15} /> Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +63 917 555 1234"
                  />
                </div>

                <div className="prov-field">
                  <label>
                    <Mail size={15} /> Admin Email (Login Username) <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pastor@church.org"
                    required
                  />
                </div>

                <div className="prov-field">
                  <label>
                    <Lock size={15} /> Initial Password <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. Church2026!"
                    required
                  />
                  <small>They can change this password after logging in.</small>
                </div>
              </div>

              <div className="prov-actions">
                <button
                  type="button"
                  className="prov-btn-cancel"
                  onClick={handleResetAndClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="prov-btn-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin" /> Provisioning Environment...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Create & Provision Church
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="prov-success-view">
              <div className="prov-success-icon-badge">
                <CheckCircle2 size={44} className="text-emerald-400" />
              </div>
              <h3>Church Tenant Provisioned!</h3>
              <p className="prov-success-desc">
                <strong>{result.churchName}</strong> has been successfully registered under{" "}
                <strong>Tenant #{result.customerId}</strong>.
              </p>

              <div className="prov-credentials-card">
                <div className="prov-cred-row">
                  <span>Customer ID:</span>
                  <strong>#{result.customerId}</strong>
                </div>
                <div className="prov-cred-row">
                  <span>Admin Email:</span>
                  <code>{result.adminEmail}</code>
                </div>
                <div className="prov-cred-row">
                  <span>Password:</span>
                  <code>{result.temporaryPassword}</code>
                </div>
                <div className="prov-cred-row">
                  <span>Setup Status:</span>
                  <span className="prov-status-tag">First-Time Setup Pending</span>
                </div>
              </div>

              <div className="prov-wizard-notice">
                <span>
                  💡 When this church signs in with these credentials, the system will
                  automatically display the <strong>3-Step Setup Wizard</strong> to configure their
                  service schedule and ministries.
                </span>
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginTop: "14px",
                  fontSize: "13px",
                  color: "#166534",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  lineHeight: "1.4",
                  textAlign: "left"
                }}
              >
                <Mail size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
                <span>
                  <strong>Confirmation Email Sent:</strong> An official welcome email containing the direct{" "}
                  <strong>First-Time Church Setup Wizard link</strong> and credentials has been dispatched to{" "}
                  <code>{result.adminEmail}</code>.
                </span>
              </div>

              <div className="prov-success-actions">
                <button
                  type="button"
                  className="prov-btn-copy"
                  onClick={handleCopyCredentials}
                >
                  {copied ? (
                    <>
                      <Check size={16} /> Credentials Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy Credentials to Clipboard
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="prov-btn-done"
                  onClick={handleResetAndClose}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

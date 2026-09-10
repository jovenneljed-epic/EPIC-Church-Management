import React, { useState } from "react";
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import "./AdminAuthModal.css";

interface AdminAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (username: string, password: string) => Promise<boolean>;
    error?: string;
    loading?: boolean;
    title?: string;
    description?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    error = "",
    loading = false,
    title = "EPIC Administrator Verification",
    description = "Only authorized church administrators and pastors can access moderation tools to delete content, upholding our fellowship's positive and Christ-centered culture."
}) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onSubmit(username, password);
        if (success) {
            setUsername("");
            setPassword("");
        }
    };

    return (
        <div className="comm-modal-overlay" onClick={onClose}>
            <div className="comm-modal-card admin-auth-card" onClick={(e) => e.stopPropagation()}>
                <div className="comm-modal-header admin-auth-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="admin-auth-icon-badge">
                            <KeyRound size={22} color="#fbbf24" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#fef08a" }}>
                                {title}
                            </h2>
                            <small style={{ color: "#94a3b8" }}>
                                EPIC CMS Authentication Required
                            </small>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="comm-modal-close-btn"
                        onClick={onClose}
                        title="Cancel Verification"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="admin-auth-form">
                    <div className="admin-auth-notice-box">
                        <ShieldCheck size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{description}</span>
                    </div>

                    {error && (
                        <div className="admin-auth-error-alert">
                            <AlertCircle size={15} style={{ flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="comm-form-group">
                        <label>Admin Username or Email</label>
                        <input
                            type="text"
                            required
                            placeholder="Enter your admin username..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="comm-form-group">
                        <label>Password or Admin Passkey</label>
                        <input
                            type="password"
                            required
                            placeholder="Enter password or security key (e.g. epic2026)..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <small style={{ color: "#64748b", marginTop: 4, display: "block" }}>
                            Tip: You can use your EPIC CMS administrator credentials or the church master security key.
                        </small>
                    </div>

                    <div className="admin-auth-footer-actions">
                        <button
                            type="button"
                            className="admin-auth-cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="admin-auth-submit-btn"
                        >
                            {loading ? "Verifying..." : "🔐 Verify & Enter Admin Mode"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const AdminToast: React.FC<{ message: string }> = ({ message }) => {
    if (!message) return null;
    return (
        <div className="community-admin-toast">
            <CheckCircle2 size={17} color="#34d399" style={{ flexShrink: 0 }} />
            <span>{message}</span>
        </div>
    );
};

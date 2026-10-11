import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import "./ChurchPermissionsModal.css";

interface ChurchPermissionsModalProps {
  customerId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

interface SubscriberPermissionsResponse {
  customerId: number;
  churchName: string;
  planName: string;
  hasCustomOverrides: boolean;
  maxUsersOverride: number | null;
  maxMembersOverride: number | null;
  defaultMaxUsers: number;
  defaultMaxMembers: number;
  allAvailableModules: string[];
  planDefaultModules: string[];
  activeAllowedModules: string[];
}

const MODULE_ICONS: Record<string, string> = {
  "Dashboard": "▦",
  "Church Services": "⛪",
  "Members": "♟",
  "Visitors": "👤",
  "Attendance": "✓",
  "SMILE Face Scanner": "😊",
  "Ministries": "♫",
  "Church in Action": "⚡",
  "Giving": "₱",
  "Income": "↗",
  "Expenses": "−",
  "Event Management": "🎯",
  "Events": "🎯",
  "EPIC Learning": "📚",
  "Reports": "📊",
  "Member Attendance Report": "📊",
  "Settings": "⚙"
};

export const ChurchPermissionsModal: React.FC<ChurchPermissionsModalProps> = ({
  customerId,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [data, setData] = useState<SubscriberPermissionsResponse | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [maxUsersOverride, setMaxUsersOverride] = useState<string>("");
  const [maxMembersOverride, setMaxMembersOverride] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !customerId) {
      setData(null);
      return;
    }

    const fetchPermissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const res = await axios.get(
          `${API_BASE_URL}/Customers/${customerId}/subscriber-permissions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setData(res.data);
        setSelectedModules(res.data.activeAllowedModules || []);
        setMaxUsersOverride(
          res.data.maxUsersOverride !== null ? String(res.data.maxUsersOverride) : ""
        );
        setMaxMembersOverride(
          res.data.maxMembersOverride !== null ? String(res.data.maxMembersOverride) : ""
        );
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load church subscriber permissions."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [isOpen, customerId]);

  if (!isOpen || !customerId) return null;

  const toggleModule = (mod: string) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const selectAll = () => {
    if (data?.allAvailableModules) {
      setSelectedModules([...data.allAvailableModules]);
    }
  };

  const selectPlanDefaults = () => {
    if (data?.planDefaultModules) {
      setSelectedModules([...data.planDefaultModules]);
    }
  };

  const handleSave = async (resetToDefaults = false) => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const body = {
        allowedModules: resetToDefaults ? null : selectedModules,
        resetToPlanDefaults: resetToDefaults,
        maxUsersOverride:
          maxUsersOverride.trim() !== "" ? parseInt(maxUsersOverride, 10) : null,
        maxMembersOverride:
          maxMembersOverride.trim() !== "" ? parseInt(maxMembersOverride, 10) : null,
      };

      await axios.put(
        `${API_BASE_URL}/Customers/${customerId}/subscriber-permissions`,
        body,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to save permissions."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="church-perm-overlay" onClick={onClose}>
      <div className="church-perm-card" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="church-perm-header">
          <div className="church-perm-title-group">
            <div className="church-perm-icon-badge">🔑</div>
            <div>
              <h2 className="church-perm-title">
                {data ? data.churchName : "Church Permissions"}
              </h2>
              <span className="church-perm-subtitle">
                <span>Tenant ID #{customerId}</span>
                <span>•</span>
                <span>Master Security & Module Control</span>
              </span>
            </div>
          </div>
          <button className="church-perm-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="church-perm-body">
          {error && <div className="epic-alert epic-alert-danger">{error}</div>}

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
              Loading permissions...
            </div>
          ) : data ? (
            <>
              {/* PLAN STATUS ROW */}
              <div className="church-perm-badge-row">
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className="church-perm-plan-tag">
                    🛡️ Plan: {data.planName}
                  </span>
                  {data.hasCustomOverrides ? (
                    <span className="church-perm-override-tag">
                      ⚡ Developer Overrides Active
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                      ✓ Inheriting Plan Defaults
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="church-perm-reset-btn"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  title="Remove all custom overrides and revert to plan defaults"
                >
                  ↺ Reset to Plan Defaults
                </button>
              </div>

              {/* MODULE ACCESS MATRIX */}
              <div>
                <div className="church-perm-section-title">
                  <span>Accessible Features & Modules ({selectedModules.length})</span>
                  <div className="church-perm-quick-actions">
                    <button
                      type="button"
                      className="church-perm-quick-btn"
                      onClick={selectPlanDefaults}
                    >
                      Plan Defaults
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      className="church-perm-quick-btn"
                      onClick={selectAll}
                    >
                      Select All
                    </button>
                  </div>
                </div>

                <div className="church-perm-modules-grid">
                  {data.allAvailableModules.map((mod) => {
                    const isSelected = selectedModules.includes(mod);
                    const isPlanDefault = data.planDefaultModules.includes(mod);
                    const icon = MODULE_ICONS[mod] || "◈";

                    return (
                      <div
                        key={mod}
                        className={`church-perm-module-card ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleModule(mod)}
                      >
                        <div className="church-perm-module-info">
                          <span className="church-perm-module-icon">{icon}</span>
                          <div>
                            <div className="church-perm-module-name">{mod}</div>
                            {isPlanDefault && (
                              <div style={{ fontSize: "0.68rem", color: "#60a5fa" }}>
                                Included in {data.planName}
                              </div>
                            )}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="church-perm-checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEAT & CAPACITY QUOTAS */}
              <div>
                <div className="church-perm-section-title">
                  <span>Seat & Capacity Quotas (Developer Override)</span>
                </div>
                <div className="church-perm-quotas-row">
                  <div className="church-perm-input-group">
                    <label>
                      User Staff Seats (Plan Default: {data.defaultMaxUsers})
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder={`Default (${data.defaultMaxUsers})`}
                      value={maxUsersOverride}
                      onChange={(e) => setMaxUsersOverride(e.target.value)}
                    />
                  </div>

                  <div className="church-perm-input-group">
                    <label>
                      Member Directory Limit (Plan Default: {data.defaultMaxMembers})
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder={`Default (${data.defaultMaxMembers})`}
                      value={maxMembersOverride}
                      onChange={(e) => setMaxMembersOverride(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* FOOTER */}
        <div className="church-perm-footer">
          <button
            type="button"
            className="church-perm-cancel-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="church-perm-save-btn"
            onClick={() => handleSave(false)}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : "💾 Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
};

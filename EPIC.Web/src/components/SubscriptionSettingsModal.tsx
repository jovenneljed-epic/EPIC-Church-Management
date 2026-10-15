import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import "./SubscriptionSettingsModal.css";

export interface ChurchSubscriber {
  customerId: number;
  churchName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  status: string;
  isSetupCompleted: boolean;
  createdDate: string;
  customAllowedModules?: string | null;
  maxUsersOverride?: number | null;
  maxMembersOverride?: number | null;
  subscriptionId?: number | null;
  planId?: number | null;
  planName?: string;
  billingCycle?: string;
  subscriptionStatus?: string;
  nextBillingDate?: string | null;
  trialEndsAt?: string | null;
  notes?: string | null;
  amount?: number | null;
  userCount: number;
  maxUsers: number;
  memberCount: number;
  maxMembers: number;
  isLocked?: boolean;
  isExpiringSoon?: boolean;
  daysUntilExpiration?: number | null;
}

interface SubscriptionSettingsModalProps {
  subscriber: ChurchSubscriber | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

interface AvailablePlan {
  subscriptionPlanId: number;
  planName: string;
  monthlyPrice: number;
  annualPrice: number;
  description?: string;
}

export const SubscriptionSettingsModal: React.FC<SubscriptionSettingsModalProps> = ({
  subscriber,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [plans, setPlans] = useState<AvailablePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [amount, setAmount] = useState<string>("999");
  const [billingCycle, setBillingCycle] = useState<string>("Monthly");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [nextBillingDate, setNextBillingDate] = useState<string>("");
  const [trialEndsAt, setTrialEndsAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load available plans
  useEffect(() => {
    if (!isOpen) return;

    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const res = await axios.get(`${API_BASE_URL}/SubscriptionPlans`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (Array.isArray(res.data)) {
          setPlans(res.data);
        }
      } catch (err) {
        console.warn("Could not load plans from API, using defaults", err);
      }
    };

    fetchPlans();
  }, [isOpen]);

  // Sync state when subscriber changes
  useEffect(() => {
    if (!subscriber || !isOpen) return;

    setError(null);
    setSuccessMsg(null);
    setSelectedPlanId(subscriber.planId || 1);
    setAmount(subscriber.amount !== undefined && subscriber.amount !== null ? String(subscriber.amount) : "999");
    setBillingCycle(subscriber.billingCycle || "Monthly");
    setStatus(subscriber.subscriptionStatus || "ACTIVE");
    setNotes(subscriber.notes || "");

    // Format Next Billing Date as YYYY-MM-DD
    if (subscriber.nextBillingDate) {
      try {
        const d = new Date(subscriber.nextBillingDate);
        if (!isNaN(d.getTime())) {
          setNextBillingDate(d.toISOString().split("T")[0]);
        } else {
          setNextBillingDate("");
        }
      } catch {
        setNextBillingDate("");
      }
    } else {
      // Default to 30 days from now
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setNextBillingDate(d.toISOString().split("T")[0]);
    }

    // Format Trial Ends At as YYYY-MM-DD
    if (subscriber.trialEndsAt) {
      try {
        const d = new Date(subscriber.trialEndsAt);
        if (!isNaN(d.getTime())) {
          setTrialEndsAt(d.toISOString().split("T")[0]);
        } else {
          setTrialEndsAt("");
        }
      } catch {
        setTrialEndsAt("");
      }
    } else {
      setTrialEndsAt("");
    }
  }, [subscriber, isOpen]);

  if (!isOpen || !subscriber) return null;

  // Quick Date Extension Helpers
  const extendDateByDays = (days: number) => {
    const base = nextBillingDate ? new Date(nextBillingDate) : new Date();
    const target = isNaN(base.getTime()) ? new Date() : base;
    target.setDate(target.getDate() + days);
    setNextBillingDate(target.toISOString().split("T")[0]);
  };

  const extendDateByMonths = (months: number) => {
    const base = nextBillingDate ? new Date(nextBillingDate) : new Date();
    const target = isNaN(base.getTime()) ? new Date() : base;
    target.setMonth(target.getMonth() + months);
    setNextBillingDate(target.toISOString().split("T")[0]);
  };

  const setEndOfMonth = () => {
    const d = new Date();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setNextBillingDate(end.toISOString().split("T")[0]);
  };

  const handlePlanChange = (planIdNum: number) => {
    setSelectedPlanId(planIdNum);
    const chosenPlan = plans.find((p) => p.subscriptionPlanId === planIdNum);
    if (chosenPlan) {
      const price = billingCycle.toLowerCase() === "annual" ? chosenPlan.annualPrice : chosenPlan.monthlyPrice;
      setAmount(String(price));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const parsedAmount = parseFloat(amount);

      const payload = {
        subscriptionPlanId: selectedPlanId,
        status: status.trim().toUpperCase(),
        billingCycle: billingCycle.trim(),
        amount: isNaN(parsedAmount) ? 999 : parsedAmount,
        nextBillingDate: nextBillingDate ? new Date(nextBillingDate).toISOString() : null,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
        notes: notes.trim(),
      };

      await axios.put(
        `${API_BASE_URL}/Customers/${subscriber.customerId}/subscription-settings`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMsg("Subscription settings saved successfully!");
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Failed to save subscription settings", err);
      setError(
        err.response?.data?.message || "Failed to update subscription settings. Please check your inputs."
      );
    } finally {
      setSaving(false);
    }
  };

  const isCurrentlyLocked = status === "EXPIRED" || status === "SUSPENDED" || status === "PAST_DUE" || status === "CANCELLED";

  return (
    <div className="sub-settings-overlay" onClick={onClose}>
      <div className="sub-settings-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sub-settings-header">
          <div className="sub-settings-header-info">
            <div className="sub-settings-tag">
              <span>⛪ Workspace #{subscriber.customerId}</span>
              <span className={`status-pill ${isCurrentlyLocked ? "locked" : "active"}`}>
                {isCurrentlyLocked ? "🔒 Locked / " + status : "✓ Active"}
              </span>
            </div>
            <h2>Subscription & Expiration Settings</h2>
            <p className="sub-settings-church-name">{subscriber.churchName}</p>
          </div>
          <button type="button" className="sub-settings-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="sub-settings-alert error">{error}</div>}
        {successMsg && <div className="sub-settings-alert success">{successMsg}</div>}

        <form onSubmit={handleSave} className="sub-settings-body">
          {/* Plan & Pricing */}
          <div className="sub-settings-grid">
            <div className="form-group">
              <label>Subscription Plan</label>
              <select
                value={selectedPlanId}
                onChange={(e) => handlePlanChange(Number(e.target.value))}
                className="sub-settings-input"
              >
                {plans.length > 0 ? (
                  plans.map((p) => (
                    <option key={p.subscriptionPlanId} value={p.subscriptionPlanId}>
                      {p.planName} (₱{p.monthlyPrice.toLocaleString()}/mo)
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>EPIC Starter (₱999/mo)</option>
                    <option value={2}>EPIC Growth (₱1,999/mo)</option>
                    <option value={3}>EPIC Complete (₱2,999/mo)</option>
                    <option value={4}>Custom Scalable Monthly</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="sub-settings-input"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly (3 Mos)</option>
                <option value="Semi-Annual">Semi-Annual (6 Mos)</option>
                <option value="Annual">Annual (1 Year)</option>
                <option value="Lifetime">Lifetime Access</option>
              </select>
            </div>
          </div>

          <div className="sub-settings-grid">
            <div className="form-group">
              <label>Monthly Rate / Price (₱ PHP)</label>
              <div className="input-with-prefix">
                <span className="input-prefix">₱</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="sub-settings-input"
                  placeholder="999.00"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Workspace Status & Lockout</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`sub-settings-input status-select ${isCurrentlyLocked ? "status-locked" : "status-active"}`}
              >
                <option value="ACTIVE">✓ ACTIVE (Workspace Unlocked)</option>
                <option value="TRIAL">⏳ TRIAL (Evaluation Period)</option>
                <option value="PAST_DUE">⚠️ PAST_DUE (Payment Due Soon)</option>
                <option value="EXPIRED">🔒 EXPIRED (Account Locked)</option>
                <option value="SUSPENDED">🚫 SUSPENDED (Manually Locked)</option>
                <option value="CANCELLED">❌ CANCELLED (Terminated)</option>
              </select>
            </div>
          </div>

          {/* Scalable Expiration Date Picker & Presets */}
          <div className="sub-settings-section">
            <div className="section-title-row">
              <label className="section-title">📅 Custom Expiration / Next Billing Date</label>
              <span className="section-subtitle">Set exact renewal deadline according to your will</span>
            </div>

            <div className="date-picker-row">
              <input
                type="date"
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                className="sub-settings-input date-input"
                required
              />

              {nextBillingDate && (
                <div className="selected-date-preview">
                  Next due on:{" "}
                  <strong>
                    {new Date(nextBillingDate).toLocaleDateString("en-PH", {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </strong>
                </div>
              )}
            </div>

            {/* Quick Extension Buttons */}
            <div className="extension-buttons-title">Quick Date Presets / Extension:</div>
            <div className="extension-buttons-grid">
              <button type="button" className="ext-btn" onClick={() => extendDateByDays(7)}>
                +7 Days
              </button>
              <button type="button" className="ext-btn" onClick={() => extendDateByDays(15)}>
                +15 Days
              </button>
              <button type="button" className="ext-btn highlighted" onClick={() => extendDateByDays(30)}>
                +30 Days (1 Mo)
              </button>
              <button type="button" className="ext-btn" onClick={() => extendDateByMonths(2)}>
                +2 Months
              </button>
              <button type="button" className="ext-btn" onClick={() => extendDateByMonths(3)}>
                +3 Months
              </button>
              <button type="button" className="ext-btn" onClick={() => extendDateByMonths(12)}>
                +1 Year
              </button>
              <button type="button" className="ext-btn" onClick={setEndOfMonth}>
                End of Month
              </button>
            </div>
          </div>

          {/* Trial Ends At if TRIAL */}
          {status === "TRIAL" && (
            <div className="form-group" style={{ marginTop: "12px" }}>
              <label>Trial End Date</label>
              <input
                type="date"
                value={trialEndsAt}
                onChange={(e) => setTrialEndsAt(e.target.value)}
                className="sub-settings-input"
              />
            </div>
          )}

          {/* Admin Notes */}
          <div className="form-group" style={{ marginTop: "14px" }}>
            <label>Admin Billing Memo / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Payment received via GCash ref #123456789. Grace period approved by admin."
              className="sub-settings-input textarea"
            />
          </div>

          {/* Footer Actions */}
          <div className="sub-settings-footer">
            <button
              type="button"
              className="sub-settings-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="sub-settings-btn-primary"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "💾 Save Subscription Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

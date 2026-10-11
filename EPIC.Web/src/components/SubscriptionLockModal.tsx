import React from "react";
import {
  Lock,
  ShieldAlert,
  CreditCard,
  Calendar,
  LogOut,
  ArrowRight,
  Church,
  AlertTriangle,
} from "lucide-react";
import "./SubscriptionLockModal.css";

interface SubscriptionLockModalProps {
  isOpen: boolean;
  churchName: string;
  customerId?: number | null;
  lockReason?: string;
  planName?: string;
  amount?: number | null;
  nextBillingDate?: string | null;
  subscriptionId?: number | null;
  onSignOut: () => void;
  onGoToPayment: () => void;
}

export const SubscriptionLockModal: React.FC<SubscriptionLockModalProps> = ({
  isOpen,
  churchName,
  customerId,
  lockReason = "Your church workspace subscription billing cycle has concluded.",
  planName = "Monthly Subscription",
  amount,
  nextBillingDate,
  onSignOut,
  onGoToPayment,
}) => {
  if (!isOpen) return null;

  const formattedDueDate = nextBillingDate
    ? new Date(nextBillingDate).toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Due Date Reached";

  return (
    <div className="sub-lock-overlay">
      <div className="sub-lock-card">
        {/* Header Badge */}
        <div className="sub-lock-header">
          <div className="sub-lock-icon-container">
            <Lock size={36} className="text-amber-400" />
            <div className="sub-lock-badge-pulse" />
          </div>

          <div className="sub-lock-tag">
            <ShieldAlert size={14} /> Subscription Renewal Required
          </div>

          <h2 className="sub-lock-title">Workspace Access Paused</h2>

          <p className="sub-lock-desc">
            {lockReason}
          </p>
        </div>

        {/* Subscription Meta Card */}
        <div className="sub-lock-details">
          <div className="sub-lock-meta-row">
            <span className="sub-lock-label">
              <Church size={15} /> Church Tenant
            </span>
            <strong className="sub-lock-val">
              {churchName} {customerId ? `(#${customerId})` : ""}
            </strong>
          </div>

          <div className="sub-lock-meta-row">
            <span className="sub-lock-label">
              <CreditCard size={15} /> Subscription Plan
            </span>
            <strong className="sub-lock-val">
              {planName} {amount ? `• ₱${amount.toLocaleString()}/mo` : ""}
            </strong>
          </div>

          <div className="sub-lock-meta-row">
            <span className="sub-lock-label">
              <Calendar size={15} /> Billing Due Date
            </span>
            <strong className="sub-lock-val text-amber-400">
              {formattedDueDate}
            </strong>
          </div>
        </div>

        {/* Instructions Callout */}
        <div className="sub-lock-info-box">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
          <span>
            To restore full access to EPIC Smile Scanner, church attendance rosters,
            and member management, please submit your monthly subscription payment
            or contact KEZJED SOLUTIONS.
          </span>
        </div>

        {/* Actions */}
        <div className="sub-lock-actions">
          <button
            type="button"
            className="sub-lock-btn sub-lock-btn-pay"
            onClick={onGoToPayment}
          >
            <CreditCard size={18} /> Submit Payment / Proof <ArrowRight size={16} />
          </button>

          <button
            type="button"
            className="sub-lock-btn sub-lock-btn-logout"
            onClick={onSignOut}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

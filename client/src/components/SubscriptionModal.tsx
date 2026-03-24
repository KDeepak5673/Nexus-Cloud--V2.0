"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import "../styles/SubscriptionModal.css";

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
};

interface SubscriptionModalProps {
  plan: Plan | null;
  onClose: () => void;
  onConfirm: (plan: Plan) => void;
}

export function SubscriptionModal({ plan, onClose, onConfirm }: SubscriptionModalProps) {
  const [selectedPayment, setSelectedPayment] = useState<string>("card");

  if (!plan) return null;

  const price = parseFloat(plan.price);
  const tax = price * 0.18;
  const total = price + tax;

  const handlePayNow = () => {
    onConfirm(plan);
    onClose();
  };

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div className="subscription-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="subscription-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="subscription-modal-header">
          <h2>Confirm plan changes</h2>
        </div>

        {/* Plan Name */}
        <div className="subscription-plan-name">
          {plan.name}
        </div>

        {/* Billing Info */}
        <p className="subscription-billing-info">Billed monthly, starting today</p>

        {/* What's Included */}
        <div className="subscription-included-section">
          <h3>What's included:</h3>
          <ul className="subscription-features-list">
            {plan.features.slice(0, 4).map((feature, index) => (
              <li key={index} className="subscription-feature-item">
                <Check size={18} className="feature-check" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Payment Method */}
        <div className="subscription-payment-section">
          <h3>Payment method</h3>
          <div className="payment-method-options">
            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={selectedPayment === "card"}
                onChange={(e) => setSelectedPayment(e.target.value)}
              />
              <span>Credit/Debit Card</span>
            </label>
            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                value="upi"
                checked={selectedPayment === "upi"}
                onChange={(e) => setSelectedPayment(e.target.value)}
              />
              <span>UPI</span>
            </label>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="subscription-price-breakdown">
          <div className="price-row">
            <span>Subtotal</span>
            <span>${price.toFixed(2)}</span>
          </div>
          <div className="price-row">
            <span>Tax 18%</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="price-row total">
            <span>Total due today</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="subscription-modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-pay-now" onClick={handlePayNow}>
            Pay now
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionModal;

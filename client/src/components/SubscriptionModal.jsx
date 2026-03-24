import React, { useState } from 'react';
import { X } from 'lucide-react';
import '../styles/SubscriptionModal.css';

function SubscriptionModal({ plan, onClose, onConfirm }) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!plan) return null;

  // Calculate pricing with 18% tax
  const subtotal = parseInt(plan.price);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const handlePayNow = async () => {
    setIsProcessing(true);
    try {
      // Call onConfirm callback (integrate with your payment gateway)
      if (onConfirm) {
        await onConfirm(plan);
      }
      // You can integrate with Stripe, Razorpay, or other payment providers here
      console.log(`Processing payment for ${plan.name}:`, { subtotal, tax, total });
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div className="subscription-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Confirm plan changes</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Plan Details */}
        <div className="modal-plan-section">
          <div className="plan-name">{plan.name} subscription</div>
          <div className="plan-price-display">₹{subtotal}</div>
          <div className="plan-billing">Billed monthly, starting today</div>
        </div>

        {/* Features Preview */}
        <div className="modal-features-section">
          <h3>What's included:</h3>
          <ul className="features-list">
            {plan.features.map((feature, index) => (
              <li key={index} className="feature-item">
                <span className="feature-checkmark">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price Breakdown */}
        <div className="modal-pricing-breakdown">
          <div className="breakdown-row">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="breakdown-row">
            <span>Tax 18%</span>
            <span>₹{tax}</span>
          </div>
          <div className="breakdown-row total">
            <span>Total due today</span>
            <span>₹{total}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className="btn-pay-now"
            onClick={handlePayNow}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Pay now'}
          </button>
        </div>

        {/* Security Note */}
        <div className="modal-footer">
          <p>🔒 Your payment is secure and encrypted</p>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionModal;

import React from 'react'
import '../styles/PaymentBlockDialog.css'

function PaymentBlockDialog({ open, title, message, onClose, onPay }) {
    if (!open) return null

    return (
        <div className="payment-block-overlay" role="dialog" aria-modal="true" aria-labelledby="payment-block-title">
            <div className="payment-block-card">
                <h2 id="payment-block-title">{title}</h2>
                <p>{message}</p>
                <div className="payment-block-actions">
                    <button className="btn btn-outline" onClick={onClose}>Close</button>
                    <button className="btn btn-primary" onClick={onPay}>Pay now</button>
                </div>
            </div>
        </div>
    )
}

export default PaymentBlockDialog

import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../auth/AuthContext'
import {
    getBillingSummary,
    getBillingTimeseries,
    getBillingProjectUsage,
    getBillingInvoices,
    getBillingInvoiceDetails,
    getBillingPricing,
    getBillingAdjustments,
    createBillingAdjustment,
    createRazorpayOrder,
    verifyRazorpayPayment
} from '../lib/api'
import '../styles/BillingPage.css'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9000'

function loadRazorpaySdk() {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true)
            return
        }

        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })
}

function formatUsd(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0))
}

function formatEgress(egressMb) {
    const value = Number(egressMb || 0)
    if (value < 1024) {
        return `${value.toFixed(4)} MB`
    }

    return `${(value / 1024).toFixed(2)} GB`
}

function MetricCard({ title, value, subtitle }) {
    return (
        <div className="billing-metric-card">
            <p className="billing-metric-title">{title}</p>
            <h3>{value}</h3>
            <p className="billing-metric-subtitle">{subtitle}</p>
        </div>
    )
}

function BillingPage() {
    const { user } = useAuth()
    const billingSocketRef = useRef(null)
    const [summary, setSummary] = useState(null)
    const [timeseries, setTimeseries] = useState([])
    const [projectRows, setProjectRows] = useState([])
    const [invoices, setInvoices] = useState([])
    const [pricing, setPricing] = useState([])
    const [adjustments, setAdjustments] = useState([])
    const [adjustmentBlocked, setAdjustmentBlocked] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState(null)
    const [adjustmentForm, setAdjustmentForm] = useState({
        metricType: 'BUILD_MINUTES',
        amountUsd: '',
        reason: ''
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const trendData = useMemo(() => (
        timeseries.reduce((acc, row) => {
            const key = new Date(row.bucketDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const existing = acc.find((x) => x.date === key)
            if (existing) {
                existing.cost += Number(row.costUsd)
            } else {
                acc.push({ date: key, cost: Number(row.costUsd) })
            }
            return acc
        }, [])
    ), [timeseries])

    const loadData = async () => {
        try {
            setLoading(true)
            setError('')

            const [summaryRes, timeseriesRes, projectsRes, invoicesRes] = await Promise.all([
                getBillingSummary(),
                getBillingTimeseries(30),
                getBillingProjectUsage(),
                getBillingInvoices()
            ])

            const [pricingRes, adjustmentsRes] = await Promise.all([
                getBillingPricing(),
                getBillingAdjustments()
            ])

            if (summaryRes.status === 'success') setSummary(summaryRes.data)
            if (timeseriesRes.status === 'success') setTimeseries(timeseriesRes.data.rows)
            if (projectsRes.status === 'success') setProjectRows(projectsRes.data.rows)
            if (invoicesRes.status === 'success') setInvoices(invoicesRes.data.invoices)
            if (pricingRes.status === 'success') setPricing(pricingRes.data.pricing)

            if (adjustmentsRes.status === 'success') {
                setAdjustments(adjustmentsRes.data.adjustments)
                setAdjustmentBlocked(false)
            } else if (adjustmentsRes?.message?.toLowerCase?.().includes('permissions') || adjustmentsRes?.statusCode === 403) {
                setAdjustmentBlocked(true)
            }
        } catch (err) {
            console.error(err)
            setError('Failed to load billing data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (!user?.uid) return

        if (billingSocketRef.current) {
            return
        }

        console.log('Mounting billing socket...')
        const socket = io(API_BASE, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000
        })
        billingSocketRef.current = socket

        socket.on('connect', () => {
            console.log('Billing socket connected:', socket.id)
            socket.emit('subscribe-billing', { firebaseUid: user.uid })
        })

        socket.on('billing-update', (payload) => {
            setSummary(payload)
        })

        socket.on('connect_error', (err) => {
            console.error('Billing socket connect error:', err.message)
        })

        return () => {
            if (billingSocketRef.current) {
                billingSocketRef.current.disconnect()
                billingSocketRef.current = null
            }
        }
    }, [user?.uid])

    const handleUpgrade = async () => {
        const sdkLoaded = await loadRazorpaySdk()
        if (!sdkLoaded) {
            setError('Razorpay SDK failed to load.')
            return
        }

        const orderRes = await createRazorpayOrder({
            originUrl: window.location.origin
        })

        if (orderRes?.status !== 'success') {
            setError(orderRes?.message || 'Unable to create Razorpay order.')
            return
        }

        const order = orderRes.data.order
        const options = {
            key: orderRes.data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Nexus Cloud',
            description: 'Billing payment',
            order_id: order.id,
            handler: async function (response) {
                const verifyRes = await verifyRazorpayPayment(response)
                if (verifyRes?.status === 'success') {
                    await loadData()
                } else {
                    setError('Payment verification failed. Contact support if amount was debited.')
                }
            },
            prefill: {
                email: user?.email || ''
            },
            theme: {
                color: '#00795b'
            }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
    }

    const openInvoiceDetails = async (invoiceId) => {
        const detailsRes = await getBillingInvoiceDetails(invoiceId)
        if (detailsRes?.status === 'success') {
            setSelectedInvoice(detailsRes.data.invoice)
            setSelectedInvoiceDetails(detailsRes.data.invoice.lineItems || [])
        }
    }

    const submitAdjustment = async (event) => {
        event.preventDefault()
        const payload = {
            metricType: adjustmentForm.metricType,
            amountUsd: Number(adjustmentForm.amountUsd),
            reason: adjustmentForm.reason
        }

        const response = await createBillingAdjustment(payload)
        if (response?.status === 'success') {
            setAdjustmentForm({ metricType: 'BUILD_MINUTES', amountUsd: '', reason: '' })
            await loadData()
        } else {
            setError(response?.message || 'Failed to create adjustment')
        }
    }

    if (loading) {
        return <div className="billing-shell"><p>Loading billing dashboard...</p></div>
    }

    if (error) {
        return <div className="billing-shell"><p className="billing-error">{error}</p></div>
    }

    const alerts = summary?.alerts || []

    return (
        <div className="billing-shell">
            <section className="billing-header">
                <div>
                    <h1>Billing</h1>
                    <p>Track usage, forecast spend, and manage invoices.</p>
                </div>
                <button onClick={handleUpgrade} className="billing-upgrade-btn">Manage Billing</button>
            </section>

            <section className="billing-grid">
                <MetricCard
                    title="Month-to-date build minutes"
                    value={Math.round(summary?.usage?.buildMinutes || 0)}
                    subtitle={`Cycle starts ${new Date(summary?.cycle?.start).toLocaleDateString()}`}
                />
                <MetricCard
                    title="Month-to-date egress"
                    value={formatEgress(summary?.usage?.egressMb)}
                    subtitle="Measured at proxy edge"
                />
                <MetricCard
                    title="Current estimated cost"
                    value={formatUsd(summary?.costs?.subtotalUsd || 0)}
                    subtitle={`Forecast ${formatUsd(summary?.costs?.estimatedMonthEndUsd || 0)} this cycle`}
                />
            </section>

            <section className="billing-chart-card">
                <h2>Daily Spend Trend</h2>
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="billCost" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00a97f" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#00a97f" stopOpacity={0.03} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d4e6df" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(v) => formatUsd(v)} />
                        <Area dataKey="cost" stroke="#00795b" fill="url(#billCost)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </section>

            <section className="billing-table-card">
                <h2>Pricing Catalog</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Included Units</th>
                            <th>Unit Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pricing.length === 0 && (
                            <tr><td colSpan="3">Pricing data unavailable.</td></tr>
                        )}
                        {pricing.map((row) => (
                            <tr key={row.metricType}>
                                <td>{row.metricType}</td>
                                <td>{Number(row.includedUnits).toFixed(2)}</td>
                                <td>{formatUsd(row.unitPriceUsd)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="billing-panels">
                <div className="billing-table-card">
                    <h2>Project Usage Breakdown</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Build Minutes</th>
                                <th>Egress (GB)</th>
                                <th>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectRows.length === 0 && (
                                <tr><td colSpan="4">No usage yet this cycle.</td></tr>
                            )}
                            {projectRows.map((row) => (
                                <tr key={row.projectId || row.projectName}>
                                    <td>{row.projectName}</td>
                                    <td>{Math.round(row.buildMinutes)}</td>
                                    <td>{(row.egressMb / 1024).toFixed(2)}</td>
                                    <td>{formatUsd(row.costUsd)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="billing-table-card">
                    <h2>Invoice History</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Status</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 && (
                                <tr><td colSpan="3">No invoices generated yet.</td></tr>
                            )}
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="invoice-row-clickable" onClick={() => openInvoiceDetails(invoice.id)}>
                                    <td>
                                        {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                                    </td>
                                    <td>{invoice.status}</td>
                                    <td>{formatUsd(invoice.totalUsd)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="billing-panels">
                <div className="billing-table-card">
                    <h2>Invoice Details</h2>
                    {!selectedInvoice && <p>Select an invoice row to view line items.</p>}
                    {selectedInvoice && (
                        <>
                            <p><strong>Invoice:</strong> {selectedInvoice.id}</p>
                            <p><strong>Status:</strong> {selectedInvoice.status}</p>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Qty</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInvoiceDetails?.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.description}</td>
                                            <td>{Number(item.quantity).toFixed(2)}</td>
                                            <td>{formatUsd(item.amountUsd)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                <div className="billing-table-card">
                    <h2>Manual Adjustments</h2>
                    {adjustmentBlocked ? (
                        <p>Only OWNER/ADMIN can view and create billing adjustments.</p>
                    ) : (
                        <>
                            <form className="adjustment-form" onSubmit={submitAdjustment}>
                                <select
                                    value={adjustmentForm.metricType}
                                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, metricType: e.target.value }))}
                                >
                                    <option value="BUILD_MINUTES">BUILD_MINUTES</option>
                                    <option value="EGRESS_MB">EGRESS_MB</option>
                                </select>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Amount (USD)"
                                    value={adjustmentForm.amountUsd}
                                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, amountUsd: e.target.value }))}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Reason"
                                    value={adjustmentForm.reason}
                                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, reason: e.target.value }))}
                                    required
                                />
                                <button type="submit" className="billing-upgrade-btn">Add Adjustment</button>
                            </form>

                            <table>
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        <th>Reason</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adjustments.length === 0 && (
                                        <tr><td colSpan="3">No adjustments yet.</td></tr>
                                    )}
                                    {adjustments.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.metricType || 'N/A'}</td>
                                            <td>{item.reason}</td>
                                            <td>{formatUsd(item.amountUsd)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </section>

            <section className="billing-alerts">
                <h2>Usage Alerts</h2>
                {alerts.length === 0 && <p>No alerts.</p>}
                {alerts.map((alert) => (
                    <div className={`billing-alert ${alert.level}`} key={alert.metricType}>
                        <strong>{alert.metricType}</strong>
                        <span>{alert.consumed.toFixed(2)} / {alert.included.toFixed(2)} ({alert.percentage}%)</span>
                    </div>
                ))}
            </section>
        </div>
    )
}

export default BillingPage

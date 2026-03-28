import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../auth/AuthContext'
import {
    getBillingSummary,
    getBillingTimeseries,
    getBillingProjectUsage,
    getBillingInvoices,
    getBillingInvoiceDetails,
    getBillingPayments,
    getBillingPricing,
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

function formatInr(value) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))
}

function formatMetricLabel(metricType) {
    const labels = {
        BUILD_MINUTES: 'Build Minutes',
        EGRESS_MB: 'Egress (MB)',
        DEPLOYMENT_COUNT: 'Deployments (per project)',
        PROJECT_COUNT: 'Projects'
    }

    return labels[metricType] || metricType
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
    const [payments, setPayments] = useState([])
    const [pricing, setPricing] = useState([])
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState(null)
    const [showAllProjects, setShowAllProjects] = useState(false)
    const [showAllInvoices, setShowAllInvoices] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const trendData = useMemo(() => (
        timeseries.reduce((acc, row) => {
            const key = new Date(row.bucketDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const existing = acc.find((x) => x.date === key)
            if (existing) {
                existing.costInr += Number(row.costInr)
            } else {
                acc.push({ date: key, costInr: Number(row.costInr) })
            }
            return acc
        }, [])
    ), [timeseries])

    const loadData = async () => {
        try {
            setLoading(true)
            setError('')

            const [summaryRes, timeseriesRes, projectsRes, invoicesRes, paymentsRes] = await Promise.all([
                getBillingSummary(),
                getBillingTimeseries(30),
                getBillingProjectUsage(),
                getBillingInvoices(),
                getBillingPayments()
            ])

            const pricingRes = await getBillingPricing()

            if (summaryRes.status === 'success') setSummary(summaryRes.data)
            if (timeseriesRes.status === 'success') setTimeseries(timeseriesRes.data.rows)
            if (projectsRes.status === 'success') setProjectRows(projectsRes.data.rows)
            if (invoicesRes.status === 'success') setInvoices(invoicesRes.data.invoices)
            if (paymentsRes.status === 'success') setPayments(paymentsRes.data.payments)
            if (pricingRes.status === 'success') setPricing(pricingRes.data.pricing)
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

    if (loading) {
        return (
            <div className="dashboard-modern-container billing-page">
                <div className="dashboard-content">
                    <p>Loading billing dashboard...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="dashboard-modern-container billing-page">
                <div className="dashboard-content">
                    <p className="billing-error">{error}</p>
                </div>
            </div>
        )
    }

    const alerts = summary?.alerts || []
    const budgetLimitInr = Number(summary?.account?.budgetHardLimitInr || 0)
    const usedAmountInr = Number(summary?.costs?.subtotalInr || 0)
    const netSubtotalInr = Number(summary?.costs?.netSubtotalInr || usedAmountInr)
    const balanceAppliedInr = Number(summary?.costs?.balanceAppliedInr || 0)
    const balanceRemainingInr = Number(summary?.costs?.balanceRemainingInr || 0)
    const visibleProjects = showAllProjects ? projectRows : projectRows.slice(0, 5)
    const visibleInvoices = showAllInvoices ? invoices : invoices.slice(0, 5)

    return (
        <div className="dashboard-modern-container billing-page">
            <div className="dashboard-content">
            <section className="billing-header">
                <div>
                    <h1>Billing</h1>
                    <p>Track usage, forecast spend, and manage invoices.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => window.appState.setPage('monthly-invoices')} className="billing-upgrade-btn">Monthly Invoices</button>
                    <button onClick={handleUpgrade} className="billing-upgrade-btn">Manage Billing</button>
                </div>
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
                    value={formatInr(summary?.costs?.estimatedMonthEndInr || 0)}
                    subtitle={`Spent ${formatInr(summary?.costs?.subtotalInr || 0)} so far`}
                />
                <MetricCard
                    title="Amount due after balance"
                    value={formatInr(netSubtotalInr || 0)}
                    subtitle={balanceAppliedInr > 0
                        ? `Balance applied ${formatInr(balanceAppliedInr)} · Remaining ${formatInr(balanceRemainingInr)}`
                        : 'Add balance to unlock more usage'}
                />
                <MetricCard
                    title="Month-to-date deployments"
                    value={Math.round(summary?.usage?.deployments || 0)}
                    subtitle={`Deployment charge ${formatInr(summary?.costs?.deploymentInr || 0)}`}
                />
                <MetricCard
                    title="Active projects in billing"
                    value={Math.round(summary?.usage?.projects || 0)}
                    subtitle={`Project charge ${formatInr(summary?.costs?.projectsInr || 0)}`}
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
                        <YAxis tickFormatter={(v) => `Rs. ${Number(v).toFixed(0)}`} />
                        <Tooltip formatter={(v) => formatInr(v)} />
                        <Area dataKey="costInr" stroke="#00795b" fill="url(#billCost)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </section>

            {/* <section className="billing-table-card">
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
                                <td>{formatMetricLabel(row.metricType)}</td>
                                <td>{Number(row.includedUnits).toFixed(2)}</td>
                                <td>{formatInr(row.unitPriceInr)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section> */}

            <section className="billing-panels">
                <div className="billing-table-card">
                    <h2>Project Usage Breakdown</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Deployments</th>
                                <th>Projects</th>
                                <th>Build Minutes</th>
                                <th>Egress (GB)</th>
                                <th>Usage Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectRows.length === 0 && (
                                <tr><td colSpan="6">No usage yet this cycle.</td></tr>
                            )}
                            {visibleProjects.map((row) => (
                                <tr key={row.projectId || row.projectName}>
                                    <td>{row.projectName}</td>
                                    <td>{Math.round(row.deploymentCount || 0)}</td>
                                    <td>{Math.round(row.projectCount || 0)}</td>
                                    <td>{Math.round(row.buildMinutes)}</td>
                                    <td>{(row.egressMb / 1024).toFixed(2)}</td>
                                    <td>{formatInr(row.costInr)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {projectRows.length > 5 && (
                        <button
                            className="billing-show-more"
                            onClick={() => setShowAllProjects((prev) => !prev)}
                        >
                            {showAllProjects ? 'Show fewer projects' : `Show all ${projectRows.length} projects`}
                        </button>
                    )}
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
                            {visibleInvoices.map((invoice) => (
                                <tr key={invoice.id} className="invoice-row-clickable" onClick={() => openInvoiceDetails(invoice.id)}>
                                    <td>
                                        {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                                    </td>
                                    <td>{invoice.status}</td>
                                    <td>{formatInr(invoice.totalInr)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {invoices.length > 5 && (
                        <button
                            className="billing-show-more"
                            onClick={() => setShowAllInvoices((prev) => !prev)}
                        >
                            {showAllInvoices ? 'Show fewer invoices' : `Show all ${invoices.length} invoices`}
                        </button>
                    )}
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
                                            <td>{formatInr(item.amountInr)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                <div className="billing-table-card">
                    <h2>Payment Status</h2>
                    <p>Manage your billing balance to unlock additional projects and usage beyond the included free credits.</p>
                    <p><strong>Available balance:</strong> {formatInr(Number(summary?.account?.balanceInr || 0))}</p>
                    <button onClick={handleUpgrade} className="billing-upgrade-btn">Add Balance</button>
                </div>
            </section>

            <section className="billing-table-card">
                <h2>Recent Payments</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Invoice</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 && (
                            <tr><td colSpan="4">No payments recorded yet.</td></tr>
                        )}
                        {payments.map((payment) => (
                            <tr key={payment.id}>
                                <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                                <td>{payment.status}</td>
                                <td>{formatInr(payment.amountInr || 0)}</td>
                                <td>{payment.invoice?.id || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        </div>
    )
}

export default BillingPage

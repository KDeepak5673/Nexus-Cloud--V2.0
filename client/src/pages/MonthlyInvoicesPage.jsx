import { useEffect, useMemo, useState } from 'react'
import { getBillingInvoiceDetails, getBillingInvoices } from '../lib/api'
import '../styles/MonthlyInvoicesPage.css'

function formatInr(value) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(Number(value || 0))
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

function downloadCsv(filename, rows) {
    const csv = rows
        .map((row) => row.map((cell) => {
            const str = String(cell ?? '')
            const escaped = str.replace(/"/g, '""')
            return `"${escaped}"`
        }).join(','))
        .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
}

function MonthlyInvoicesPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [invoices, setInvoices] = useState([])
    const [lineItemsByInvoice, setLineItemsByInvoice] = useState({})

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                setError('')

                const invoicesRes = await getBillingInvoices()
                if (invoicesRes?.status !== 'success') {
                    throw new Error('Failed to fetch invoices')
                }

                const fetchedInvoices = invoicesRes.data.invoices || []
                setInvoices(fetchedInvoices)

                const invoiceDetailsEntries = await Promise.all(
                    fetchedInvoices.map(async (invoice) => {
                        const detailRes = await getBillingInvoiceDetails(invoice.id)
                        if (detailRes?.status === 'success') {
                            return [invoice.id, detailRes.data.invoice.lineItems || []]
                        }

                        return [invoice.id, invoice.lineItems || []]
                    })
                )

                setLineItemsByInvoice(Object.fromEntries(invoiceDetailsEntries))
            } catch (loadError) {
                console.error(loadError)
                setError('Unable to load monthly invoices.')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    const totals = useMemo(() => {
        const totalInr = invoices.reduce((sum, invoice) => sum + Number(invoice.totalInr || 0), 0)
        return {
            totalInvoices: invoices.length,
            totalAmountInr: formatInr(totalInr)
        }
    }, [invoices])

    const handlePrintInvoice = (invoiceId) => {
        const section = document.getElementById(`invoice-print-${invoiceId}`)
        if (!section) return

        const printWindow = window.open('', '_blank', 'width=1000,height=800')
        if (!printWindow) return

        printWindow.document.write(`
            <html>
              <head>
                <title>Invoice ${invoiceId}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 24px; color: #1c2d2a; }
                  h2 { margin: 0 0 8px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                  th, td { border: 1px solid #d7e8e2; padding: 8px; text-align: left; font-size: 12px; }
                  th { background: #eef8f4; }
                </style>
              </head>
              <body>${section.innerHTML}</body>
            </html>
        `)

        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
    }

    const handleExportInvoiceCsv = (invoice) => {
        const lineItems = lineItemsByInvoice[invoice.id] || []
        const rows = [
            ['Invoice ID', invoice.id],
            ['Period', `${new Date(invoice.periodStart).toLocaleDateString('en-IN')} - ${new Date(invoice.periodEnd).toLocaleDateString('en-IN')}`],
            ['Status', invoice.status],
            ['Total (INR)', formatInr(invoice.totalInr)],
            [],
            ['Metric', 'Description', 'Quantity', 'Unit Price (INR)', 'Amount (INR)'],
            ...lineItems.map((item) => ([
                formatMetricLabel(item.metricType),
                item.description,
                Number(item.quantity).toFixed(2),
                formatInr(item.unitPriceInr),
                formatInr(item.amountInr)
            ]))
        ]

        const monthLabel = new Date(invoice.periodStart).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).replace(/\s+/g, '-')
        downloadCsv(`invoice-${monthLabel}-${invoice.id}.csv`, rows)
    }

    if (loading) {
        return <div className="monthly-invoices-shell"><p>Loading monthly invoices...</p></div>
    }

    if (error) {
        return <div className="monthly-invoices-shell"><p className="monthly-invoices-error">{error}</p></div>
    }

    return (
        <div className="monthly-invoices-shell">
            <section className="monthly-invoices-header">
                <div>
                    <h1>Monthly Invoices</h1>
                    <p>Detailed invoice view with print and export controls.</p>
                </div>
                <div className="monthly-invoices-header-actions">
                    <button className="monthly-invoices-btn" onClick={() => window.appState.setPage('billing')}>Back To Billing</button>
                </div>
            </section>

            <section className="monthly-invoices-summary">
                <div className="monthly-invoices-stat-card">
                    <p>Total invoices</p>
                    <h3>{totals.totalInvoices}</h3>
                </div>
                <div className="monthly-invoices-stat-card">
                    <p>Total billed (INR)</p>
                    <h3>{totals.totalAmountInr}</h3>
                </div>
            </section>

            {invoices.length === 0 && (
                <section className="monthly-invoices-card">
                    <p>No monthly invoices available yet.</p>
                </section>
            )}

            {invoices.map((invoice) => {
                const lineItems = lineItemsByInvoice[invoice.id] || []
                return (
                    <section key={invoice.id} className="monthly-invoices-card">
                        <div className="monthly-invoices-card-header">
                            <div>
                                <h2>
                                    {new Date(invoice.periodStart).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                </h2>
                                <p>
                                    {new Date(invoice.periodStart).toLocaleDateString('en-IN')} - {new Date(invoice.periodEnd).toLocaleDateString('en-IN')} | {invoice.status}
                                </p>
                            </div>
                            <div className="monthly-invoices-actions">
                                {/* {invoice.externalPdfUrl && (
                                    <a className="monthly-invoices-btn secondary" href={invoice.externalPdfUrl} target="_blank" rel="noreferrer">Export PDF</a>
                                )} */}
                                <button className="monthly-invoices-btn secondary" onClick={() => handleExportInvoiceCsv(invoice)}>Export CSV</button>
                                <button className="monthly-invoices-btn" onClick={() => handlePrintInvoice(invoice.id)}>Print</button>
                            </div>
                        </div>

                        <div id={`invoice-print-${invoice.id}`}>
                            <p><strong>Invoice ID:</strong> {invoice.id}</p>
                            <p><strong>Total:</strong> {formatInr(invoice.totalInr)}</p>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        <th>Description</th>
                                        <th>Qty</th>
                                        <th>Unit Price</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.length === 0 && (
                                        <tr><td colSpan="5">No line items on this invoice.</td></tr>
                                    )}
                                    {lineItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>{formatMetricLabel(item.metricType)}</td>
                                            <td>{item.description}</td>
                                            <td>{Number(item.quantity).toFixed(2)}</td>
                                            <td>{formatInr(item.unitPriceInr)}</td>
                                            <td>{formatInr(item.amountInr)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )
            })}
        </div>
    )
}

export default MonthlyInvoicesPage

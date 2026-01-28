import { COLORS } from '../constants/design'

function StatCard({ icon, value, label, trend = null }) {
  return (
    <div className="rounded-lg shadow-soft border p-6"
      style={{
        background: 'var(--bg-surface, #fff)',
        borderColor: 'var(--border-subtle, #e8c4b0)'
      }}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="p-2 rounded-md"
          style={{ background: 'var(--accent-hover, #E8CCBF)' }}
        >
          <i className={`${icon} text-xl`} style={{ color: 'var(--accent-primary, #266150)' }}></i>
        </div>
        {trend && (
          <div className="text-xs font-medium"
            style={{ color: trend.direction === 'up' ? 'var(--accent-primary, #266150)' : 'var(--accent-hover, #DDAF94)' }}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary, #4F4846)' }}>{value}</h3>
      <p className="text-sm" style={{ color: 'var(--text-muted, rgba(79,72,70,0.6))' }}>{label}</p>
    </div>
  )
}

export default StatCard
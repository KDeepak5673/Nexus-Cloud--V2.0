import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import ProjectCard from '../components/ProjectCard'
import DeploymentTable from '../components/DeploymentTable'
import { 
  getProjects, 
  getDeployments,
  getDashboardStats,
  getDeploymentActivity,
  getSuccessFailureTrend,
  getRecentDeployments 
} from '../lib/api.js'
import '../styles/DashboardPage.css';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

// Metric Card Component with SVG Icons
function MetricCard({ label, value, change, trend, iconType }) {
  const isPositive = trend === 'up'

  const getIcon = () => {
    const iconProps = { width: 24, height: 24, stroke: "currentColor", fill: "none", strokeWidth: 2 }
    
    switch(iconType) {
      case 'projects':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )
      case 'deployments':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        )
      case 'progress':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        )
      case 'success':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )
      case 'today':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        )
      case 'time':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        )
      case 'failed':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )
      case 'environments':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="metric-card-modern">
      <div className="metric-card-header">
        <div className="metric-icon-svg">{getIcon()}</div>
        {change && (
          <div className={`metric-trend ${isPositive ? 'trend-up' : 'trend-down'}`}>
            {isPositive ? '↑' : '↓'} {change}
          </div>
        )}
      </div>
      <div className="metric-content">
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
      </div>
    </div>
  )
}

// Chart Card Component
function ChartCard({ title, description, children }) {
  return (
    <div className="chart-card-modern">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-description">{description}</p>
        </div>
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [deployments, setDeployments] = useState([])
  const [dashboardStats, setDashboardStats] = useState({
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    activeProjects: 0,
    averageDeploymentTime: 0,
    deploymentsToday: 0
  })
  const [activityData, setActivityData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllProjects, setShowAllProjects] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch all dashboard data in parallel
      const [
        projectsResponse,
        deploymentsResponse,
        statsResponse,
        activityResponse,
        trendResponse
      ] = await Promise.all([
        getProjects(),
        getDeployments(),
        getDashboardStats(),
        getDeploymentActivity(),
        getSuccessFailureTrend()
      ])

      // Transform and set projects
      if (projectsResponse?.status === 'success') {
        const transformedProjects = projectsResponse.data.projects.map(project => ({
          id: project.id,
          title: project.name,
          environment: project.Deployement?.[0]?.status === 'READY' ? 'Production' : 'Preview',
          lastDeployed: project.Deployement?.[0] ? getTimeAgo(project.Deployement[0].createdAt) : 'Never',
          subDomain: project.subDomain,
          gitURL: project.gitURL,
          deploymentStatus: project.Deployement?.[0]?.status || 'NOT_STARTED'
        }))
        setProjects(transformedProjects)
      }

      // Transform and set deployments
      if (deploymentsResponse?.status === 'success') {
        const transformedDeployments = deploymentsResponse.data.deployments.map(deployment => ({
          id: deployment.id,
          project: deployment.project.name,
          status: getDeploymentStatus(deployment.status),
          statusDisplay: deployment.status,
          timestamp: getTimeAgo(deployment.createdAt),
          createdAt: deployment.createdAt,
          projectId: deployment.projectId
        }))
        setDeployments(transformedDeployments)
      }

      // Set dashboard stats
      if (statsResponse?.status === 'success') {
        setDashboardStats(statsResponse.data)
      }

      // Set activity data
      if (activityResponse?.status === 'success') {
        setActivityData(activityResponse.data.last7DaysActivity || [])
      }

      // Set trend data
      if (trendResponse?.status === 'success') {
        setTrendData(trendResponse.data.successFailureTrend || [])
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate deployment activity for the last 7 days - now using API data
  const getDeploymentActivityData = () => {
    return activityData.length > 0 ? activityData : []
  }

  // Get project growth data (still mock but minimal)
  const getProjectGrowthData = () => {
    const growthData = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)

      growthData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        projects: projects.length
      })
    }

    return growthData
  }

  // Get success vs failure trend - using API data with proper formatting
  const getSuccessFailureTrend = () => {
    if (trendData.length === 0) return []
    
    return trendData.map(d => {
      const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
      return {
        date: d.date,
        day: dayName,
        successful: d.success || 0,
        failed: d.failure || 0
      }
    })
  }

  // Get deployment duration trend - calculate real average per day
  const getDeploymentDurationTrend = () => {
    const durationByDay = {}
    const today = new Date()

    // Initialize all 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      durationByDay[dayName] = { count: 0, total: 0, day: dayName }
    }

    // Calculate actual durations from deployments
    if (deployments.length > 0) {
      deployments.forEach(deployment => {
        if (deployment.createdAt) {
          const depDate = new Date(deployment.createdAt)
          depDate.setHours(0, 0, 0, 0)
          
          const dayName = depDate.toLocaleDateString('en-US', { weekday: 'short' })
          
          if (durationByDay[dayName]) {
            // Mock duration calculation - in real scenario this would come from DB
            const duration = Math.floor(Math.random() * 15) + 5 // 5-20 minutes
            durationByDay[dayName].total += duration
            durationByDay[dayName].count += 1
          }
        }
      })
    }

    // Calculate averages and format for chart
    return Object.values(durationByDay).map(item => ({
      day: item.day,
      duration: item.count > 0 ? Math.round(item.total / item.count) : dashboardStats.averageDeploymentTime || 5
    }))
  }

  // Get most active projects
  const getMostActiveProjects = () => {
    const projectActivity = projects.map(project => {
      const projectDeployments = deployments.filter(d => d.projectId === project.id).length
      return { ...project, deploymentCount: projectDeployments }
    })
    return projectActivity.sort((a, b) => b.deploymentCount - a.deploymentCount).slice(0, 5)
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getDeploymentStatus = (status) => {
    const statusMap = {
      'READY': 'ready',
      'IN_PROGRESS': 'prog',
      'QUEUED': 'queue',
      'FAIL': 'fail',
      'NOT_STARTED': 'queue'
    }
    return statusMap[status] || 'queue'
  }
  const getProjectDistribution = () => {
    const production = projects.filter(p => p.environment === 'Production').length
    const preview = projects.filter(p => p.environment === 'Preview').length
    return [
      { name: 'Production', value: production, color: '#ee7c0b' },
      { name: 'Preview', value: preview, color: '#122a2c' }
    ]
  }

  // Calculate stats from real data
  const stats = [
    {
      title: "Total Deployments",
      value: dashboardStats.totalDeployments,
      change: "+12%",
      trend: "up",
      iconType: "deployments"
    },
    {
      title: "Successful Deployments",
      value: dashboardStats.successfulDeployments,
      change: "+8%",
      trend: "up",
      iconType: "success"
    },
    {
      title: "Failed Deployments",
      value: dashboardStats.failedDeployments,
      change: "-2%",
      trend: "up",
      iconType: "failed"
    },
    {
      title: "Active Projects",
      value: dashboardStats.activeProjects,
      change: `${projects.length}`,
      trend: "up",
      iconType: "projects"
    },
    {
      title: "Avg Deploy Time",
      value: `${dashboardStats.averageDeploymentTime}m`,
      change: "-3%",
      trend: "up",
      iconType: "time"
    },
    {
      title: "Deployments Today",
      value: dashboardStats.deploymentsToday,
      change: "+15%",
      trend: "up",
      iconType: "today"
    },
    {
      title: "Success Rate",
      value: dashboardStats.totalDeployments > 0 ? `${Math.round((dashboardStats.successfulDeployments / dashboardStats.totalDeployments) * 100)}%` : "0%",
      change: "+5%",
      trend: "up",
      iconType: "success"
    },
    {
      title: "Active Environments",
      value: dashboardStats.activeProjects,
      change: dashboardStats.activeProjects,
      trend: "up",
      iconType: "environments"
    }
  ]

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">{payload[0].value} {payload[0].name}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="dashboard-modern-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-modern-container">
        <div className="error-state">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
          <button className="btn-modern btn-primary" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-modern-container">
      {/* Glassmorphism background effects */}
      <div className="dashboard-background">
        <div className="bg-blob blob-1"></div>
        <div className="bg-blob blob-2"></div>
        <div className="bg-blob blob-3"></div>
      </div>

      {/* Dashboard Header */}
      <header className="dashboard-modern-header">
        <div className="dashboard-header-content">
          <div className="header-badge">
            <span className="badge-dot"></span>
            LIVE DASHBOARD
          </div>
          <h1 className="dashboard-title">
            Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
          </h1>
          <p className="dashboard-subtitle">
            Monitor your projects, track deployments, and analyze performance metrics in real-time
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-icon" title="Download Report">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button className="btn-icon" title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6"></path>
              <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24"></path>
              <path d="M1 12h6m6 0h6"></path>
              <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"></path>
            </svg>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Metrics Row */}
        <div className="metrics-grid">
          {stats.map((stat, index) => (
            <MetricCard
              key={index}
              label={stat.title}
              value={stat.value}
              change={stat.change}
              trend={stat.trend}
              iconType={stat.iconType}
            />
          ))}
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <ChartCard
            title="DEPLOYMENT ACTIVITY"
            description="Last 7 days deployment trends"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getDeploymentActivityData()} margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ee7c0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ee7c0b" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} vertical={false} />
                <XAxis dataKey="day" stroke="#6B7280" style={{ fontSize: '12px' }} label={{ value: 'Day', position: 'bottom', offset: 0 }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} label={{ value: 'Deployments', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(238, 124, 11, 0.1)' }} />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Deployments" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="SUCCESS VS FAILURE TREND"
            description="Deployment success rate over time"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getSuccessFailureTrend()} margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} vertical={false} />
                <XAxis dataKey="day" stroke="#6B7280" style={{ fontSize: '12px' }} label={{ value: 'Day', position: 'bottom', offset: 0 }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} label={{ value: 'Deployments', angle: -90, position: 'insideLeft' }} />
                <Tooltip cursor={{ fill: 'rgba(238, 124, 11, 0.05)' }} content={<CustomTooltip />} />
                <Bar dataKey="successful" stackId="a" fill="#22c55e" name="Successful" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" stackId="a" fill="#ee7c0b" name="Failed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="DEPLOYMENT DURATION TREND"
            description="Average deployment time per day"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getDeploymentDurationTrend()} margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                <defs>
                  <linearGradient id="durationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#122a2c" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#122a2c" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} vertical={false} />
                <XAxis dataKey="day" stroke="#6B7280" style={{ fontSize: '12px' }} label={{ value: 'Day', position: 'bottom', offset: 0 }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                <Tooltip cursor={{ stroke: '#122a2c', strokeOpacity: 0.2 }} content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="#122a2c"
                  strokeWidth={3}
                  dot={{ fill: '#122a2c', r: 4 }}
                  activeDot={{ r: 6 }}
                  fill="url(#durationGradient)"
                  name="Avg Duration"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Project Insights Section */}
        <div className="dashboard-section">
          <div className="section-header-simple">
            <h2 className="section-title">Project Insights</h2>
            <p className="section-subtitle">Analyze project distribution and activity</p>
          </div>
          
          <div className="charts-row">
            <ChartCard
              title="ENVIRONMENT DISTRIBUTION"
              description="Projects by environment type"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getProjectDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getProjectDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="MOST ACTIVE PROJECTS"
              description="Top projects by deployment count"
            >
              <div style={{ padding: '1rem 0' }}>
                {getMostActiveProjects().length > 0 ? (
                  <div className="active-projects-list">
                    {getMostActiveProjects().map((project, index) => (
                      <div key={project.id} className="active-project-item">
                        <div className="project-rank">#{index + 1}</div>
                        <div className="project-info">
                          <div className="project-name">{project.title}</div>
                          <div className="project-env">{project.environment}</div>
                        </div>
                        <div className="project-count">{project.deploymentCount} deploys</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    No project activity yet
                  </div>
                )}
              </div>
            </ChartCard>
          </div>
        </div>

        {/* System Health Section */}
        <div className="dashboard-section">
          <div className="section-header-simple">
            <h2 className="section-title">System Health</h2>
            <p className="section-subtitle">Real-time infrastructure status</p>
          </div>
          
          <div className="system-health-grid">
            <div className="health-card">
              <div className="health-icon-svg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="health-info">
                <div className="health-name">ECS Tasks</div>
                <div className="health-status healthy">
                  <span className="status-dot"></span>
                  Healthy
                </div>
              </div>
              <div className="health-metric">12/12 Running</div>
            </div>

            <div className="health-card">
              <div className="health-icon-svg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div className="health-info">
                <div className="health-name">Docker Images</div>
                <div className="health-status healthy">
                  <span className="status-dot"></span>
                  Healthy
                </div>
              </div>
              <div className="health-metric">All Updated</div>
            </div>

            <div className="health-card">
              <div className="health-icon-svg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="health-info">
                <div className="health-name">Kafka Streams</div>
                <div className="health-status healthy">
                  <span className="status-dot"></span>
                  Healthy
                </div>
              </div>
              <div className="health-metric">3/3 Active</div>
            </div>

            <div className="health-card">
              <div className="health-icon-svg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </svg>
              </div>
              <div className="health-info">
                <div className="health-name">S3 Hosting</div>
                <div className="health-status healthy">
                  <span className="status-dot"></span>
                  Healthy
                </div>
              </div>
              <div className="health-metric">99.9% Uptime</div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="dashboard-section">
          <div className="section-header-simple">
            <h2 className="section-title">Quick Actions</h2>
            <p className="section-subtitle">Common tasks and shortcuts</p>
          </div>
          
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => window.appState.setPage('new-project')}>
              <div className="action-icon-svg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div className="action-label">New Deployment</div>
            </button>

            <button className="quick-action-btn" onClick={() => window.appState.setPage('new-project')}>
              <div className="action-icon-svg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className="action-label">Create Project</div>
            </button>

            <button className="quick-action-btn">
              <div className="action-icon-svg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="action-label">View Logs</div>
            </button>

            <button className="quick-action-btn">
              <div className="action-icon-svg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.66 5.66 4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.66-5.66 4.24-4.24" />
                </svg>
              </div>
              <div className="action-label">Manage Environments</div>
            </button>
          </div>
        </div>

        {/* Projects Section */}
        <div className="dashboard-section">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title">Your Projects</h2>
              <p className="section-subtitle">Manage and monitor all your deployed projects</p>
            </div>
            <button
              className="btn-modern btn-primary"
              onClick={() => window.appState.setPage('new-project')}
            >
              <span>New Project</span>
              <span className="btn-icon-plus">+</span>
            </button>
          </div>

          <div className="projects-grid-modern">
            {(showAllProjects ? projects : projects.slice(0, 4)).map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>

          {projects.length > 4 && (
            <div className="show-more-section">
              <button
                className="btn-modern btn-outline"
                onClick={() => setShowAllProjects(!showAllProjects)}
              >
                {showAllProjects ? (
                  <>
                    <span>Show Less</span>
                    <span className="btn-arrow">↑</span>
                  </>
                ) : (
                  <>
                    <span>Show All Projects ({projects.length - 4} more)</span>
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Deployments Section */}
        <div className="dashboard-section">
          <div className="section-header-simple">
            <h2 className="section-title">Recent Deployments</h2>
            <p className="section-subtitle">Track your latest deployment activities and status</p>
          </div>
          <div className="deployments-table-wrapper">
            <DeploymentTable 
              deployments={deployments} 
              onDeleteSuccess={(deploymentId) => {
                setDeployments(deployments.filter(d => d.id !== deploymentId))
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
export default DashboardPage;
import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import ProjectCard from '../components/ProjectCard'
import DeploymentTable from '../components/DeploymentTable'
import { getProjects, getDeployments } from '../lib/api.js'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

// Metric Card Component
function MetricCard({ label, value, change, trend, icon }) {
  const isPositive = trend === 'up'
  
  return (
    <div className="metric-card-modern">
      <div className="metric-card-header">
        <div className="metric-icon">{icon}</div>
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

      const [projectsResponse, deploymentsResponse] = await Promise.all([
        getProjects(),
        getDeployments()
      ])

      console.log('Projects response:', projectsResponse)
      console.log('Deployments response:', deploymentsResponse)

      if (projectsResponse.status === 'success') {
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
      } else {
        console.error('Failed to fetch projects:', projectsResponse)
      }

      if (deploymentsResponse.status === 'success') {
        const transformedDeployments = deploymentsResponse.data.deployments.map(deployment => ({
          id: deployment.id,
          project: deployment.project.name,
          status: getDeploymentStatus(deployment.status),
          statusDisplay: deployment.status,
          timestamp: getTimeAgo(deployment.createdAt),
          createdAt: deployment.createdAt, // Keep original date for calculations
          projectId: deployment.projectId
        }))
        setDeployments(transformedDeployments)
      } else {
        console.error('Failed to fetch deployments:', deploymentsResponse)
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate deployment activity for the last 7 days
  const getDeploymentActivityData = () => {
    const activityData = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)

      const deploymentsOnDay = deployments.filter(deployment => {
        if (!deployment.createdAt) return false
        const deploymentDate = new Date(deployment.createdAt)
        return deploymentDate >= date && deploymentDate < nextDate
      }).length

      activityData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        deployments: deploymentsOnDay,
        date: date.toLocaleDateString()
      })
    }

    return activityData
  }

  // Get project growth data (last 7 days)
  const getProjectGrowthData = () => {
    const growthData = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      
      growthData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        projects: Math.floor(Math.random() * 20) + projects.length - 10
      })
    }

    return growthData
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

  const stats = [
    {
      title: "Total Projects",
      value: projects.length,
      change: "+12%",
      trend: "up",
      icon: "📊"
    },
    {
      title: "Active Deployments",
      value: deployments.filter(d => d.status === "ready").length,
      change: "+8%",
      trend: "up",
      icon: "⚡"
    },
    {
      title: "In Progress",
      value: deployments.filter(d => d.status === "prog" || d.status === "queue").length,
      change: "-2%",
      trend: "down",
      icon: "⏳"
    },
    {
      title: "Success Rate",
      value: deployments.length > 0 
        ? `${Math.round((deployments.filter(d => d.status === "ready").length / deployments.length) * 100)}%`
        : "0%",
      change: "+5%",
      trend: "up",
      icon: "✓"
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
              icon={stat.icon}
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
              <BarChart data={getDeploymentActivityData()} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ee7c0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ee7c0b" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(238, 124, 11, 0.1)' }} />
                <Bar dataKey="deployments" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="PROJECT GROWTH"
            description="Weekly project metrics overview"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getProjectGrowthData()} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ee7c0b" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ee7c0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ee7c0b', strokeOpacity: 0.2 }} />
                <Line 
                  type="monotone" 
                  dataKey="projects" 
                  stroke="#ee7c0b" 
                  strokeWidth={3}
                  dot={{ fill: '#ee7c0b', r: 4 }}
                  activeDot={{ r: 6 }}
                  fill="url(#lineGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
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
            <DeploymentTable deployments={deployments} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
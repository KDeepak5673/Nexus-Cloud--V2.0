import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import ProjectCard from '../components/ProjectCard'
import DeploymentTable from '../components/DeploymentTable'
import { getProjects, getDeployments } from '../lib/api.js'

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

      // Count deployments for this day using the original createdAt timestamp
      const deploymentsOnDay = deployments.filter(deployment => {
        if (!deployment.createdAt) return false

        const deploymentDate = new Date(deployment.createdAt)
        return deploymentDate >= date && deploymentDate < nextDate
      }).length

      activityData.push({
        date,
        count: deploymentsOnDay,
        label: date.toLocaleDateString('en-US', { weekday: 'short' })
      })
    }

    return activityData
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
      color: "#000000"
    },
    {
      title: "Active Deployments",
      value: deployments.filter(d => d.status === "ready").length,
      color: "#1F2937"
    },
    {
      title: "In Progress",
      value: deployments.filter(d => d.status === "prog" || d.status === "queue").length,
      color: "#6B7280"
    },
    {
      title: "Failed",
      value: deployments.filter(d => d.status === "fail").length,
      color: "#9CA3AF"
    }
  ]

  if (loading) {
    return (
      <div className="dashboard-modern">
        <section className="dashboard-header-section">
          <div className="container">
            <div className="dashboard-welcome">
              <h1>Loading Dashboard...</h1>
              <p>Fetching your projects and deployments</p>
            </div>
          </div>
        </section>
        <section className="dashboard-stats-section">
          <div className="container">
            <div className="loading-spinner-large">
              <div className="spinner"></div>
              <p>Loading data from server...</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-modern">
        <section className="dashboard-header-section">
          <div className="container">
            <div className="dashboard-welcome">
              <h1>Dashboard Error</h1>
              <p>{error}</p>
            </div>
          </div>
        </section>
        <section className="dashboard-stats-section">
          <div className="container">
            <div className="error-container">
              <button
                className="btn-modern btn-primary"
                onClick={fetchDashboardData}
              >
                Retry Loading
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="dashboard-modern">
      {/* Dashboard Header */}
      <section className="dashboard-header-section">
        <div className="container">
          <div className="dashboard-welcome">
            <h1>Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!</h1>
            <p>Manage your projects and monitor deployments from your dashboard</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="dashboard-stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card" style={{ '--delay': `${index * 0.1}s`, '--color': stat.color }}>
                <div className="stat-content">
                  <h3>{stat.value}</h3>
                  <p>{stat.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Analytics Charts */}
          <div className="analytics-charts-section">
            <div className="charts-grid">
              {/* Deployment Status Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Deployment Status Overview</h3>
                  <p>Current distribution of all deployments</p>
                </div>
                <div className="donut-chart">
                  <svg viewBox="0 0 200 200" className="donut-svg">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="20"
                    />
                    {/* Active Deployments */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#1F2937"
                      strokeWidth="20"
                      strokeDasharray={`${(stats[1].value / Math.max(deployments.length, 1)) * 502.65} ${502.65 - (stats[1].value / Math.max(deployments.length, 1)) * 502.65}`}
                      strokeDashoffset="125.66"
                      transform="rotate(-90 100 100)"
                      className="donut-segment"
                    />
                    {/* In Progress */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="20"
                      strokeDasharray={`${(stats[2].value / Math.max(deployments.length, 1)) * 502.65} ${502.65 - (stats[2].value / Math.max(deployments.length, 1)) * 502.65}`}
                      strokeDashoffset={`${125.66 - (stats[1].value / Math.max(deployments.length, 1)) * 502.65}`}
                      transform="rotate(-90 100 100)"
                      className="donut-segment"
                    />
                    {/* Failed */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="20"
                      strokeDasharray={`${(stats[3].value / Math.max(deployments.length, 1)) * 502.65} ${502.65 - (stats[3].value / Math.max(deployments.length, 1)) * 502.65}`}
                      strokeDashoffset={`${125.66 - ((stats[1].value + stats[2].value) / Math.max(deployments.length, 1)) * 502.65}`}
                      transform="rotate(-90 100 100)"
                      className="donut-segment"
                    />
                  </svg>
                  <div className="donut-center">
                    <span className="donut-total">{deployments.length}</span>
                    <span className="donut-label">Total</span>
                  </div>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#1F2937' }}></span>
                    <span>Active ({stats[1].value})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#6B7280' }}></span>
                    <span>In Progress ({stats[2].value})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#9CA3AF' }}></span>
                    <span>Failed ({stats[3].value})</span>
                  </div>
                </div>
              </div>

              {/* Project Activity Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Project Activity</h3>
                  <p>Recent deployment activity over time</p>
                </div>
                <div className="bar-chart">
                  <div className="bar-chart-grid">
                    {(() => {
                      const activityData = getDeploymentActivityData();
                      const maxCount = Math.max(...activityData.map(d => d.count), 1);

                      return activityData.map((dayData, index) => {
                        const maxHeight = 120;
                        const barHeight = dayData.count === 0 ? 0 : (dayData.count / maxCount) * maxHeight;
                        const isToday = index === 6;

                        return (
                          <div key={index} className="bar-item">
                            <div
                              className="bar"
                              style={{
                                height: dayData.count === 0 ? '4px' : `${Math.max(barHeight, 12)}px`,
                                backgroundColor: isToday ? '#000000' : (dayData.count > 0 ? '#6B7280' : '#e2e8f0'),
                                opacity: dayData.count === 0 ? 0.3 : 1
                              }}
                              title={`${dayData.count} deployment${dayData.count !== 1 ? 's' : ''} on ${dayData.date.toLocaleDateString()}`}
                            >
                              <span className="bar-value" style={{ display: dayData.count === 0 ? 'none' : 'block' }}>
                                {dayData.count}
                              </span>
                            </div>
                            <span className="bar-label">
                              {dayData.label}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="dashboard-projects-section">
        <div className="container">
          <div className="section-header-modern">
            <div className="header-content">
              <h2>Your Projects</h2>
              <p>All your deployed projects in one place</p>
            </div>
            <button
              className="btn-modern btn-primary"
              onClick={() => window.appState.setPage('new-project')}
            >
              <span>New Project</span>
              <span className="btn-icon">+</span>
            </button>
          </div>

          <div className="projects-grid-modern">
            {(showAllProjects ? projects : projects.slice(0, 6)).map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>

          {projects.length > 6 && (
            <div className="show-more-container">
              <button
                className="btn-modern btn-outline"
                onClick={() => setShowAllProjects(!showAllProjects)}
              >
                {showAllProjects ? (
                  <>
                    <span>Show Less</span>
                    <span className="btn-icon">↑</span>
                  </>
                ) : (
                  <>
                    <span>Show More ({projects.length - 6} more)</span>
                    <span className="btn-icon">↓</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Deployments Section */}
      <section className="dashboard-deployments-section">
        <div className="container">
          <div className="section-header-simple">
            <h2>Recent Deployments</h2>
            <p>Monitor your latest deployment activities</p>
          </div>
          <div className="deployments-table-container">
            <DeploymentTable deployments={deployments} />
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
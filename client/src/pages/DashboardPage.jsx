import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import ProjectCard from '../components/ProjectCard'
import DeploymentTable from '../components/DeploymentTable'
import StatCard from '../components/StatCard'
import { getProjects, getDeployments } from '../lib/api.js'
import { COLORS } from '../constants/design'

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
          createdAt: deployment.createdAt,
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
      icon: "fa-code-branch",
      value: projects.length,
      label: "Projects",
      trend: { direction: 'up', value: 12 }
    },
    {
      icon: "fa-check-circle",
      value: deployments.filter(d => d.status === "ready").length,
      label: "Active Deployments",
      trend: { direction: 'up', value: 8 }
    },
    {
      icon: "fa-hourglass",
      value: deployments.filter(d => d.status === "prog" || d.status === "queue").length,
      label: "In Progress",
      trend: { direction: 'down', value: 3 }
    },
    {
      icon: "fa-exclamation-circle",
      value: deployments.filter(d => d.status === "fail").length,
      label: "Failed",
      trend: null
    }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-off-white">
        <div className="w-12 h-12 rounded-full animate-spin border-4" style={{ borderColor: COLORS.BEIGE, borderTopColor: COLORS.SAGE }}></div>
        <p className="mt-4 text-text-muted">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-off-white">
        <div className="bg-white rounded-lg shadow-soft p-8 max-w-md">
          <h2 className="text-lg font-semibold text-charcoal mb-2">Error Loading Dashboard</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            className="w-full px-4 py-2 rounded-md text-off-white font-medium transition-all"
            style={{ background: COLORS.SAGE }}
            onMouseEnter={(e) => e.target.style.background = COLORS.SAGE_DARK}
            onMouseLeave={(e) => e.target.style.background = COLORS.SAGE}
            onClick={fetchDashboardData}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-off-white min-h-screen">
      {/* Header Section */}
      <section className="border-b border-beige bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-charcoal">Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!</h1>
              <p className="text-text-muted mt-1">Manage your projects and monitor deployments</p>
            </div>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium text-sage border border-sage hover:bg-beige-light transition-colors"
              onClick={fetchDashboardData}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={`fas ${stat.icon}`}
              value={stat.value}
              label={stat.label}
              trend={stat.trend}
            />
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-charcoal mb-2">Your Projects</h2>
          <p className="text-text-muted">Manage and deploy your applications</p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-soft border border-beige-light p-12 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">No projects yet</h3>
            <p className="text-text-muted mb-6">Create your first project to get started</p>
            <button
              className="px-6 py-2 rounded-md text-off-white font-medium transition-all"
              style={{ background: COLORS.ACCENT }}
              onMouseEnter={(e) => e.target.style.background = COLORS.ACCENT}
              onMouseLeave={(e) => e.target.style.background = COLORS.ACCENT}
              onClick={() => window.appState.setPage('new-project')}
            >
              + New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAllProjects ? projects : projects.slice(0, 6)).map(project => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        )}

        {projects.length > 6 && (
          <div className="mt-6 flex justify-center">
            <button
              className="px-4 py-2 rounded-md text-sage border border-sage hover:bg-beige-light transition-colors text-sm font-medium"
              onClick={() => setShowAllProjects(!showAllProjects)}
            >
              {showAllProjects ? 'Show Less' : `Show More (${projects.length - 6} more)`}
            </button>
          </div>
        )}
      </section>

      {/* Deployments Section */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-charcoal mb-2">Recent Deployments</h2>
          <p className="text-text-muted">Monitor your latest deployment activities</p>
        </div>
        {deployments.length > 0 ? (
          <DeploymentTable deployments={deployments} />
        ) : (
          <div className="bg-white rounded-lg shadow-soft border border-beige-light p-12 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">No deployments yet</h3>
            <p className="text-text-muted">Your deployments will appear here</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default DashboardPage
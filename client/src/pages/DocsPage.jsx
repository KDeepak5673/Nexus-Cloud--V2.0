import React from 'react';
import '../styles/DocsPage.css';

function DocsPage() {
    return (
        <div className="docs-container">
            <div className="container" style={{ padding: '4rem 0', maxWidth: '900px' }}>
                {/* Header */}
                <div className="docs-header">
                    <h1>Nexus Cloud Documentation</h1>
                    <p>Complete guide to deploying and managing your projects on Nexus Cloud</p>
                </div>

                {/* Table of Contents */}
                <div className="toc-section">
                    <h2> Table of Contents</h2>
                    <ul className="toc-list">
                        <li><a href="#getting-started">Getting Started</a></li>
                        <li><a href="#creating-project">Creating Your First Project</a></li>
                        <li><a href="#dashboard">Dashboard Overview</a></li>
                        <li><a href="#project-management">Project Management</a></li>
                        <li><a href="#deployment-process">Deployment Process</a></li>
                        <li><a href="#project-urls">Project URLs & Access</a></li>
                        <li><a href="#user-profile">User Profile</a></li>
                        <li><a href="#troubleshooting">Troubleshooting</a></li>
                    </ul>
                </div>

                {/* Getting Started */}
                <section id="getting-started" className="docs-section">
                    <h2> Getting Started</h2>
                    <p>Welcome to Nexus Cloud! Our platform allows you to deploy your GitHub repositories with automatic subdomain generation and live project URLs.</p>

                    <h3>What You Can Do:</h3>
                    <ul>
                        <li>Deploy GitHub repositories automatically</li>
                        <li>Get instant subdomains for your projects (e.g., myapp.localhost:8000)</li>
                        <li>Monitor deployment status and logs in real-time</li>
                        <li>Manage multiple projects from a unified dashboard</li>
                        <li>Track deployment history and retry failed deployments</li>
                    </ul>

                    <h3>Before You Start:</h3>
                    <ul>
                        <li>Create an account by clicking <strong>Sign Up</strong> in the navigation</li>
                        <li>Ensure your GitHub repository is public or accessible</li>
                        <li>Have your project build configuration ready (if needed)</li>
                    </ul>
                </section>

                {/* Creating Project */}
                <section id="creating-project" className="docs-section">
                    <h2>📦 Creating Your First Project</h2>
                    <p>Follow these steps to deploy your first project on Nexus Cloud:</p>

                    <ol className="numbered-steps">
                        <li>
                            <strong>Navigate to New Project</strong>
                            <p>Go to <strong>Dashboard</strong> and click <strong>"New Project"</strong> or use the <strong>"Deploy Project"</strong> button from the home page.</p>
                        </li>
                        <li>
                            <strong>Enter Project Details</strong>
                            <ul>
                                <li><strong>Project Name:</strong> Choose a name that will become your subdomain</li>
                                <li><strong>GitHub URL:</strong> Paste your repository URL (e.g., https://github.com/username/repository)</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Deploy</strong>
                            <p>Click <strong>" Deploy Project"</strong> to start the deployment process.</p>
                        </li>
                        <li>
                            <strong>Monitor Progress</strong>
                            <p>Watch the real-time deployment logs and wait for completion.</p>
                        </li>
                    </ol>

                    <div className="tip-box">
                        <strong>💡 Tip:</strong> Your project name will be automatically converted to a subdomain format. Special characters will be replaced with hyphens.
                    </div>
                </section>

                {/* Dashboard */}
                <section id="dashboard" className="docs-section">
                    <h2> Dashboard Overview</h2>
                    <p>Your dashboard is the central hub for managing all your projects and deployments.</p>

                    <h3>Dashboard Features:</h3>
                    <ul>
                        <li><strong>Statistics Cards:</strong> View total projects, active deployments, in-progress builds, and failed deployments</li>
                        <li><strong>Project Grid:</strong> See all your projects with status indicators and quick actions</li>
                        <li><strong>Recent Deployments:</strong> Monitor your latest deployment activities</li>
                        <li><strong>Quick Actions:</strong> Create new projects and access project details</li>
                    </ul>

                    <h3>Project Status Indicators:</h3>
                    <ul>
                        <li><span className="status-ready">🟢 READY</span> - Project is live and accessible</li>
                        <li><span className="status-progress">🟡 IN_PROGRESS</span> - Deployment is currently building</li>
                        <li><span className="status-queued">🔵 QUEUED</span> - Waiting to start deployment</li>
                        <li><span className="status-failed">🔴 FAIL</span> - Deployment failed (can be retried)</li>
                        <li><span className="status-not-started">⚪ NOT_STARTED</span> - No deployments yet</li>
                    </ul>
                </section>

                {/* Project Management */}
                <section id="project-management" className="docs-section">
                    <h2> Project Management</h2>

                    <h3>Project Cards</h3>
                    <p>Each project is displayed as a card showing:</p>
                    <ul>
                        <li>Project name and deployment status</li>
                        <li>Environment (Production/Preview)</li>
                        <li>Last deployment time</li>
                        <li>Live project URL (when deployed)</li>
                        <li>Action buttons (View Logs, Retry Deploy)</li>
                    </ul>

                    <h3>Available Actions:</h3>
                    <ul>
                        <li><strong>View Logs:</strong> Click any project card to see detailed deployment logs</li>
                        <li><strong>Retry Deploy:</strong> Available for failed deployments to restart the build process</li>
                        <li><strong>Visit Live Site:</strong> Click the project URL when status is READY</li>
                    </ul>
                </section>

                {/* Deployment Process */}
                <section id="deployment-process" className="docs-section">
                    <h2>⚙️ Deployment Process</h2>

                    <h3>Deployment Lifecycle:</h3>
                    <ol className="numbered-steps">
                        <li><strong>Queued:</strong> Deployment is scheduled and waiting to start</li>
                        <li><strong>In Progress:</strong> Code is being downloaded and built</li>
                        <li><strong>Ready:</strong> Deployment completed successfully, site is live</li>
                        <li><strong>Failed:</strong> Something went wrong (check logs for details)</li>
                    </ol>

                    <h3>Monitoring Deployments:</h3>
                    <ul>
                        <li><strong>Real-time Logs:</strong> View live deployment progress in the project details page</li>
                        <li><strong>Auto-refresh:</strong> Deployment status updates automatically every 3 seconds</li>
                        <li><strong>Deployment History:</strong> See all previous deployment attempts</li>
                        <li><strong>Failure Recovery:</strong> Retry failed deployments with one click</li>
                    </ul>
                </section>

                {/* Project URLs */}
                <section id="project-urls" className="docs-section">
                    <h2>🌐 Project URLs & Access</h2>

                    <h3>URL Format:</h3>
                    <p>Your projects are accessible at: <code>http://[project-name].localhost:8000</code></p>

                    <h3>URL Features:</h3>
                    <ul>
                        <li><strong>Automatic Subdomain:</strong> Based on your project name</li>
                        <li><strong>Live Indicators:</strong> Visual status showing if site is online/offline</li>
                        <li><strong>Copy to Clipboard:</strong> Easy URL sharing functionality</li>
                        <li><strong>Direct Access:</strong> Click URLs to visit your live projects</li>
                    </ul>

                    <h3>Where URLs Appear:</h3>
                    <ul>
                        <li>Project cards in dashboard</li>
                        <li>Project details page</li>
                        <li>New project deployment confirmation</li>
                        <li>User profile projects section</li>
                    </ul>
                </section>

                {/* User Profile */}
                <section id="user-profile" className="docs-section">
                    <h2>👤 User Profile</h2>

                    <h3>Profile Features:</h3>
                    <ul>
                        <li><strong>User Statistics:</strong> Total projects, active projects, and deployment counts</li>
                        <li><strong>Projects Overview:</strong> Compact view of all your projects with status</li>
                        <li><strong>Quick Actions:</strong> Create new projects and access project details</li>
                        <li><strong>Account Management:</strong> View account information and sign out</li>
                    </ul>

                    <h3>Access Your Profile:</h3>
                    <p>Click your profile avatar in the top navigation to access your profile page.</p>
                </section>

                {/* Troubleshooting */}
                <section id="troubleshooting" className="docs-section">
                    <h2>🔍 Troubleshooting</h2>

                    <h3>Common Issues:</h3>

                    <div className="troubleshoot-item">
                        <h4>Deployment Failed</h4>
                        <ul>
                            <li>Check deployment logs for specific error messages</li>
                            <li>Verify your GitHub repository is accessible</li>
                            <li>Ensure your repository has proper build configuration</li>
                            <li>Use the "🔄 Retry Deploy" button to attempt again</li>
                        </ul>
                    </div>

                    <div className="troubleshoot-item">
                        <h4>Project URL Not Working</h4>
                        <ul>
                            <li>Ensure deployment status is "READY"</li>
                            <li>Check if the S3 reverse proxy is running on port 8000</li>
                            <li>Verify the subdomain matches your project name</li>
                        </ul>
                    </div>

                    <div className="troubleshoot-item">
                        <h4>GitHub Repository Issues</h4>
                        <ul>
                            <li>Repository must be public or accessible</li>
                            <li>URL format: https://github.com/username/repository</li>
                            <li>Repository should contain build-ready code</li>
                        </ul>
                    </div>
                </section>

                {/* Platform Overview */}
                <section id="platform-overview" className="docs-section">
                    <h2>🏗️ Platform Architecture</h2>
                    <p>Nexus Cloud consists of several components working together:</p>

                    <ul>
                        <li><strong>Frontend Client:</strong> React-based dashboard for project management</li>
                        <li><strong>API Server:</strong> Handles authentication, projects, and deployments</li>
                        <li><strong>S3 Reverse Proxy:</strong> Routes subdomains to deployed project files</li>
                        <li><strong>Build System:</strong> Processes GitHub repositories into deployable sites</li>
                        <li><strong>Analytics System:</strong> Tracks platform usage and project statistics</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default DocsPage;
import React, { useState, useEffect } from 'react';
import '../styles/DocsPage.css';

function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.docs-section');
      let current = 'getting-started';

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop - 200) {
          current = section.getAttribute('id');
        }
      });

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="docs-container">
      {/* Header */}
      <div className="docs-header">
        <div className="container">
          <h1>Nexus Cloud Documentation</h1>
          <p>Complete guide to deploying and managing your projects on Nexus Cloud</p>
        </div>
      </div>

      <div className="docs-layout">
        {/* Sidebar with Table of Contents */}
        <aside className="docs-sidebar">
          <div className="sidebar-content">
            <h3 className="sidebar-title">Contents</h3>
            <nav className="sidebar-nav">
              <a
                href="#getting-started"
                className={activeSection === 'getting-started' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); scrollToSection('getting-started'); }}
              >
                Getting Started
              </a>
              <a
                href="#creating-project"
                className={activeSection === 'creating-project' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); scrollToSection('creating-project'); }}
              >
                Creating Your First Project
              </a>
              <a
                href="#dashboard"
                className={activeSection === 'dashboard' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); scrollToSection('dashboard'); }}
              >
                Dashboard Overview
              </a>
              <a
                href="#project-management"
                className={activeSection === 'project-management' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); scrollToSection('project-management'); }}
              >
                Project Management
              </a>
              <a
                href="#deployment-process"
                className={activeSection === 'deployment-process' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); scrollToSection('deployment-process'); }}
              >
                Deployment Process
              </a>
              <a
                href="#project-urls"
                className={activeSection === 'project-urls' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); scrollToSection('project-urls'); }}
              >
                Project URLs & Access
              </a>
              <a
                href="#user-profile"
                className={activeSection === 'user-profile' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); scrollToSection('user-profile'); }}
              >
                User Profile
              </a>
              <a
                href="#troubleshooting"
                className={activeSection === 'troubleshooting' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); scrollToSection('troubleshooting'); }}
              >
                Troubleshooting
              </a>
              <a
                href="#platform-overview"
                className={activeSection === 'platform-overview' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); scrollToSection('platform-overview'); }}
              >
                Platform Architecture
              </a>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="docs-content">

          {/* Getting Started */}
          <section id="getting-started" className="docs-section">
            <h2>Getting Started</h2>
            <p>Welcome to Nexus Cloud - a modern deployment platform that enables you to deploy GitHub repositories with automatic subdomain generation, real-time monitoring, and live project URLs.</p>

            <h3>Platform Capabilities</h3>
            <ul>
              <li><strong>Automated GitHub Deployment:</strong> Deploy any public GitHub repository with one click</li>
              <li><strong>Custom Build Configuration:</strong> Configure install commands, build commands, environment variables, and root directory</li>
              <li><strong>Real-time Deployment Logs:</strong> Watch your build process live with streaming logs via Socket.io</li>
              <li><strong>Instant Subdomain Generation:</strong> Each project gets a unique subdomain automatically</li>
              <li><strong>Analytics Dashboard:</strong> Monitor platform-wide statistics with interactive charts and metrics</li>
              <li><strong>Project Configuration Management:</strong> Update project settings anytime with the configuration modal</li>
              <li><strong>Deployment History:</strong> Track all deployments with timestamps and status information</li>
              <li><strong>One-click Retry:</strong> Redeploy failed builds instantly without creating a new project</li>
              <li><strong>Firebase Authentication:</strong> Secure login with Google OAuth or email/password</li>
            </ul>

            <h3>Prerequisites</h3>
            <ul>
              <li>Active Nexus Cloud account (support for <strong>Google OAuth</strong> or <strong>Email/Password</strong>)</li>
              <li>Public or accessible GitHub repository</li>
              <li>Node.js project with package.json (or static HTML files)</li>
              <li>Understanding of your project's build process and dependencies</li>
            </ul>

            <div className="info-box">
              <strong>Note:</strong> Nexus Cloud uses AWS S3 for storage, ECS Fargate for containerized builds, and ClickHouse for log analytics. All deployments are processed in isolated Docker containers for security.
            </div>
          </section>

          {/* Creating Project */}
          <section id="creating-project" className="docs-section">
            <h2>Creating Your First Project</h2>
            <p>Deploy your first project on Nexus Cloud by following these systematic steps:</p>

            <div className="step-group">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Navigate to New Project</h4>
                  <p>Access the project creation interface via the <strong>Dashboard</strong> and click <strong>New Project</strong>, or use the <strong>Deploy Project</strong> button from the home page.</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Configure Project Details</h4>
                  <p><strong>Project Name:</strong> Select a unique identifier that will be used for your subdomain (e.g., "my-app" becomes my-app.localhost:8000).</p>
                  <p><strong>GitHub URL:</strong> Provide the complete repository URL (format: https://github.com/username/repository).</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Configure Build Settings (Optional)</h4>
                  <p>Click <strong>⚙️ Configure</strong> to customize your build process:</p>
                  <ul>
                    <li><strong>Install Command:</strong> Command to install dependencies (default: npm install)</li>
                    <li><strong>Build Command:</strong> Command to build your project (default: npm run build)</li>
                    <li><strong>Root Directory:</strong> Project root path (default: . for repository root)</li>
                    <li><strong>Environment Variables:</strong> Add KEY=VALUE pairs, one per line</li>
                  </ul>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Initiate Deployment</h4>
                  <p>Click <strong>Deploy Project</strong> to begin the automated deployment process. The build will be processed in a secure Docker container on AWS ECS Fargate.</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h4>Monitor Progress</h4>
                  <p>Watch real-time deployment logs streamed via Socket.io. The logs show git cloning, dependency installation, build execution, and S3 upload progress.</p>
                </div>
              </div>
            </div>

            <div className="info-box">
              <strong>Important:</strong> Project names are automatically formatted as subdomains. Special characters will be converted to hyphens for URL compatibility. Configuration can be updated anytime from the project details page.
            </div>
          </section>

          {/* Dashboard */}
          <section id="dashboard" className="docs-section">
            <h2>Dashboard Overview</h2>
            <p>The dashboard serves as your central control hub with real-time metrics, interactive charts, and comprehensive project management.</p>

            <h3>Key Features</h3>
            <div className="feature-grid">
              <div className="feature-item">
                <h4>Live Metrics Cards</h4>
                <p>Monitor key metrics with animated cards showing total projects, active deployments, builds in progress, and success rates with trend indicators.</p>
              </div>

              <div className="feature-item">
                <h4>Interactive Analytics Charts</h4>
                <p>Visualize deployment activity over the last 7 days with bar charts, and track project growth trends with line charts powered by Recharts.</p>
              </div>

              <div className="feature-item">
                <h4>Project Overview Grid</h4>
                <p>Visual grid display of all projects with real-time status indicators, deployment timestamps, and quick action buttons for each project.</p>
              </div>

              <div className="feature-item">
                <h4>Deployment Activity Table</h4>
                <p>Recent deployments list with sortable columns, status badges, and direct links to project logs and live URLs.</p>
              </div>

              <div className="feature-item">
                <h4>Quick Actions</h4>
                <p>Streamlined access to create new projects, view detailed project information, configure settings, and retry failed deployments.</p>
              </div>

              <div className="feature-item">
                <h4>Real-time Updates</h4>
                <p>Dashboard auto-refreshes every 3 seconds to display the latest deployment statuses and metrics without manual reload.</p>
              </div>
            </div>

            <h3>Status Indicators</h3>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-badge status-ready">READY</span>
                <p>Project is successfully deployed and accessible. Build completed and uploaded to S3.</p>
              </div>
              <div className="status-item">
                <span className="status-badge status-progress">IN_PROGRESS</span>
                <p>Deployment is currently being processed. Container is running build commands.</p>
              </div>
              <div className="status-item">
                <span className="status-badge status-queued">QUEUED</span>
                <p>Deployment is scheduled and waiting for ECS task allocation.</p>
              </div>
              <div className="status-item">
                <span className="status-badge status-failed">FAIL</span>
                <p>Deployment encountered an error during build or upload. Check logs and retry.</p>
              </div>
              <div className="status-item">
                <span className="status-badge status-not-started">NOT_STARTED</span>
                <p>Project created but no deployment has been initiated yet.</p>
              </div>
            </div>

            <h3>Dashboard Sections</h3>
            <ul>
              <li><strong>Header:</strong> Welcome message with your display name and live dashboard badge</li>
              <li><strong>Metrics Grid:</strong> Four metric cards with trend percentages and icons</li>
              <li><strong>Charts Row:</strong> Deployment activity bar chart and project growth line chart</li>
              <li><strong>Projects Section:</strong> Expandable grid of project cards (shows 4, expand for all)</li>
              <li><strong>Recent Deployments:</strong> Comprehensive table with filtering and sorting capabilities</li>
            </ul>
          </section>

          {/* Project Management */}
          <section id="project-management" className="docs-section">
            <h2>Project Management</h2>

            <h3>Project Card Information</h3>
            <p>Each project is represented by a comprehensive card displaying the following details:</p>
            <ul>
              <li>Project name and current deployment status with color-coded badge</li>
              <li>Environment designation (Production or Preview environment)</li>
              <li>Last deployment timestamp with relative time (e.g., "2h ago")</li>
              <li>Live project URL (clickable when status is READY)</li>
              <li>Action buttons: View Details, Configure, Retry Deploy</li>
              <li>Visual status indicators with hover effects and animations</li>
            </ul>

            <h3>Project Configuration</h3>
            <p>Update your project settings anytime using the configuration modal:</p>
            <ul>
              <li><strong>Install Command:</strong> Customize how dependencies are installed (npm, yarn, pnpm)</li>
              <li><strong>Build Command:</strong> Define custom build scripts or tasks</li>
              <li><strong>Root Directory:</strong> Specify a subdirectory if your project is in a monorepo</li>
              <li><strong>Environment Variables:</strong> Add or update environment variables for build-time configuration</li>
            </ul>
            <p>Configuration changes apply to the next deployment. Click <strong>⚙️ Settings</strong> on any project card to open the configuration modal.</p>

            <h3>Available Operations</h3>
            <div className="operations-list">
              <div className="operation-item">
                <h4>View Project Details & Logs</h4>
                <p>Click any project card to view comprehensive deployment details including real-time streaming logs, deployment history, and configuration settings. Logs are stored in ClickHouse for historical analysis.</p>
              </div>

              <div className="operation-item">
                <h4>Update Project Configuration</h4>
                <p>Click the <strong>⚙️ Settings</strong> icon on a project card to open the configuration modal. Update build settings and environment variables, then redeploy with <strong>Save & Deploy</strong>.</p>
              </div>

              <div className="operation-item">
                <h4>Retry Failed Deployments</h4>
                <p>For deployments with FAIL status, click the <strong>🔄 Retry</strong> button to reinitiate the build process. The system will use the latest configuration and create a new deployment record.</p>
              </div>

              <div className="operation-item">
                <h4>Access Live Projects</h4>
                <p>When status shows READY, click the project URL or the <strong>🔗 Visit</strong> button to access your deployed application. URLs are served through the S3 reverse proxy on port 8000.</p>
              </div>

              <div className="operation-item">
                <h4>Copy Project URLs</h4>
                <p>Click the copy icon next to any project URL to copy it to your clipboard for easy sharing with team members or stakeholders.</p>
              </div>
            </div>

            <div className="info-box">
              <strong>Pro Tip:</strong> Environment variables are encrypted at rest and only exposed during the build process. Never commit secrets to your repository - use the configuration modal instead.
            </div>
          </section>

          {/* Deployment Process */}
          <section id="deployment-process" className="docs-section">
            <h2>Deployment Process</h2>

            <h3>Deployment Lifecycle Stages</h3>
            <div className="lifecycle-stages">
              <div className="stage-item">
                <div className="stage-badge">1</div>
                <div className="stage-content">
                  <h4>Queued</h4>
                  <p>Deployment request is received and queued. The API server creates a deployment record and publishes a Kafka event to trigger the build server.</p>
                </div>
              </div>

              <div className="stage-item">
                <div className="stage-badge">2</div>
                <div className="stage-content">
                  <h4>In Progress - Container Provisioning</h4>
                  <p>AWS ECS Fargate allocates resources and launches a Docker container from the build-server image. The container receives project configuration via environment variables.</p>
                </div>
              </div>

              <div className="stage-item">
                <div className="stage-badge">3</div>
                <div className="stage-content">
                  <h4>In Progress - Clone & Install</h4>
                  <p>The build container clones your GitHub repository and executes the install command (default: npm install). All logs are streamed to Kafka and stored in ClickHouse.</p>
                </div>
              </div>

              <div className="stage-item">
                <div className="stage-badge">4</div>
                <div className="stage-content">
                  <h4>In Progress - Build Execution</h4>
                  <p>The build command runs in the specified root directory with your environment variables. Output is captured and streamed in real-time via Socket.io.</p>
                </div>
              </div>

              <div className="stage-item">
                <div className="stage-badge">5</div>
                <div className="stage-content">
                  <h4>In Progress - S3 Upload</h4>
                  <p>Built assets from the dist/ or build/ directory are uploaded to AWS S3 with the project's subdomain as a prefix for routing.</p>
                </div>
              </div>

              <div className="stage-item">
                <div className="stage-badge">6</div>
                <div className="stage-content">
                  <h4>Ready</h4>
                  <p>Deployment completed successfully. The application is now live and accessible via its subdomain through the S3 reverse proxy. DNS routing is automatically configured.</p>
                </div>
              </div>

              <div className="stage-item">
                <div className="stage-badge">⚠️</div>
                <div className="stage-content">
                  <h4>Failed</h4>
                  <p>An error occurred during any stage (clone, install, build, or upload). Detailed logs with stack traces are available in the project details. Click Retry to attempt redeployment.</p>
                </div>
              </div>
            </div>

            <h3>Real-time Monitoring Features</h3>
            <ul>
              <li><strong>Live Log Streaming:</strong> Watch build progress in real-time via Socket.io connections. Logs include timestamps and color-coded severity levels.</li>
              <li><strong>Auto-refresh Status:</strong> Project status updates automatically every 3 seconds without page reload using polling mechanism.</li>
              <li><strong>Historical Log Access:</strong> All logs are persisted in ClickHouse database for later analysis and debugging. Access anytime from project details.</li>
              <li><strong>Error Highlighting:</strong> Build errors and warnings are highlighted in red and yellow respectively for easy identification.</li>
              <li><strong>Deployment Timeline:</strong> View complete deployment history with timestamps, durations, and status transitions.</li>
              <li><strong>Progress Indicators:</strong> Visual progress bars and spinners show current build stage and estimated completion.</li>
            </ul>

            <h3>Build Infrastructure</h3>
            <ul>
              <li><strong>Containerization:</strong> Each build runs in an isolated Docker container based on Ubuntu with Node.js pre-installed</li>
              <li><strong>Scalability:</strong> AWS ECS Fargate automatically scales to handle multiple concurrent deployments</li>
              <li><strong>Event-Driven:</strong> Apache Kafka handles event messaging between API server and build containers</li>
              <li><strong>Log Analytics:</strong> ClickHouse provides high-performance storage and querying for deployment logs</li>
              <li><strong>CDN Delivery:</strong> S3 static hosting with subdomain-based routing for instant global access</li>
            </ul>
          </section>

          {/* Project URLs */}
          <section id="project-urls" className="docs-section">
            <h2>Project URLs & Access</h2>

            <h3>URL Structure</h3>
            <p>All deployed projects are accessible via the following URL format:</p>
            <div className="code-block">
              <code>http://[project-name].localhost:8000</code>
            </div>

            <h3>URL System Features</h3>
            <ul>
              <li><strong>Automatic Subdomain Assignment:</strong> Generated automatically based on your specified project name</li>
              <li><strong>Status Indicators:</strong> Visual feedback showing whether the site is currently online or offline</li>
              <li><strong>Clipboard Integration:</strong> One-click URL copying for easy sharing</li>
              <li><strong>Direct Navigation:</strong> Click URLs to immediately access your deployed projects</li>
            </ul>


            <h3>URL Display Locations</h3>
            <p>Project URLs are accessible from multiple locations within the platform:</p>
            <ul>
              <li>Project cards in the dashboard view</li>
              <li>Detailed project information pages</li>
              <li>Post-deployment confirmation screens</li>
              <li>User profile projects section</li>
            </ul>
          </section>

          {/* User Profile */}
          <section id="user-profile" className="docs-section">
            <h2>User Profile</h2>

            <h3>Authentication Methods</h3>
            <p>Nexus Cloud supports two authentication methods powered by Firebase:</p>
            <ul>
              <li><strong>Google OAuth:</strong> One-click sign-in with your Google account. Automatically imports display name, email, and profile photo.</li>
              <li><strong>Email/Password:</strong> Traditional sign-up with email verification. Set a display name during registration.</li>
            </ul>

            <h3>Profile Components</h3>
            <ul>
              <li><strong>User Information:</strong> Display name, email address, phone number (optional), profile photo, and authentication provider</li>
              <li><strong>Account Statistics:</strong> Total projects created, active deployments, and deployment success rate</li>
              <li><strong>Projects Overview:</strong> Grid view of all your projects with current status, last deployment time, and quick actions</li>
              <li><strong>Recent Activity:</strong> Timeline of recent deployments, project creations, and configuration changes</li>
              <li><strong>Quick Actions:</strong> Create new project, view all deployments, and update profile settings</li>
              <li><strong>Account Management:</strong> Change display name, add phone number, update password (for email accounts), and sign out</li>
            </ul>

            <h3>Profile Features</h3>
            <ul>
              <li><strong>Profile Photo:</strong> Automatically synced from Google for OAuth users, customizable for email users</li>
              <li><strong>Display Name:</strong> Shown in dashboard header and throughout the application</li>
              <li><strong>Phone Number:</strong> Optional contact information stored securely in your profile</li>
              <li><strong>Provider Badge:</strong> Visual indicator showing authentication method (Google or Email)</li>
              <li><strong>Firebase UID:</strong> Unique identifier used for secure API authentication</li>
            </ul>

            <h3>Accessing Your Profile</h3>
            <p>Navigate to your profile by clicking your profile avatar or name in the top navigation bar. The profile page provides a comprehensive overview of your account and project activity.</p>

            <div className="info-box">
              <strong>Security Note:</strong> All authentication is handled by Firebase Authentication with industry-standard encryption. Your credentials are never stored on Nexus Cloud servers.
            </div>
          </section>

          {/* Analytics */}
          <section id="analytics" className="docs-section">
            <h2>Analytics & Monitoring</h2>
            <p>Nexus Cloud provides comprehensive analytics to help you understand platform usage, deployment trends, and project performance.</p>

            <h3>Platform Analytics</h3>
            <p>The Analytics page (accessible from navigation) displays platform-wide metrics:</p>
            <ul>
              <li><strong>Total Users:</strong> Number of registered accounts across all authentication methods</li>
              <li><strong>Total Projects:</strong> Aggregate count of all projects created on the platform</li>
              <li><strong>Active Deployments:</strong> Number of projects currently in READY status and accessible</li>
              <li><strong>Deployment Success Rate:</strong> Percentage of successful deployments vs. total attempts</li>
            </ul>

            <h3>Dashboard Metrics</h3>
            <p>Your personal dashboard shows user-specific metrics with trend indicators:</p>
            <ul>
              <li><strong>Your Projects:</strong> Total number of projects you've created</li>
              <li><strong>Active Deployments:</strong> Your projects currently deployed and running</li>
              <li><strong>In Progress:</strong> Deployments currently being built or queued</li>
              <li><strong>Success Rate:</strong> Your deployment success percentage with trend arrow</li>
            </ul>

            <h3>Interactive Charts</h3>
            <div className="feature-grid">
              <div className="feature-item">
                <h4>Deployment Activity (Bar Chart)</h4>
                <p>7-day view of deployment frequency showing daily build counts. Helps identify usage patterns and peak deployment times.</p>
              </div>
              <div className="feature-item">
                <h4>Project Growth (Line Chart)</h4>
                <p>Trend line showing project creation over time. Visualizes platform adoption and user engagement.</p>
              </div>
            </div>

            <h3>Log Analytics</h3>
            <p>All deployment logs are stored in ClickHouse for advanced analytics:</p>
            <ul>
              <li><strong>Full-text Search:</strong> Search across all deployment logs to find specific errors or patterns</li>
              <li><strong>Time-series Analysis:</strong> Query logs by time ranges to analyze deployment history</li>
              <li><strong>Error Tracking:</strong> Identify common failure patterns and build errors</li>
              <li><strong>Performance Metrics:</strong> Track build times, upload speeds, and resource usage</li>
            </ul>

            <h3>Real-time Monitoring</h3>
            <ul>
              <li><strong>Live Status Updates:</strong> Dashboard refreshes every 3 seconds for latest deployment states</li>
              <li><strong>Socket.io Streaming:</strong> Real-time log output during active deployments</li>
              <li><strong>Status Notifications:</strong> Visual indicators for status changes (Queued → In Progress → Ready/Fail)</li>
              <li><strong>Deployment Timeline:</strong> Historical view of all deployment attempts with timestamps</li>
            </ul>

            <div className="info-box">
              <strong>Note:</strong> Analytics data is updated in real-time and stored indefinitely. ClickHouse enables sub-second query performance even on millions of log records.
            </div>
          </section>

          {/* Troubleshooting */}
          <section id="troubleshooting" className="docs-section">
            <h2>Troubleshooting</h2>

            <div className="troubleshoot-section">
              <h3>Deployment Failures</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> Deployment status shows FAIL after build attempt</p>
                <p><strong>Common Causes:</strong></p>
                <ul>
                  <li>Missing or incorrect build command (check package.json scripts)</li>
                  <li>Build output directory not found (must be dist/ or build/)</li>
                  <li>Missing dependencies in package.json</li>
                  <li>Environment variables required but not configured</li>
                  <li>Build errors or TypeScript compilation failures</li>
                  <li>Git repository inaccessible or private without auth</li>
                </ul>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Click the project card to view detailed deployment logs and error messages</li>
                  <li>Verify GitHub repository is public or has correct access permissions</li>
                  <li>Open ⚙️ Settings and confirm build command matches your project (e.g., npm run build)</li>
                  <li>Check that install command installs all dependencies (try npm ci for reproducible builds)</li>
                  <li>Add any required environment variables in the configuration modal</li>
                  <li>Test build locally first: run same install and build commands</li>
                  <li>Click 🔄 Retry Deploy after fixing configuration issues</li>
                  <li>Check ClickHouse logs for detailed error stack traces</li>
                </ul>
              </div>
            </div>

            <div className="troubleshoot-section">
              <h3>Project URL Not Accessible</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> Cannot access project at subdomain.localhost:8000</p>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Confirm deployment status shows READY (not IN_PROGRESS or QUEUED)</li>
                  <li>Verify S3 reverse proxy is running on port 8000 (check terminal)</li>
                  <li>Ensure subdomain format matches project name exactly (check project card)</li>
                  <li>Try accessing http://[project-name].localhost:8000 in browser</li>
                  <li>Clear browser cache and cookies, then try again</li>
                  <li>Check browser console for CORS or network errors</li>
                  <li>Verify S3 bucket contains files under the project subdomain prefix</li>
                  <li>Check that reverse proxy logs show the subdomain resolution request</li>
                  <li>Try accessing from incognito/private browsing mode</li>
                </ul>
              </div>
            </div>

            <div className="troubleshoot-section">
              <h3>Build Stuck in QUEUED Status</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> Deployment remains QUEUED for extended time</p>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Check AWS ECS console for task failure or resource limits</li>
                  <li>Verify Kafka broker is running and accepting messages</li>
                  <li>Check build-server container is running and listening to Kafka topic</li>
                  <li>Review API server logs for Kafka publish errors</li>
                  <li>Confirm ECS has available capacity to launch new tasks</li>
                  <li>Wait 2-3 minutes for ECS task provisioning (Fargate cold start)</li>
                  <li>If stuck more than 10 minutes, contact support or retry deployment</li>
                </ul>
              </div>
            </div>

            <div className="troubleshoot-section">
              <h3>GitHub Repository Access Errors</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> Git clone fails with authentication or permission errors</p>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Verify repository visibility is set to public (Settings → General → Danger Zone)</li>
                  <li>Confirm URL format: https://github.com/username/repository (no .git extension needed)</li>
                  <li>Ensure repository is not empty, archived, or deleted</li>
                  <li>Check that repository contains valid code files (not just README)</li>
                  <li>For private repos, contact support to set up GitHub App integration</li>
                  <li>Test git clone locally using same URL to verify accessibility</li>
                </ul>
              </div>
            </div>

            <div className="troubleshoot-section">
              <h3>Real-time Logs Not Streaming</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> No logs appearing during deployment or connection errors</p>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Check browser console for Socket.io connection errors</li>
                  <li>Verify API server Socket.io endpoint is accessible on port 9000</li>
                  <li>Ensure firewall or proxy allows WebSocket connections</li>
                  <li>Try refreshing the page to re-establish Socket.io connection</li>
                  <li>Check ClickHouse database for historical logs if real-time fails</li>
                  <li>Verify Kafka is successfully delivering messages to log consumers</li>
                </ul>
              </div>
            </div>

            <div className="troubleshoot-section">
              <h3>Authentication Issues</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> Cannot sign in, token expired errors, or 401 unauthorized</p>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Clear browser cookies and local storage, then sign in again</li>
                  <li>For Google OAuth: ensure popup blockers are disabled</li>
                  <li>For email/password: check email for verification link</li>
                  <li>Verify Firebase project configuration in .env matches Firebase Console</li>
                  <li>Check that Firebase Auth is enabled in Firebase Console</li>
                  <li>Try signing out completely and signing back in</li>
                  <li>If token expired, page refresh should auto-refresh token</li>
                </ul>
              </div>
            </div>

            <div className="troubleshoot-section">
              <h3>Performance and Loading Issues</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> Slow dashboard loading, unresponsive interface, or timeouts</p>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Refresh browser page to reload application state</li>
                  <li>Clear browser cache, cookies, and local storage</li>
                  <li>Verify stable internet connection (test with speed test)</li>
                  <li>Try accessing from different browser or incognito mode</li>
                  <li>Check browser console for JavaScript errors or failed API calls</li>
                  <li>Verify API server and database are running without errors</li>
                  <li>Check PostgreSQL connection pool isn't exhausted</li>
                  <li>Monitor server CPU/memory usage for resource constraints</li>
                  <li>If persistent, contact support with browser console logs</li>
                </ul>
              </div>
            </div>

            <div className="info-box">
              <strong>Still Having Issues?</strong> Check the API server logs (api-server/), build-server logs (CloudWatch), and browser console for detailed error messages. Most issues can be resolved by reviewing logs and configuration settings.
            </div>
          </section>

          {/* Platform Overview */}
          <section id="platform-overview" className="docs-section">
            <h2>Platform Architecture</h2>
            <p>Nexus Cloud operates as a microservices-based system with event-driven architecture, designed for scalability, reliability, and real-time performance.</p>

            <h3>System Components</h3>
            <div className="architecture-grid">
              <div className="architecture-item">
                <h4>🎨 Frontend Client</h4>
                <p><strong>React + Vite:</strong> Modern single-page application with responsive design, real-time updates via Socket.io, and Firebase authentication integration. Built with React hooks and context for state management.</p>
              </div>

              <div className="architecture-item">
                <h4>⚙️ API Server (Port 9000)</h4>
                <p><strong>Node.js + Express:</strong> RESTful API handling user authentication, project CRUD operations, deployment orchestration, and analytics. Uses Prisma ORM with PostgreSQL for data persistence.</p>
              </div>

              <div className="architecture-item">
                <h4>🏗️ Build Server</h4>
                <p><strong>Docker + AWS ECS Fargate:</strong> Containerized build service that clones repositories, installs dependencies, executes builds, and uploads to S3. Listens to Kafka events for deployment triggers.</p>
              </div>

              <div className="architecture-item">
                <h4>🔄 S3 Reverse Proxy (Port 8000)</h4>
                <p><strong>Node.js HTTP Server:</strong> Intelligent routing layer that maps subdomains to S3-hosted static assets. Handles DNS resolution and serves deployed applications with automatic caching.</p>
              </div>

              <div className="architecture-item">
                <h4>📊 Log Analytics System</h4>
                <p><strong>ClickHouse + Kafka:</strong> High-performance columnar database storing deployment logs with millisecond query times. Kafka streams logs in real-time from build containers to ClickHouse and Socket.io clients.</p>
              </div>

              <div className="architecture-item">
                <h4>☁️ Cloud Infrastructure</h4>
                <p><strong>AWS Services:</strong> S3 for static hosting, ECS Fargate for containerized builds, PostgreSQL RDS for relational data, and CloudWatch for monitoring and alerting.</p>
              </div>

              <div className="architecture-item">
                <h4>🔐 Authentication</h4>
                <p><strong>Firebase Auth:</strong> Secure authentication with Google OAuth 2.0 and email/password. JWT tokens validated on every API request. Supports user profiles, email verification, and password reset.</p>
              </div>

              <div className="architecture-item">
                <h4>📡 Real-time Communication</h4>
                <p><strong>Socket.io:</strong> WebSocket connections for streaming deployment logs, status updates, and notifications. Maintains persistent connections for instant updates without polling.</p>
              </div>
            </div>

            <h3>Technology Stack</h3>
            <div className="tech-stack">
              <div className="tech-category">
                <h4>Backend</h4>
                <ul>
                  <li>Node.js 18+</li>
                  <li>Express.js</li>
                  <li>Prisma ORM</li>
                  <li>PostgreSQL</li>
                  <li>Socket.io</li>
                  <li>Apache Kafka</li>
                  <li>ClickHouse</li>
                </ul>
              </div>
              <div className="tech-category">
                <h4>Frontend</h4>
                <ul>
                  <li>React 18</li>
                  <li>Vite</li>
                  <li>Firebase SDK</li>
                  <li>Recharts</li>
                  <li>Axios</li>
                  <li>React Router</li>
                </ul>
              </div>
              <div className="tech-category">
                <h4>Infrastructure</h4>
                <ul>
                  <li>Docker</li>
                  <li>AWS S3</li>
                  <li>AWS ECS Fargate</li>
                  <li>AWS ECR</li>
                  <li>AWS RDS</li>
                  <li>Cloudinary</li>
                </ul>
              </div>
            </div>

            <h3>Data Flow</h3>
            <ol>
              <li><strong>User Action:</strong> User creates project via React frontend</li>
              <li><strong>API Processing:</strong> Express API validates request, creates records in PostgreSQL via Prisma</li>
              <li><strong>Event Publication:</strong> Deployment event published to Kafka topic</li>
              <li><strong>Build Trigger:</strong> ECS task launched with Docker container listening to Kafka</li>
              <li><strong>Build Execution:</strong> Container clones repo, installs deps, runs build, uploads to S3</li>
              <li><strong>Log Streaming:</strong> Build logs sent to Kafka → ClickHouse + Socket.io → Frontend</li>
              <li><strong>DNS Resolution:</strong> S3 reverse proxy routes subdomain.localhost:8000 to S3 objects</li>
              <li><strong>User Access:</strong> Deployed application served from S3 via reverse proxy</li>
            </ol>

            <div className="info-box">
              <strong>Architecture Benefits:</strong> Microservices enable independent scaling, event-driven design ensures reliability, containerization provides isolation, and cloud services offer unlimited scalability.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DocsPage;
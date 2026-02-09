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
            <p>Welcome to Nexus Cloud. Our platform enables you to deploy GitHub repositories with automatic subdomain generation and live project URLs.</p>

            <h3>Platform Capabilities</h3>
            <ul>
              <li>Automated deployment from GitHub repositories</li>
              <li>Instant subdomain generation for each project</li>
              <li>Real-time deployment monitoring and logging</li>
              <li>Unified dashboard for multi-project management</li>
              <li>Comprehensive deployment history tracking</li>
              <li>One-click retry functionality for failed deployments</li>
            </ul>

            <h3>Prerequisites</h3>
            <ul>
              <li>Active Nexus Cloud account (click <strong>Sign Up</strong> to create one)</li>
              <li>Public or accessible GitHub repository</li>
              <li>Project build configuration (if applicable)</li>
              <li>Basic understanding of your project's deployment requirements</li>
            </ul>
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
                  <p><strong>Project Name:</strong> Select a unique identifier that will be used for your subdomain.</p>
                  <p><strong>GitHub URL:</strong> Provide the complete repository URL (format: https://github.com/username/repository).</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Initiate Deployment</h4>
                  <p>Click <strong>Deploy Project</strong> to begin the automated deployment process.</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Monitor Progress</h4>
                  <p>Track real-time deployment logs and await completion notification.</p>
                </div>
              </div>
            </div>

            <div className="info-box">
              <strong>Important:</strong> Project names are automatically formatted as subdomains. Special characters will be converted to hyphens for URL compatibility.
            </div>
          </section>

          {/* Dashboard */}
          <section id="dashboard" className="docs-section">
            <h2>Dashboard Overview</h2>
            <p>The dashboard serves as your central control hub for project and deployment management.</p>

            <h3>Key Features</h3>
            <div className="feature-grid">
              <div className="feature-item">
                <h4>Statistics Dashboard</h4>
                <p>Monitor aggregate metrics including total projects, active deployments, builds in progress, and failed deployment counts.</p>
              </div>

              <div className="feature-item">
                <h4>Project Overview</h4>
                <p>Visual grid display of all projects with real-time status indicators and quick action buttons.</p>
              </div>

              <div className="feature-item">
                <h4>Recent Activity</h4>
                <p>Chronological view of your latest deployment activities and status changes.</p>
              </div>

              <div className="feature-item">
                <h4>Quick Actions</h4>
                <p>Streamlined access to project creation and detailed project information.</p>
              </div>
            </div>

            <h3>Status Indicators</h3>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-badge status-ready">READY</span>
                <p>Project is successfully deployed and accessible</p>
              </div>
              <div className="status-item">
                <span className="status-badge status-progress">IN_PROGRESS</span>
                <p>Deployment is currently being processed</p>
              </div>
              <div className="status-item">
                <span className="status-badge status-queued">QUEUED</span>
                <p>Deployment is scheduled and awaiting execution</p>
              </div>
              <div className="status-item">
                <span className="status-badge status-failed">FAIL</span>
                <p>Deployment encountered an error (retry available)</p>
              </div>
              <div className="status-item">
                <span className="status-badge status-not-started">NOT_STARTED</span>
                <p>No deployment has been initiated</p>
              </div>
            </div>
          </section>

          {/* Project Management */}
          <section id="project-management" className="docs-section">
            <h2>Project Management</h2>

            <h3>Project Card Information</h3>
            <p>Each project is represented by a comprehensive card displaying the following details:</p>
            <ul>
              <li>Project name and current deployment status</li>
              <li>Environment designation (Production or Preview)</li>
              <li>Last deployment timestamp</li>
              <li>Live project URL (available when deployed)</li>
              <li>Action controls (View Logs, Retry Deploy)</li>
            </ul>

            <h3>Available Operations</h3>
            <div className="operations-list">
              <div className="operation-item">
                <h4>View Deployment Logs</h4>
                <p>Access detailed deployment logs by selecting any project card. Logs provide real-time insights into the build process.</p>
              </div>

              <div className="operation-item">
                <h4>Retry Failed Deployments</h4>
                <p>For deployments with FAIL status, utilize the retry function to reinitiate the build process without creating a new project.</p>
              </div>

              <div className="operation-item">
                <h4>Access Live Projects</h4>
                <p>Click on the project URL when status indicates READY to visit your deployed application.</p>
              </div>
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
                  <p>Deployment has been scheduled and is awaiting resource allocation to begin processing.</p>
                </div>
              </div>

              <div className="stage-item">
                <div className="stage-badge">2</div>
                <div className="stage-content">
                  <h4>In Progress</h4>
                  <p>Source code is being retrieved from the repository and the build process is executing.</p>
                </div>
              </div>

              <div className="stage-item">
                <div className="stage-badge">3</div>
                <div className="stage-content">
                  <h4>Ready</h4>
                  <p>Deployment completed successfully. The application is now live and accessible via its assigned URL.</p>
                </div>
              </div>

              <div className="stage-item">
                <div className="stage-badge">4</div>
                <div className="stage-content">
                  <h4>Failed</h4>
                  <p>An error occurred during deployment. Detailed logs are available for troubleshooting.</p>
                </div>
              </div>
            </div>

            <h3>Monitoring Capabilities</h3>
            <ul>
              <li><strong>Real-time Logging:</strong> Live deployment progress tracking in the project details interface</li>
              <li><strong>Automatic Refresh:</strong> Status updates occur automatically at 3-second intervals</li>
              <li><strong>Historical Records:</strong> Complete deployment history with timestamps and outcomes</li>
              <li><strong>Error Recovery:</strong> Single-click retry functionality for failed deployments</li>
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

            <h3>Profile Components</h3>

            <ul>
              <li><strong>User Statistics:</strong> Comprehensive metrics including total projects, active projects, and deployment counts</li>
              <li><strong>Projects Overview:</strong> Condensed view of all projects with current status information</li>
              <li><strong>Quick Actions:</strong> Streamlined access to project creation and detailed project views</li>
              <li><strong>Account Management:</strong> Account information display and secure sign-out functionality</li>
            </ul>

            <h3>Accessing Your Profile</h3>
            <p>Navigate to your profile by clicking your profile avatar located in the top navigation bar.</p>
          </section>

          {/* Troubleshooting */}
          <section id="troubleshooting" className="docs-section">
            <h2>Troubleshooting</h2>

            <div className="troubleshoot-section">
              <h3>Deployment Failures</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> Deployment status shows FAIL</p>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Review deployment logs for specific error messages and stack traces</li>
                  <li>Verify GitHub repository accessibility and permissions</li>
                  <li>Confirm repository contains valid build configuration files</li>
                  <li>Check for missing dependencies or environment variables</li>
                  <li>Utilize the Retry Deploy function to attempt redeployment</li>
                </ul>
              </div>
            </div>

            <div className="troubleshoot-section">
              <h3>Project URL Accessibility Issues</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> Cannot access project at generated URL</p>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Confirm deployment status indicates READY</li>
                  <li>Verify S3 reverse proxy service is operational on port 8000</li>
                  <li>Ensure subdomain format matches your project name exactly</li>
                  <li>Clear browser cache and retry accessing the URL</li>
                  <li>Check for any local network or firewall restrictions</li>
                </ul>
              </div>
            </div>

            <div className="troubleshoot-section">
              <h3>GitHub Repository Configuration</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> Repository validation or access errors</p>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Verify repository visibility is set to public or properly configured for access</li>
                  <li>Confirm URL format: https://github.com/username/repository</li>
                  <li>Ensure repository contains deployable code with proper file structure</li>
                  <li>Check that repository is not empty or archived</li>
                </ul>
              </div>
            </div>

            <div className="troubleshoot-section">
              <h3>Performance and Loading Issues</h3>
              <div className="troubleshoot-content">
                <p><strong>Symptoms:</strong> Slow dashboard loading or unresponsive interface</p>
                <p><strong>Resolution Steps:</strong></p>
                <ul>
                  <li>Refresh the browser page to reload application state</li>
                  <li>Clear browser cache and cookies for the application domain</li>
                  <li>Verify internet connection stability</li>
                  <li>Try accessing from a different browser or incognito mode</li>
                  <li>Contact support if issues persist</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Platform Overview */}
          <section id="platform-overview" className="docs-section">
            <h2>Platform Architecture</h2>
            <p>Nexus Cloud operates as an integrated system composed of multiple specialized components:</p>

            <div className="architecture-grid">
              <div className="architecture-item">
                <h4>Frontend Client</h4>
                <p>React-based user interface providing comprehensive project management capabilities and real-time deployment monitoring.</p>
              </div>

              <div className="architecture-item">
                <h4>API Server</h4>
                <p>Backend service managing user authentication, project lifecycle operations, and deployment orchestration.</p>
              </div>

              <div className="architecture-item">
                <h4>S3 Reverse Proxy</h4>
                <p>Routing layer that maps subdomains to deployed project assets stored in cloud storage.</p>
              </div>

              <div className="architecture-item">
                <h4>Build System</h4>
                <p>Automated pipeline that processes GitHub repositories and generates deployable static sites.</p>
              </div>

              <div className="architecture-item">
                <h4>Analytics System</h4>
                <p>Monitoring infrastructure tracking platform usage metrics and project performance statistics.</p>
              </div>
            </div>

            <div className="info-box">
              <strong>Note:</strong> All components communicate via secure APIs to ensure data integrity and system reliability.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DocsPage;
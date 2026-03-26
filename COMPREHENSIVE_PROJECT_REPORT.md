# NEXUS CLOUD - COMPREHENSIVE PROJECT REPORT

**Document Created:** March 21, 2026
**Current Development Branch:** Feature/billing
**Project Status:** Active Development - Billing & Usage Tracking Features

---

## TABLE OF CONTENTS
1. [Executive Overview](#executive-overview)
2. [Project Architecture](#project-architecture)
3. [Frontend Application](#frontend-application)
4. [Backend API Server](#backend-api-server)
5. [Build Server Service](#build-server-service)
6. [S3 Reverse Proxy Service](#s3-reverse-proxy-service)
7. [Technology Stack](#technology-stack)
8. [Database Architecture](#database-architecture)
9. [Key Features Summary](#key-features-summary)
10. [Infrastructure & Deployment](#infrastructure--deployment)
11. [Security Considerations](#security-considerations)

---

## EXECUTIVE OVERVIEW

### What is Nexus Cloud?

Nexus Cloud is a **full-stack web application deployment and analytics platform**. 
It allows users to:

- Deploy web applications from GitHub repositories
- Monitor deployments in real-time
- Track resource usage and billing
- Analyze deployment analytics and performance
- Manage multiple projects with different configurations
- View live deployment logs as they happen

### Core Value Propositions

1. **One-Click Deployment** - Connect GitHub repos and deploy with automatic build detection
2. **Real-Time Monitoring** - Live logs, status updates via WebSockets
3. **Usage Analytics** - Detailed metrics on build times and data egress
4. **Billing Integration** - Track costs, manage quotas, and pay via Razorpay
5. **Framework Agnostic** - Auto-detects frameworks and build configurations
6. **Multi-User & Multi-Project** - Support for multiple projects per user

### Project Composition

- **4 Independent Services** running in isolation
- **Microservices Architecture** with event-driven communication via Kafka
- **Managed Cloud Infrastructure** using Aiven for databases and message queues
- **AWS Integration** for computation (ECS) and storage (S3)
- **Real-time Communication** via Socket.io and Kafka topics

---

## PROJECT ARCHITECTURE

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                     │
│                    Client-side SPA with Firebase Auth               │
│                  Port: 5173 (dev) | Production: Vercel             │
└────────────────────────────────────────┬──────────────────────────┘
                                         │
                    ┌────────────────────┼─────────────────────┐
                    │                    │                     │
         ┌──────────▼──────────┐ ┌─────▼───────────┐  ┌──────▼──────────┐
         │   API SERVER        │ │ S3 REVERSE      │  │  Firebase Auth  │
         │   (Express + ORM)   │ │ PROXY (Proxy)   │  │  (Auth Service) │
         │   Port: 9000        │ │ Port: 8000      │  │                 │
         └──────────┬──────────┘ └─────┬───────────┘  └─────────────────┘
                    │                  │
         ┌──────────┴──────┬───────────┴────────┐
         │                 │                    │
    ┌────▼──────┐  ┌──────▼──────┐  ┌─────────▼────────┐
    │PostgreSQL │  │  Kafka      │  │  AWS ECS/S3      │
    │(Aiven)    │  │  (Aiven)    │  │  Build Server    │
    └───────────┘  └─────────────┘  │  Docker Tasks    │
                                     └──────────────────┘

─────────────────────────────────────────────────────────────────────
                      EVENT-DRIVEN FLOW

GitHub Repo  →  [User Deploy]  →  [API Creates Task]
                                        ↓
                          [ECS Spins Build Container]
                                        ↓
                      [build-server clones & builds]
                                        ↓
                      [Uploads to S3, publishes events]
                                        ↓
                      [Publish BUILD_MINUTES to Kafka]
                                        ↓
                      [User accesses deployment URL]
                                        ↓
                      [s3-reverse-proxy resolves subdomain]
                                        ↓
                      [Proxies to S3, publishes EGRESS]
                                        ↓
                      [Kafka workers aggregate usage]
                                        ↓
                      [Database updates billing data]
```

### Service Interaction Flow

```
USER INITIATES DEPLOYMENT:
1. Frontend: NewProjectPage form submitted
2. API Server: POST /projects → Creates project record
3. API Server: POST /projects/:id/deploy → Creates deployment (QUEUED)
4. API Server: Spins ECS task with build-server Docker image
5. ECS: Launches container with environment variables

BUILD EXECUTION (in ECS Container):
1. build-server main.sh: git clone repository
2. build-server script.js: Detects package manager
3. build-server script.js: Installs dependencies
4. build-server script.js: Runs build command
5. build-server script.js: Auto-detects output directory
6. build-server script.js: Compresses and uploads to S3
7. build-server script.js: Publishes logs to Kafka `container-logs` topic
8. build-server script.js: Publishes BUILD_MINUTES event to Kafka

DEPLOYMENT COMPLETION:
1. API Server: Kafka logs consumer updates deployment status
2. API Server: Emits Socket.io events to frontend
3. Frontend: Updates deployment status in real-time
4. Frontend: Displays live logs to user
5. Database: Stores final deployment status as READY

USER ACCESSES DEPLOYMENT:
1. User visits: https://subdomain.nexus-cloud.app
2. s3-reverse-proxy: Extracts subdomain from hostname
3. s3-reverse-proxy: Calls API server /api/resolve/subdomain
4. API Server: Returns PROJECT_ID and billing account
5. s3-reverse-proxy: Proxies request to S3 __outputs/{PROJECT_ID}/*
6. s3-reverse-proxy: Tracks bytes served
7. s3-reverse-proxy: Publishes EGRESS_MB event to Kafka

USAGE TRACKING:
1. API Server: billing-usage-worker consumes Kafka events
2. Worker: Validates event and checks for duplicates
3. Worker: Calculates cost based on pricing rules
4. Worker: Creates UsageEventRaw record
5. Worker: Updates UsageAggregateHourly/Daily/Monthly
6. Frontend: Displays updated billing data in real-time
```

---

## FRONTEND APPLICATION

**Location:** `/client`
**Technology:** React 19.1.1 + Vite 7.1.2
**Port:** 5173 (development) | Production: Vercel
**Type:** Single Page Application (SPA)

### Authentication & Authorization

- **Provider:** Firebase Authentication
- **Methods:** Email/Password, Google OAuth
- **Features:**
  - User registration and login
  - Forgot password functionality
  - Remember me checkbox
  - Automatic session persistence
  - Role-based access (OWNER, ADMIN, MEMBER roles in billing)

### Pages & Features

#### 1. **HomePage** - Landing/Dashboard Entry
- **Path:** `/`
- **Features:**
  - Real-time platform analytics display
  - Total users, projects, and live projects metrics
  - Analytics refresh button with loading state
  - User-personalized greeting based on auth state
  - Call-to-action for signup/login
- **Components:** GlowyWavesHero, StatCard
- **API Calls:** GET `/api/analytics`

#### 2. **LoginPage** - User Authentication
- **Path:** `/login`
- **Features:**
  - Email and password login form
  - Google OAuth single sign-on button
  - Forgot password with modal
  - Remember me checkbox
  - Form validation with error messages
  - Loading states during authentication
- **Navigation:** Links to signup page
- **Auth Method:** Firebase + Email/Password or OAuth

#### 3. **SignupPage** - User Registration
- **Path:** `/signup`
- **Features:**
  - Email and password registration
  - Display name input (optional)
  - Profile photo upload capability
  - Password confirmation validation
  - Google OAuth signup alternative
  - Optional profile picture upload
- **Components:** ImageUpload component
- **Auth Method:** Firebase + Email/Password or OAuth

#### 4. **DashboardPage** - Main User Dashboard
- **Path:** `/dashboard`
- **Key Metrics Displayed:**
  - 8 metric cards (Total Projects, Active, Deployments, Success Rate, etc.)
  - Deployment performance charts (7-day trend)
  - Success vs. Failure rate visualization
  - Deployment duration analysis
  - Environment distribution pie chart
  - Most active projects ranking
  - System health status (ECS, Docker, Kafka, S3)
- **Quick Actions:**
  - New Deployment button
  - Create Project button
  - View Logs link
  - Manage Environments button
- **Components:**
  - ProjectCard (grid view of projects)
  - DeploymentTable (recent deployments)
  - Multiple Recharts visualizations (Line, Bar, Pie charts)
- **API Calls:**
  - GET `/projects` - Fetch all user projects
  - GET `/api/deployments` - Fetch all deployments
- **Data Visualization:**
  - Recharts for interactive charts
  - Real-time metrics with auto-refresh
  - Toggle to show/hide all projects

#### 5. **NewProjectPage** - Project Creation & Deployment
- **Path:** `/new-project`
- **Main Features:**
  - GitHub repository URL input with validation
  - Project name configuration
  - Advanced build settings (collapsible)
- **Advanced Configuration:**
  - Framework selection dropdown (13+ frameworks)
  - Package manager selection (npm, pnpm, yarn, bun)
  - Build command customization with presets
  - Install command customization
  - Root directory specification (for monorepos)
  - Environment variables management (add/remove key-value pairs)
  - Configuration examples for reference
- **Deployment Features:**
  - Real-time deployment logs display with timestamps
  - Auto-scrolling log viewer
  - Log clearing functionality
  - Deployment status badge (QUEUED, IN_PROGRESS, READY, FAILED)
  - Deployment URL display with copy button
  - Status messages for different states
- **Supported Frameworks Auto-Detected:**
  - Next.js, Nuxt, Gatsby, Astro, Angular, Svelte, Remix, Eleventy, Parcel, Vite, Create-React-App, Vue, Webpack
- **API Calls:**
  - POST `/projects` - Create new project
  - POST `/projects/:projectId/deploy` - Initiate deployment
  - GET `/logs/:deploymentId` - Fetch deployment logs (polling)
- **Error Handling:** Display errors with messaging

#### 6. **ProjectDetailsPage** - Project Overview & Deployment History
- **Path:** `/projects/:projectId`
- **Features:**
  - Live deployment URL display with status badge
  - Project configuration viewing and editing capability
  - Complete deployment history list
  - Real-time deployment logs with expanded view option
  - Auto-detection of framework/package manager from logs
  - Deployment retry functionality for failed deployments
  - Auto-refresh for active deployments
- **Configuration Management:**
  - Edit project configuration modal
  - View environment variables
  - Update build/install commands
  - Suggested configurations from logs
- **Deployment Information:**
  - Status indicators (IN_PROGRESS, FAILED, QUEUED, READY)
  - Timestamps with time-ago formatting
  - Retry button for failed deployments
  - Log viewer with normal and expanded modes
- **Real-time Updates:**
  - Automatic refresh every 5s for active deployments
  - 15s refresh for queued/checking status
  - Updates logs from ClickHouse
- **API Calls:**
  - GET `/projects/:projectId` - Fetch project details
  - GET `/logs/:deploymentId` - Fetch deployment logs
  - POST `/projects/:projectId/deploy` - Retry deployment
  - PATCH `/projects/:projectId/config` - Update configuration
- **Components:** ProjectConfigModal for editing

#### 7. **AnalyticsPage** - Deployment Analytics
- **Path:** `/analytics`
- **Features:**
  - Deployment statistics dashboard
  - Status breakdown (Total, Successful, Failed, Pending)
  - Deployment history table with detailed information
  - Status badges for visual status indication
- **Metrics Tracked:**
  - Total deployments
  - Successful deployments count
  - Failed deployments count
  - Pending deployments count
- **Components:**
  - StatCard for metric display
  - DeploymentTable for history visualization
- **Note:** Currently uses mock data (no live API integration)

#### 8. **BillingPage** - Comprehensive Billing Dashboard
- **Path:** `/billing`
- **Billing Overview Metrics:**
  - Current month usage and estimated cost
  - Daily spend trends (30-day chart)
  - Usage breakdown by metric type (BUILD_MINUTES, EGRESS_MB)
  - Cost forecasting for month-end
- **Usage Management:**
  - Per-project usage breakdown table
  - Usage by metric type (BUILD_MINUTES, EGRESS_MB)
  - Cost per project calculation
  - Usage alerts (soft/hard quota levels)
- **Invoice Management:**
  - Invoice list with status badges
  - Click to view detailed invoice with line items
  - Invoice details modal showing:
    - Itemized charges
    - Period dates
    - Subtotal, tax, and total
  - Invoice PDF download capability
- **Manual Adjustments (Admin Only):**
  - Create billing adjustment form
  - Select metric type and amount
  - Add reason and notes
  - View adjustment history
- **Payment Integration:**
  - Razorpay payment gateway integration
  - Create payment order for outstanding invoice
  - Verify payment completion
  - Display payment status
- **Real-time Updates:**
  - WebSocket connection for real-time billing updates
  - Updates every 30 seconds
  - Active subscription monitoring
- **Pricing Catalog:**
  - Display all pricing rules
  - Unit costs for each metric
  - Included units per metric
  - Custom pricing if account has overrides
- **API Calls:**
  - GET `/api/billing/summary` - Billing summary with costs and usage
  - GET `/api/billing/usage/timeseries?days=30` - 30-day usage history
  - GET `/api/billing/usage/projects` - Per-project usage breakdown
  - GET `/api/billing/invoices` - List of all invoices
  - GET `/api/billing/invoices/:invoiceId` - Invoice details
  - GET `/api/billing/pricing` - Pricing catalog
  - GET `/api/billing/adjustments` - Billing adjustments history
  - POST `/api/billing/adjustments` - Create adjustment
  - POST `/api/billing/razorpay/order` - Create payment order
  - POST `/api/billing/razorpay/verify` - Verify payment
- **Components:**
  - Recharts for spend trend visualization
  - MetricCard for billing metrics
  - Invoice modal with line items

#### 9. **PricingPage** - Service Pricing
- **Path:** `/pricing`
- **Features:**
  - Display pricing tiers and plans
  - Pricing features comparison
  - Call-to-action for signup
- **Components:** PricingSection (imported component with detailed pricing)

#### 10. **UserProfilePage** - User Profile & Account
- **Path:** `/profile/:uid`
- **Profile Information:**
  - User avatar with profile picture upload
  - Display name and email
  - Phone number (if provided)
  - Member since date formatted
  - Incomplete profile warning if phone missing
- **Account Statistics:**
  - Total projects count
  - Active projects count
  - Total deployments count
- **Project Overview:**
  - List of all user projects
  - Project status badges
  - Deployment count per project
  - Links to visit deployed projects
- **Activity Timeline:**
  - Recent activity section
  - Activity items with timestamps
  - Activity type icons and descriptions
- **Account Actions:**
  - Edit Profile button → Opens modal
  - Logout button
  - Upgrade Plan button
- **Edit Profile Modal:**
  - Update display name
  - Update email
  - Update/upload profile photo
  - Update phone number
  - Save changes with loading state
  - Error handling and display
- **API Calls:**
  - GET `/auth/user/:uid` - Fetch user profile with projects
- **Components:** ImageUpload for profile photo, PricingSection for upgrade

#### 11. **DocsPage** - Documentation
- **Path:** `/docs`
- **Features:**
  - Table of contents with navigation
  - Multiple documentation sections
  - Smooth scroll navigation
  - Active section highlighting
  - Code examples and snippets
  - API reference documentation
- **Navigation:**
  - Sticky sidebar with section links
  - Automatic active section detection on scroll
  - Click-to-scroll functionality

### Frontend Component Library

**Core Components:**
- `Navigation` - Header/navbar with logo and links
- `Footer` - Site footer
- `AuthButtons` - Login/Logout buttons
- `HeroSection` - Hero landing section
- `GlowyWavesHero` - Animated hero with wave effects
- `ProjectCard` - Individual project card
- `DeploymentTable` - Deployment history table
- `StatCard` - Metric display card
- `ProjectConfigModal` - Configuration editing modal
- `ImageUpload` - Profile/image picture upload handler
- `RequireAuth` - Route protection component
- `PricingSection` - Pricing display component

**UI Components (Shadcn-style):**
- `Badge` - Badge component
- `Button` - Reusable button component
- `Card` - Card container component

### State Management
- **React Hooks:** useState, useEffect, useRef, useMemo, useContext
- **Context API:** AuthContext for global auth state
- **Theming:** CSS-in-JS styled components
- **Real-time Updates:** Socket.io-client for WebSocket connections

### Styling & Animations
- **CSS Modules & Inline CSS**
- **Framer Motion:** For animations and transitions
- **Responsive Design:** Mobile, tablet, desktop support
- **Icons:** Lucide React for all icons
- **Charts:** Recharts for data visualization

### Built-in Utilities
- `api.js` - API client with base URL configuration
- `utils.js` - Helper functions
- `cloudinary.js` - Image upload and CDN integration

---

## BACKEND API SERVER

**Location:** `/api-server`
**Framework:** Express.js
**Port:** 9000
**Architecture:** MVC pattern with Services layer
**Database ORM:** Prisma
**Database:** PostgreSQL (Aiven Managed)

### API Routes Structure

#### **Authentication Routes** (`/auth`)
```
POST   /auth/register
       Register or update user with Firebase credentials
       Input: { firebaseUid, email, displayName, photoURL, provider }

GET    /auth/user/:firebaseUid
       Retrieve user data with all associated projects
       Returns: User object with projects and latest deployment info
```

#### **Project Routes** (`/projects`)
```
POST   /projects
       Create new project from GitHub repository
       Auth: requireAuth
       Input: { name, gitURL, env, rootDir, buildCommand, installCommand, framework, packageManager }
       Returns: Created project object with subdomain

GET    /projects
       Get all projects for authenticated user
       Auth: requireAuth
       Returns: Array of user's projects with latest deployment

GET    /projects/:id
       Get single project details
       Returns: Project with all deployments and computed URLs

PATCH  /projects/:projectId/config
       Update project configuration
       Auth: requireAuth
       Input: { env, rootDir, buildCommand, installCommand, framework, packageManager }
       Returns: Updated project

POST   /projects/:projectId/deploy
       Deploy/redeploy a project
       Auth: requireAuth
       Returns: Deployment object with status
       Action: Spins up ECS Fargate task with build-server container
```

#### **Deployment Routes** (`/api/deployments`)
```
POST   /api/deploy
       Create deployment (legacy endpoint)
       Auth: requireAuth
       Returns: New deployment in QUEUED status

GET    /api/deployments
       Get all deployments for authenticated user
       Auth: requireAuth
       Returns: Last 20 deployments with status

GET    /api/deployments/:deploymentId/status
       Get deployment status
       Auth: verifyAuth
       Returns: { status, projectName, projectId }

GET    /api/deployments/:deploymentId/url
       Get live deployment URL
       Auth: verifyAuth
       Returns: { url: "https://subdomain.nexus-cloud.app" }
       Note: Only returns if status is READY

PATCH  /api/deployments/:id/status
       Update deployment status (internal use)
       Values: NOT_STARTED, QUEUED, IN_PROGRESS, READY, FAIL
       Returns: Updated deployment

POST   /api/deployments/:id/simulate
       Simulate deployment process for testing
       Returns: Simulated deployment with randomized status
```

#### **Billing Routes** (`/api/billing`)
All routes require: `requireAuth`, `billingRateLimiter` (200 req/15 min), `attachBillingAccount`

**Summary & Analytics:**
```
GET    /api/billing/summary
       Get billing summary for current month
       Returns: {
         currentMonthUsage: { BUILD_MINUTES, EGRESS_MB },
         estimatedCostUsd: number,
         billingAlerts: [{ type, level, message }],
         sevenDayTrend: [{ date, cost }]
       }

GET    /api/billing/usage/timeseries?days=30
       Get usage data over time period
       Query param: days (default 30)
       Returns: Array of daily usage aggregates with costs

GET    /api/billing/usage/projects
       Get per-project usage breakdown
       Returns: Array of projects with usage metrics sorted by cost
```

**Invoices:**
```
GET    /api/billing/invoices
       Get all invoices for user
       Returns: Array of invoices with line items and status

GET    /api/billing/invoices/:invoiceId
       Get specific invoice details
       Returns: Detailed invoice with:
         - Period dates
         - Line items (project, metric, quantity, cost)
         - Subtotal, tax, total
         - PDF URL if generated
```

**Pricing:**
```
GET    /api/billing/pricing
       Get pricing catalog for user
       Returns: { BUILD_MINUTES, EGRESS_MB } with unit prices and included units
```

**Razorpay Payment Integration:**
```
POST   /api/billing/razorpay/order
       Create Razorpay payment order
       Auth: requireAuth + OWNER/ADMIN role
       Input: { amountUsd } (optional, resolves to open invoice or MTD if not provided)
       Returns: { orderId, keyId, amount, currency }
       Action: Converts USD to INR, creates Razorpay order

POST   /api/billing/razorpay/verify
       Verify Razorpay payment
       Auth: requireAuth + OWNER/ADMIN role
       Input: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
       Returns: Verification result and payment record
       Action: Validates signature, creates payment event

POST   /api/billing/webhook/razorpay
       Razorpay webhook handler
       Note: Raw body required (not parsed)
       Action: Validates webhook signature, creates payment event
```

**Manual Adjustments (Admin):**
```
GET    /api/billing/adjustments
       Get billing adjustments history
       Auth: requireAuth + OWNER/ADMIN role
       Returns: Array of last 100 adjustments

POST   /api/billing/adjustments
       Create manual billing adjustment
       Auth: requireAuth + OWNER/ADMIN role
       Input: { projectId, metricType, amountUsd, reason, notes }
       Returns: Created adjustment record
```

#### **Analytics Routes** (`/api/analytics`)
```
GET    /api/analytics
       Get platform-wide analytics
       Returns: { totalUsers, totalProjects, activeProjects, liveProjects }

GET    /api/resolve/:subdomain
       Resolve subdomain to project
       Returns: { projectId, billingAccountId, projectName }
       Action: Used by s3-reverse-proxy to route requests
```

#### **Logs Routes** (`/logs`)
```
GET    /logs/:id
       Get deployment logs from ClickHouse
       Returns: Array of log events with timestamps and content
       Note: Used for deployment log streaming
```

### Backend Middleware

**Authentication Middleware:**
- `requireAuth` - Validates Firebase UID header, must exist in database
- `verifyAuth` - Alternative auth validation via Authorization bearer token
- `billingRateLimiter` - Rate limit billing endpoints to 200 req/15 min
- `requireBillingRole(allowedRoles)` - Check user billing account role (OWNER/ADMIN)
- `attachBillingAccount` - Fetch and attach primary billing account to request

**Error Handling:**
- `errorHandler` - Global error middleware with logging
- `notFoundHandler` - Catch undefined routes
- All errors return consistent format: `{ success: false, error: {...} }`

### Backend Services Architecture

#### **Auth Service**
- `registerOrUpdateUser(userData)` - Create/update user in database
- `getUserWithProjects(firebaseUid)` - Fetch user with all projects

#### **Project Service**
- `validateGitHubRepository(gitURL)` - Validate GitHub URL and check repo exists
- `createProject(name, gitURL, userId, config)` - Create new project with validation
- `getUserProjects(userId)` - Fetch all projects for user
- `getProjectById(projectId)` - Get project with deployments
- `updateProjectConfig(projectId, userId, config)` - Update project settings
  - Supports framework-specific build command optimization
  - Auto-detects package managers from lock files
  - Frameworks: Next.js, Vite, React, Vue, Angular, etc.

#### **Deployment Service**
- `createDeployment(projectId, userId)` - Create QUEUED deployment and spin ECS task
- `getDeploymentStatus(deploymentId, userId)` - Get deployment status
- `getDeploymentUrl(deploymentId, userId)` - Get URL if READY, else error
- `getUserDeployments(userId)` - Get last 20 deployments
- `updateDeploymentStatus(deploymentId, status)` - Update status in database
- `simulateDeploymentProcess(deploymentId)` - Test deployment with random delays

#### **Analytics Service**
- `getPlatformAnalytics()` - Count total users, projects, active projects
- `resolveSubdomain(subdomain)` - Map subdomain → projectId + billingAccountId
- `resolveBillingAccountIdForProject(project)` - Get account from project membership

#### **Billing Service** (Core billing logic)
- `getBillingSummaryForUser(userId)` - Summary: usage, costs, alerts, 7-day trend
- `getUsageTimeseries(userId, days)` - Daily aggregates for time period
- `getProjectUsageBreakdown(userId)` - Per-project usage and costs
- `getInvoicesForUser(userId)` - All invoices with line items
- `getInvoiceDetailsForUser(userId, invoiceId)` - Specific invoice details
- `getPricingForUser(userId)` - Pricing rules for account
- `createBillingAdjustment(userId, payload)` - Manual adjustment creation
- `getBillingAdjustments(userId)` - Adjustment history

#### **Billing Account Service**
- `ensureBillingAccountForUser(user)` - Create account if doesn't exist
- `getPrimaryBillingAccountForUser(userId)` - Get primary account
- `getBillingRole(userId, accountId)` - User's role in account (OWNER/ADMIN/MEMBER)

#### **Billing Pricing Service**
- `getEffectivePrice(accountId, metricType, date)` - Get unit price
- `calculateMetricCharge(accountId, metricType, quantity, alreadyConsumed, date)` - Calculate charge with overages
- `getPricingCatalog(accountId)` - All pricing rules
- Supports overage calculation beyond included units

#### **Billing Razorpay Service**
- `createOrderForUser(user, payload)` - Create Razorpay order
  - Resolves payable amount (open invoice or MTD usage)
  - Converts USD → INR
- `verifyPaymentForUser(user, payload)` - Verify payment signature
- `handleRazorpayWebhook(rawBody, signature)` - Process webhook
- `validatePaymentSignature(orderId, paymentId, signature)` - HMAC-SHA256 verification

#### **Billing Invoice Service**
- `finalizeMonthlyInvoice(accountId, date)` - Generate invoice for month
  - Creates line items from usage aggregates
  - Generates PDF with PDFKit
  - Calculates subtotal, tax, total
- `generateInvoicePdf(invoice, lineItems, accountName)` - Create PDF document

#### **Logs Service**
- `getDeploymentLogs(deploymentId)` - Query ClickHouse for logs
  - Returns logs ordered by timestamp

#### **Kafka Service**
- `publishUsageEvent(event)` - Publish to Kafka with schema validation
- `getUsageProducer()` - Get/create Kafka producer
- `disconnectUsageProducer()` - Gracefully close producer

### Background Workers

#### **Billing Usage Worker** (`src/workers/billing-usage-worker.js`)
- **Trigger:** Kafka consumer group `billing-usage-consumer-v1`
- **Topic:** `billing-usage-events`
- **Function:** Process usage events and create aggregates
- **Process:**
  1. Consume usage events from Kafka
  2. Validate event schema
  3. Check for duplicate eventId
  4. Calculate cost based on pricing rules
  5. Create UsageEventRaw record
  6. Update hourly/daily/monthly aggregates atomically
  7. Send failed events to DLQ
- **Metrics Tracked:** BUILD_MINUTES, EGRESS_MB
- **Database:** Transactional updates prevent double-counting

#### **Billing Month-End Job** (`src/workers/billing-month-end-job.js`)
- **Trigger:** Cron job at 00:00 on 1st of each month
- **Function:** Finalize monthly invoices
- **Process:**
  1. Iterate through all billing accounts
  2. Check if invoice exists for month
  3. Create line items from aggregates
  4. Calculate subtotal and tax
  5. Generate PDF invoice
  6. Set status to OPEN
  7. Store in database
- **Configuration:** `ENABLE_BILLING_MONTH_END_CRON=true` to enable

### Real-Time Communication

**Socket.io Integration:**
- **Events:**
  - `subscribe` - Client joins deployment logs room (format: `deployment:DEPLOYMENT_ID`)
  - `subscribe-billing` - Client joins billing updates room
  - `logs` - Emitted when new log lines available
  - `deployment-complete` - Emitted when deployment reaches READY
  - `deployment-failed` - Emitted when deployment fails
  - Billing updates emitted every 30 seconds to subscribers
- **CORS:** Allows all origins in development
- **Transports:** WebSocket + HTTP long-polling fallback

### Kafka Integration

**Producer Setup:**
- **Broker:** Aiven managed Kafka
- **SASL:** Plaintext authentication with avnadmin user
- **SSL/TLS:** Enabled with self-signed certificate
- **Topics:**
  - `container-logs` - Build logs from ECS tasks
  - `billing-usage-events` - Usage events for billing
  - `billing-usage-events-dlq` - Failed events

**Consumer Groups:**
- `api-server-logs-consumer` - Consumes deployment logs
- `billing-usage-consumer-v1` - Consumes usage events

---

## BUILD SERVER SERVICE

**Location:** `/build-server`
**Runtime:** Docker Container (Ubuntu + Node.js 20.x)
**Execution:** AWS ECS Fargate
**Entry Point:** `main.sh` → `script.js`

### Build Execution Flow

```
┌─────────────────────────────────────────────────────┐
│ ECS Fargate Task Initialization                     │
│ - Project environment variables injected            │
│ - Build server Docker image deployed                │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │  main.sh     │
        └──────┬───────┘
               │
        ┌──────▼────────────────────┐
        │ git clone {gitRepoUrl}    │
        │ to /home/app/output       │
        └──────┬───────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ node script.js               │
        │ (Build orchestration)        │
        └──────┬──────────────────────┘
               │
    ┌──────────┴──────────────┐
    │                         │
┌───▼──────────┐   ┌──────────▼──────┐
│ Detect PM    │   │ Detect Framework │
│ and Install  │   │ and Build Cmd    │
└───┬──────────┘   └──────────┬──────┘
    │                         │
    └───────────┬─────────────┘
                │
         ┌──────▼──────────────┐
         │ Run Build Command   │
         │ (npm run build, etc)│
         └──────┬──────────────┘
                │
         ┌──────▼──────────────┐
         │ Detect Output Dir   │
         │ (dist, build, out)  │
         └──────┬──────────────┘
                │
         ┌──────▼──────────────┐
         │ Collect/Upload Files│
         │ to S3               │
         └──────┬──────────────┘
                │
         ┌──────▼──────────────┐
         │ Publish Events      │
         │ - Logs → Kafka      │
         │ - Usage → Kafka     │
         └─────────────────────┘
```

### Package Manager Detection

**Supported:**
- `pnpm` - pnpm-lock.yaml
- `yarn` - yarn.lock
- `bun` - bun.lock
- `npm` - package-lock.json (fallback)

**Auto-Detection Order:** pnpm → yarn → bun → npm

**Install Commands:**
- pnpm: `pnpm install`
- yarn: `yarn install`
- bun: `bun install`
- npm: `npm ci` (clean install)

### Framework Detection & Optimization

**Detected Frameworks (13+):**
- Next.js - Output: `.next` or `out`, Build: `npm run build`
- Vite - Output: `dist`, Build: `npm run build`
- React/CRA - Output: `build`, Build: `npm run build`
- Vue - Output: `dist`, Build: `npm run build`
- Nuxt - Output: `.output` or `dist`, Build: `npm run build`
- Angular - Output: `dist/{projectName}`, Build: `ng build`
- Svelte - Output: `build`, Build: `npm run build`
- Gatsby - Output: `public`, Build: `gatsby build`
- Remix - Output: `public/build`, Build: `npm run build`
- Astro - Output: `dist`, Build: `astro build`
- Eleventy - Output: `_site`, Build: `npm run build`
- Parcel - Output: `dist`, Build: `parcel build`
- Webpack - Output: `dist`, Build: `npm run build`

**Build Optimization:**
- **Next.js:** Automatically adds `--no-lint` flag if not explicitly set
- **Framework-specific:** Applies framework defaults if no explicit build command
- Automatically detects and handles monorepos with root directory configuration

### Output Directory Auto-Detection

**Logic:**
1. Get framework-specific candidates (dist, build, out, etc.)
2. Check for files modified after build start time
3. Traverse directories recursively to verify file presence
4. Return first directory with files
5. Fallback to framework default if nothing found

**Collected Files:** All files with relative paths relative to output directory

### Environment Variable Handling

**Project Envs Injection:**
- Input: JSON string from `PROJECT_ENVS` environment variable
- Created at: `/home/app/output/.env` for build process
- Usage: Build tools can access via `process.env`
- Example: `VITE_API_URL`, `REACT_APP_X`, etc.

### Build Output Upload to S3

**Bucket:** `nexus-cloud-v2.0`
**Region:** `ap-south-1` (Asia Pacific - Mumbai)
**Path Structure:** `__outputs/{PROJECT_ID}/{relativePath}`
**File Types:** All files with automatic MIME type detection
**Process:**
1. Collect all files from output directory
2. Detect MIME type for each file
3. Upload with proper content-type headers
4. Store metadata in S3

### Kafka Integration

#### Log Publishing
- **Topic:** `container-logs`
- **Content:** Build logs in real-time
- **Format:**
  ```javascript
  {
    PROJECT_ID: string,
    DEPLOYEMENT_ID: string,
    log: string (timestamp, log message, status, etc.)
  }
  ```
- **Frequency:** Every log line from build process
- **Consumer:** API Server logs consumer updates deployment status

#### Usage Event Publishing
- **Topic:** `billing-usage-events` (if BILLING_ACCOUNT_ID provided)
- **Event Type:** `build.completed`
- **Event Structure:**
  ```javascript
  {
    eventId: uuid,
    sourceService: 'build-server',
    eventType: 'build.completed',
    accountId: BILLING_ACCOUNT_ID,
    projectId: PROJECT_ID,
    deploymentId: DEPLOYEMENT_ID,
    metricType: 'BUILD_MINUTES',
    quantity: totalSeconds / 60,
    timestamp: ISO8601,
    metadata: {
      framework: detected_framework,
      packageManager: detected_pm,
      outputDir: output_directory
    }
  }
  ```
- **Calculation:** Total time from init() start to upload completion

### Docker Image

**Base Image:** `ubuntu:focal` with Node.js 20.x
**Size:** Includes git, npm, Node.js 20
**Bundled:**
- main.sh - Entry point script
- script.js - Build orchestration
- package.json/package-lock.json - Dependencies
- kafka.pem - Kafka CA certificate
- Node modules pre-installed

**Deployment:** ECS Fargate task with:
- CPU: Configurable (typically 0.5-2 vCPU)
- Memory: Configurable (typically 1-4 GB)
- Timeout: Auto-terminates after build completion

### Environment Variables (ECS Task Definition)

| Variable | Source | Purpose | Example |
|----------|--------|---------|---------|
| `PROJECT_ID` | Deployment | Project identifier | UUID |
| `DEPLOYEMENT_ID` | Deployment | Build instance ID | UUID |
| `BILLING_ACCOUNT_ID` | Project | Billing account (optional) | UUID or null |
| `GIT_REPOSITORY__URL` | Project | GitHub URL to clone | `https://github.com/user/repo.git` |
| `PROJECT_ENVS` | Project | JSON env vars string | `{"VITE_API":"https://api.com"}` |
| `ROOT_DIR` | Project config | Monorepo subdirectory | `packages/app` or `.` |
| `BUILD_COMMAND` | Project config | Custom build command | `npm run build:prod` |
| `INSTALL_COMMAND` | Project config | Custom install command | `npm ci --legacy-peer-deps` |
| `OUTPUT_DIR` | Project config | Custom output directory | `build` |
| `AWS_REGION` | .env | AWS region | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | .env | AWS credential | Key ID |
| `AWS_SECRET_ACCESS_KEY` | .env | AWS credential | Secret |
| `AWS_S3_BUCKET` | .env | S3 bucket name | `nexus-cloud-v2.0` |
| `KAFKA_BROKER` | .env | Kafka endpoint | `kafka.aiven.com:21090` |
| `KAFKA_USERNAME` | .env | Kafka SASL user | `avnadmin` |
| `KAFKA_PASSWORD` | .env | Kafka SASL password | Password |

### Dependencies

- `@aws-sdk/client-s3` - AWS S3 file upload
- `kafkajs` - Kafka producer
- `dotenv` - Environment variable loading
- `mime-types` - MIME type detection for uploads

---

## S3 REVERSE PROXY SERVICE

**Location:** `/s3-reverse-proxy`
**Framework:** Express.js
**Port:** 8000
**Purpose:** Route subdomains to S3-hosted static assets
**Architecture:** HTTP reverse proxy with billing metrics

### Subdomain Routing Logic

**Request Flow:**
```
User Request: https://my-project.nexus-cloud.app/index.html
      ↓
s3-reverse-proxy receives request
      ↓
Extract subdomain: "my-project"
      ↓
Call API Server: GET /api/resolve/my-project
      ↓
API returns: { projectId: "abc-123", billingAccountId: "acc-456" }
      ↓
Construct S3 URL: {BASE_PATH}/abc-123/index.html
      ↓
proxy.web(req, res, {target: S3_URL})
      ↓
Stream response to user
      ↓
Track bytes served
      ↓
Publish EGRESS_MB event to Kafka
```

### Endpoint Mappings

**Health Check:**
```
GET /health
Returns: { status: 'ok', timestamp, service: 's3-reverse-proxy' }
```

**Subdomain Proxy (All Routes):**
```
GET    /:path
PUT    /:path
POST   /:path
DELETE /:path
[All HTTP methods]

Behavior:
- Extract subdomain from request hostname
- Call API server /api/resolve/{subdomain}
- Get projectId and billingAccountId
- Proxy to S3 URL: {BASE_PATH}/{projectId}/{path}
- Track response bytes for billing
- Publish usage event if billing context available
```

### Root Path Handling (SPA Support)

**Automatic Index.html Injection:**
- Request: `GET /` or `GET /path/without/extension`
- Intercepted by: `proxy.on('proxyReq', ...)`
- Action: Append `index.html` to path
- Purpose: Support Single Page Applications (React, Vue, etc.)
- Example: `/app` becomes `/__outputs/{projectId}/index.html`

### Response Tracking & Billing

**Response Header Interception:**
```javascript
proxy.on('proxyRes', (proxyRes, req, res) => {
  proxyRes.on('data', (chunk) => {
    totalBytes += chunk.length;
  });
});
```

**Egress Event Publishing:**
- Event emitted when response streaming completes
- Includes: Total bytes served, project ID, billing account ID
- Topic: `billing-usage-events`
- Metric: `EGRESS_MB`
- Usage: Tracks data egress for billing

**Event Format:**
```javascript
{
  eventId: uuid,
  sourceService: 's3-reverse-proxy',
  eventType: 'proxy.egress',
  accountId: billingAccountId,
  projectId: projectId,
  metricType: 'EGRESS_MB',
  quantity: totalBytes / (1024 * 1024),
  timestamp: ISO8601,
  traceId: request_id or deployment_id,
  metadata: {
    path: request_path,
    bytes: total_bytes
  }
}
```

### Error Handling

**404 Not Found:**
- Subdomain not found or no active deployment
- Returns: HTML 404 page
- Used for: Undeployed projects, typos

**500 Internal Error:**
- Unexpected errors during processing
- Returns: HTML 500 page
- Used for: API call failures, etc.

**502 Bad Gateway:**
- S3 proxy failure
- Returns: HTML 502 page
- Used for: S3 connectivity issues

### Security Features

**Input Validation:**
- Subdomain extraction and validation
- API response validation
- Error handling for missing/malformed responses

**Billing Context Validation:**
- Only publishes events if accountId, projectId, contentLength provided
- Skips billing for free tier or missing context
- Enables cost tracking while allowing gradual rollout

**API Server Dependency:**
- 10-second timeout on API resolver calls
- Logs API resolution errors with context
- Graceful degradation if API unavailable

**SSL/TLS Configuration:**
- Kafka SSL configurable
- Optional custom CA certificate
- Fallback to system CA

**CORS & Headers:**
- Maintains HTTP headers from S3
- Proper content-type handling
- changeOrigin: true for S3 compatibility

### Kafka Integration

**Lazy Initialization:**
- Kafka producer created on first egress event
- Not required for service startup
- Graceful degradation if Kafka unavailable

**Connection Parameters:**
- **Broker:** Aiven managed Kafka
- **Authentication:** SASL plaintext
- **SSL/TLS:** Configurable
- **Retry Policy:** Exponential backoff (10 attempts, 300ms-30s window)
- **Timeouts:** Connection 10s, Requests 30s

**Producer Configuration:**
- Client ID: `s3-reverse-proxy` (customizable)
- Topic: `billing-usage-events` (customizable)
- DLQ: `billing-usage-events-dlq` (customizable)
- Idempotent: UUID-based eventId prevents duplicates

### Environment Variables

| Variable | Default | Purpose | Required |
|----------|---------|---------|----------|
| `PORT` | 8000 | Service port | No |
| `BASE_PATH` | - | S3 bucket URL prefix | **Yes** |
| `API_SERVER_URL` | - | API resolver endpoint | **Yes** |
| `KAFKA_BROKER` | - | Kafka connection | No (optional) |
| `KAFKA_USERNAME` | avnadmin | Kafka SASL user | No |
| `KAFKA_PASSWORD` | - | Kafka SASL password | No |
| `KAFKA_SSL` | true | Enable Kafka SSL | No |
| `KAFKA_CA_PATH` | ../api-server/kafka.pem | CA certificate path | No |
| `PROXY_KAFKA_CLIENT_ID` | s3-reverse-proxy | Kafka client ID | No |
| `BILLING_USAGE_TOPIC` | billing-usage-events | Kafka topic | No |
| `BILLING_USAGE_DLQ_TOPIC` | billing-usage-events-dlq | DLQ topic | No |

### Dependencies

- `express` - HTTP server framework
- `http-proxy` - Efficient HTTP proxying with streaming
- `axios` - HTTP client for API calls
- `kafkajs` - Kafka producer
- `dotenv` - Environment variable loading
- `uuid` - Event ID generation

---

## TECHNOLOGY STACK

### Runtime & Languages
- **Node.js** (v20.x) - Runtime environment (no explicit version constraint)
- **JavaScript** - Primary language (all services)
- **TypeScript** - Type definitions available, optional use
- **JSON** - Configuration format

### Frontend Stack
- **React** 19.1.1 - UI framework
- **Vite** 7.1.2 - Build tool and dev server
- **React Router DOM** 7.13.0 - Client-side routing
- **Framer Motion** 12.35.2 - Animations and transitions
- **Lucide React** 0.577.0 - Icon library
- **Recharts** 3.7.0 - Data visualization/charting
- **Socket.io Client** 4.8.1 - Real-time communication
- **Firebase** 12.2.1 - Authentication and database
- **ESLint** 9.33.0 - Code linting
- **TypeScript** 5.3+ (types only)

### Backend Stack
- **Express.js** 4.18.2 - Web framework
- **Prisma** 5.9.1 - ORM for database
- **Socket.io** 4.7.4 - Real-time communication
- **Kafka JS** 2.2.4 - Kafka client
- **PDFKit** 0.17.2 - PDF generation
- **Razorpay** 2.9.6 - Payment gateway
- **ClickHouse Client** 0.2.9 - Analytics database
- **AWS SDK v3** (ECS, S3) 3.511.0 - Cloud services
- **Zod** 3.22.4 - Schema validation
- **node-cron** 3.0.3 - Task scheduling
- **express-rate-limit** 7.5.0 - Rate limiting

### Build Server Stack
- **AWS SDK S3** 3.511.0 - S3 file uploads
- **Kafka JS** 2.2.4 - Event publishing
- **MIME Types** 2.1.35 - Content type detection

### S3 Reverse Proxy Stack
- **Express.js** 4.18.2 - Server framework
- **http-proxy** 1.18.1 - HTTP proxying
- **Axios** 1.6.0 - HTTP client
- **Kafka JS** 2.2.4 - Event publishing

### Databases & Data Storage
- **PostgreSQL** (Aiven Managed) - Relational database
  - User data
  - Projects and deployments
  - Billing accounts, invoices, usage tracking
  - Administrative data
- **ClickHouse** (Aiven Managed) - Analytics database
  - Deployment logs (table: log_events)
  - High-volume data ingestion
  - Time-series analytics
- **Amazon S3** - Static file storage
  - Build artifacts storage
  - Static site hosting
  - Bucket: `nexus-cloud-v2.0`
  - Region: `ap-south-1` (Asia Pacific - Mumbai)

### Message Queue & Event Streaming
- **Apache Kafka** (Aiven Managed)
  - Topics:
    - `container-logs` - Build logs
    - `billing-usage-events` - Usage metrics
    - `billing-usage-events-dlq` - Failed message queue
  - Features: SASL auth, SSL/TLS, consumer groups

### Authentication & Authorization
- **Firebase Authentication**
  - Email/password authentication
  - Google OAuth 2.0
  - Session management
  - User verification
- **Razorpay** - Payment processing
  - Live API keys for production
  - Payment order creation
  - Webhook validation

### Cloud Infrastructure
- **AWS** - Compute and storage services
  - **ECS Fargate** - Serverless container execution
    - Cluster: `builder-cluster2`
    - Task definition: `builder-task2`
    - Region: `ap-south-1` (Asia Pacific)
  - **S3** - Object storage
    - Bucket: `nexus-cloud-v2.0`
    - Version: 2.0
  - **VPC** - Virtual networking
    - Multiple subnets
    - Security groups
    - Private connectivity
- **Aiven** - Managed cloud services
  - PostgreSQL - Relational database
  - Kafka - Message streaming
  - ClickHouse - Analytics database
  - Region: Vitbhopal (India region)

### CDN & Image Services
- **Cloudinary** - Image CDN and manipulation
  - Cloud name: `dwk5hmz2o`
  - Profile picture uploads
  - Image optimization

### Additional Tools
- **Dotenv** - Environment variable management
- **UUID** - Unique identifier generation
- **Random Word Slugs** - Generate random slugs for subdomains
- **Undici** - HTTP client

### Development Tools
- **Git** - Version control (git CLI in build-server Docker)
- **Docker** - Containerization for build-server
- **ESLint** - JavaScript linting
- **TypeScript** - Type checking support
- **Node --test** - Built-in Node.js testing

---

## DATABASE ARCHITECTURE

### Relational Database (PostgreSQL via Aiven)

**Database URL:** `postgres://avnadmin:***@pg-27781e90-experientiallearning69-3592.h.aivencloud.com:17277/defaultdb`

#### Core Domain Models

##### **User Model**
```
id (UUID) - Primary key
firebaseUid (String, unique) - Firebase user ID
email (String) - User email
displayName (String) - Display name
photoURL (String) - Profile photo URL
phoneNumber (String, nullable) - Phone number for billing
provider (String) - Auth provider (google, email)
createdAt (DateTime) - Account creation timestamp
updatedAt (DateTime) - Last update timestamp

Relationships:
- projects: Project[] - User's projects
- billingMemberships: BillingAccountMember[] - Billing account memberships
- createdBillingAccounts: BillingAccount[] - Created billing accounts
- adjustments: BillingAdjustment[] - Created adjustments
```

##### **Project Model**
```
id (UUID) - Primary key
name (String) - Project name
gitURL (String) - GitHub repository URL
subDomain (String, unique) - Unique subdomain (e.g., "my-app")
customDomain (String, nullable) - Custom domain option
userId (UUID, FK) - Project owner
env (JSON) - Environment variables (nested object)
rootDir (String) - Root directory for monorepos (default: ".")
buildCommand (String) - Build command (e.g., "npm run build")
installCommand (String) - Install command (e.g., "npm ci")
framework (String) - Detected/configured framework
packageManager (String) - npm, pnpm, yarn, or bun
billingAccountId (UUID, FK) - Associated billing account
createdAt (DateTime)
updatedAt (DateTime)

Relationships:
- user: User - Project owner
- deployments: Deployment[] - Deployment history
- usageEvents: UsageEventRaw[] - Usage events for this project
- invoiceLineItems: InvoiceLineItem[] - Costs for this project
- billingAccount: BillingAccount - Associated billing account
- adjustments: BillingAdjustment[] - Manual adjustments
```

##### **Deployment Model**
```
id (UUID) - Primary key
projectId (UUID, FK) - Associated project
status (Enum: NOT_STARTED, QUEUED, IN_PROGRESS, READY, FAIL)
- NOT_STARTED: Deployment record created but not started
- QUEUED: Waiting in build queue
- IN_PROGRESS: Currently building
- READY: Build complete, deployed and accessible
- FAIL: Build failed
createdAt (DateTime) - Deployment initiation time
updatedAt (DateTime) - Last status update time

Relationships:
- project: Project - Parent project
```

#### Billing Domain Models

##### **BillingAccount Model**
```
id (UUID) - Primary key
name (String) - Account name
currency (String, default: "USD") - Currency for billing
stripeCustomerId (String, nullable) - Stripe integration
stripeSubscriptionId (String, nullable) - Stripe subscription
budgetSoftLimitUsd (Decimal, default: 100) - Soft quota limit
budgetHardLimitUsd (Decimal, default: 500) - Hard quota limit
isDunningActive (Boolean) - Payment collection status
createdByUserId (UUID, FK) - Account creator
createdAt (DateTime)
updatedAt (DateTime)

Relationships:
- members: BillingAccountMember[] - Account members
- projects: Project[] - Projects in account
- pricingRules: PricingRule[] - Custom pricing
- quotaPolicies: QuotaPolicy[] - Quota policies
- invoices: Invoice[] - Generated invoices
- usageEventsRaw: UsageEventRaw[] - Raw usage
- adjustments: BillingAdjustment[] - Adjustments
```

##### **BillingAccountMember Model**
```
id (UUID) - Primary key
billingAccountId (UUID, FK) - Billing account
userId (UUID, FK) - User
role (Enum: OWNER, ADMIN, MEMBER)
- OWNER: Full control, can manage members, billing
- ADMIN: Can manage projects and billing
- MEMBER: Can only view data
createdAt (DateTime)

Unique constraint: (billingAccountId, userId)

Relationships:
- account: BillingAccount
- user: User
```

##### **PricingRule Model**
```
id (UUID) - Primary key
accountId (UUID, FK, nullable) - Account-specific pricing (null = default)
metricType (Enum: BUILD_MINUTES, EGRESS_MB)
- BUILD_MINUTES: Build time in minutes
- EGRESS_MB: Data egress in megabytes
unitPriceUsd (Decimal 18,6) - Cost per unit (e.g., $0.0025/min)
includedUnits (Decimal 18,6) - Monthly included units (e.g., 100 free minutes)
activeFrom (DateTime) - Pricing start date
activeTo (DateTime, nullable) - Pricing end date
createdAt (DateTime)

Relationships:
- account: BillingAccount (nullable)

Default Pricing (if accountId is null):
- BUILD_MINUTES: $0.0025 with 100 included/month
- EGRESS_MB: $0.0001 with 1000 included/month
```

##### **QuotaPolicy Model**
```
id (UUID) - Primary key
accountId (UUID, FK) - Billing account
metricType (Enum: BUILD_MINUTES, EGRESS_MB)
monthlyIncluded (Decimal 18,6) - Included units/month
softLimitPercent (Integer, default: 80) - Soft quota % (alert level)
hardLimitPercent (Integer, default: 100) - Hard quota % (block level)
enforcement (Enum: SOFT, HARD)
- SOFT: Alert users, allow overages
- HARD: Block operations beyond limit
createdAt (DateTime)

Relationships:
- account: BillingAccount
```

#### Usage Tracking Models

##### **UsageEventRaw Model**
```
id (UUID) - Primary key
eventId (String, unique) - Idempotency key from event
sourceService (String) - Service that created event (build-server, s3-reverse-proxy)
eventType (String) - Type of event (build.completed, proxy.egress)
accountId (UUID, FK) - Billing account
projectId (UUID, FK) - Project
metricType (Enum: BUILD_MINUTES, EGRESS_MB)
quantity (Decimal 18,6) - Amount consumed
occurredAt (DateTime) - When event occurred
processedAt (DateTime) - When processed by worker
createdAt (DateTime)

Index: eventId for duplicate detection
Index: (accountId, metricType, occurredAt) for aggregation

Relationships:
- account: BillingAccount
- project: Project
```

##### **UsageAggregateHourly Model**
```
id (UUID) - Primary key
accountId (UUID, FK)
projectId (UUID, FK)
metricType (Enum: BUILD_MINUTES, EGRESS_MB)
bucketStart (DateTime) - Hour bucket start
quantity (Decimal 18,6) - Total consumed in hour
unitCostUsd (Decimal 18,6) - Unit price in effect
costUsd (Decimal 18,6) - Total cost for hour
createdAt (DateTime)

Unique constraint: (accountId, projectId, metricType, bucketStart)

Relationships:
- account: BillingAccount
- project: Project
```

##### **UsageAggregateDaily Model**
```
id (UUID) - Primary key
accountId (UUID, FK)
projectId (UUID, FK)
metricType (Enum: BUILD_MINUTES, EGRESS_MB)
bucketDate (Date) - Date bucket
quantity (Decimal 18,6)
unitCostUsd (Decimal 18,6)
costUsd (Decimal 18,6)
createdAt (DateTime)

Unique constraint: (accountId, projectId, metricType, bucketDate)

Relationships:
- account: BillingAccount
- project: Project
```

##### **UsageAggregateMonthly Model**
```
id (UUID) - Primary key
accountId (UUID, FK)
projectId (UUID, FK)
metricType (Enum: BUILD_MINUTES, EGRESS_MB)
monthStart (Date) - First day of month
quantity (Decimal 18,6)
unitCostUsd (Decimal 18,6)
costUsd (Decimal 18,6)
createdAt (DateTime)

Unique constraint: (accountId, projectId, metricType, monthStart)

Relationships:
- account: BillingAccount
- project: Project
```

#### Invoice Models

##### **Invoice Model**
```
id (UUID) - Primary key
accountId (UUID, FK) - Associated billing account
periodStart (DateTime) - Billing period start
periodEnd (DateTime) - Billing period end
status (Enum: DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE, FAILED)
- DRAFT: Not yet finalized
- OPEN: Awaiting payment
- PAID: Payment received
- VOID: Cancelled invoice
- UNCOLLECTIBLE: Bad debt
- FAILED: Payment failed
subtotalUsd (Decimal 18,6) - Sum of line items
taxUsd (Decimal 18,6) - Tax amount
totalUsd (Decimal 18,6) - Total due
stripeInvoiceId (String, nullable) - Stripe sync
externalPdfUrl (String, nullable) - PDF storage URL
snapshotJson (JSON) - Metadata snapshot
createdAt (DateTime)
updatedAt (DateTime)

Relationships:
- account: BillingAccount
- lineItems: InvoiceLineItem[] - Itemized charges
- paymentEvents: PaymentEvent[] - Payment history
```

##### **InvoiceLineItem Model**
```
id (UUID) - Primary key
invoiceId (UUID, FK) - Parent invoice
metricType (String) - Metric name (BUILD_MINUTES, EGRESS_MB)
projectId (UUID, FK, nullable) - Optional project
description (String) - Human-readable description
quantity (Decimal 18,6) - Units consumed
unitPriceUsd (Decimal 18,6) - Cost per unit
amountUsd (Decimal 18,6) - Total cost (quantity × unitPrice)
metadata (JSON) - Additional info
createdAt (DateTime)

Relationships:
- invoice: Invoice
- project: Project (nullable)
```

##### **PaymentEvent Model**
```
id (UUID) - Primary key
accountId (UUID, FK) - Billing account
invoiceId (UUID, FK, nullable) - Associated invoice
stripeEventId (String, unique, nullable) - Stripe event ID
stripeObjectId (String, nullable) - Stripe object ID
status (Enum: SUCCESS, FAILED, PENDING)
amountUsd (Decimal 18,6) - Payment amount
eventType (String) - Payment event type (razorpay.payment, stripe.charge, etc.)
payload (JSON) - Full event payload
createdAt (DateTime)
updatedAt (DateTime)

Relationships:
- account: BillingAccount
- invoice: Invoice (nullable)
```

#### Support Models

##### **BillingAdjustment Model**
```
id (UUID) - Primary key
accountId (UUID, FK) - Billing account
projectId (UUID, FK, nullable) - Project-specific adjustment
createdByUserId (UUID, FK) - Who created adjustment
metricType (String) - Metric being adjusted
amountUsd (Decimal 18,6) - Adjustment amount (positive/negative)
reason (String) - Short reason (PROMOTIONAL, ERROR, REFUND, etc.)
notes (String) - Detailed notes
createdAt (DateTime)

Relationships:
- account: BillingAccount
- project: Project (nullable)
- createdBy: User
```

##### **WebhookEvent Model**
```
id (UUID) - Primary key
provider (String) - Event provider (razorpay, stripe, etc.)
eventId (String, unique) - Provider event ID
eventType (String) - Webhook event type
payload (JSON) - Full webhook payload
processed (Boolean) - Processing status
createdAt (DateTime)

Relationships: None
```

---

## KEY FEATURES SUMMARY

### 1. **Deployment Management**
- ✅ Connect GitHub repositories
- ✅ Automatic framework detection (13+ frameworks)
- ✅ Automatic build configuration
- ✅ Multiple package manager support (npm, pnpm, yarn, bun)
- ✅ Custom build/install commands
- ✅ Root directory support for monorepos
- ✅ Environment variable configuration
- ✅ Real-time deployment logs via Kafka + ClickHouse
- ✅ Deployment status tracking (QUEUED, IN_PROGRESS, READY, FAIL)
- ✅ Deployment retry for failed builds
- ✅ Live deployment URLs with subdomain routing
- ✅ 1-click redeployment

### 2. **Real-Time Features**
- ✅ WebSocket-based log streaming (Socket.io)
- ✅ Live deployment status updates
- ✅ Real-time billing metrics
- ✅ Kafka-based event streaming
- ✅ ClickHouse for high-volume log storage
- ✅ 30-second billing updates to dashboard

### 3. **Project Management**
- ✅ Create multiple projects per user
- ✅ Project configuration management
- ✅ Environment variables per project
- ✅ Deployment history viewing
- ✅ Logs viewing and filtering
- ✅ Project statistics and metrics
- ✅ Custom domain support (optional)

### 4. **Billing & Usage Tracking**
- ✅ Real-time usage tracking (BUILD_MINUTES, EGRESS_MB)
- ✅ Hourly/Daily/Monthly aggregation
- ✅ Per-project usage breakdown
- ✅ Cost calculation with custom pricing
- ✅ Monthly invoice generation with PDF
- ✅ Invoice archival and retrieval
- ✅ Razorpay payment integration
- ✅ Manual billing adjustments (admin only)
- ✅ Soft/hard quota limits
- ✅ Usage alerts and warnings
- ✅ Pricing catalog display
- ✅ Exchange rate handling (USD/INR)

### 5. **Authentication & Authorization**
- ✅ Firebase email/password authentication
- ✅ Google OAuth 2.0
- ✅ User registration and login
- ✅ Forgot password flow
- ✅ Remember me functionality
- ✅ Role-based access (OWNER, ADMIN, MEMBER)
- ✅ Billing account membership
- ✅ User profile management

### 6. **Analytics & Monitoring**
- ✅ Platform-wide analytics (total users, projects, active projects)
- ✅ Deployment statistics dashboard
- ✅ Deployment trend analysis (7-day)
- ✅ Success/failure rate metrics
- ✅ Deployment duration analysis
- ✅ Environment distribution charts
- ✅ Per-project performance metrics
- ✅ System health status (ECS, Docker, Kafka, S3)

### 7. **Infrastructure & Deployment**
- ✅ AWS ECS Fargate serverless builds
- ✅ S3 static asset hosting
- ✅ Subdomain-based project routing
- ✅ S3 reverse proxy for transparent serving
- ✅ VPC networking with security groups
- ✅ Automatic container scaling (ECS)
- ✅ Docker containerization
- ✅ HTTPS/TLS support

### 8. **Developer Experience**
- ✅ Framework auto-detection (Next.js, Vite, React, Vue, Angular, etc.)
- ✅ Build command auto-detection
- ✅ Output directory auto-detection
- ✅ Package manager auto-detection
- ✅ Configuration presets for common frameworks
- ✅ Detailed build logs
- ✅ Error messages and troubleshooting
- ✅ API documentation (Docs page)

### 9. **Data & Security**
- ✅ PostgreSQL relational database
- ✅ Data encryption in transit (TLS)
- ✅ Firebase security rules
- ✅ Rate limiting on API endpoints
- ✅ CORS protection
- ✅ Razorpay signature verification
- ✅ Idempotent event processing
- ✅ User authentication verification

### 10. **Scalability**
- ✅ Kafka-based event streaming (scales to millions of events)
- ✅ ClickHouse for log storage (time-series optimized)
- ✅ PostgreSQL replication (Aiven managed)
- ✅ S3 for unlimited storage
- ✅ ECS auto-scaling for builds
- ✅ Hourly/Daily/Monthly aggregation (reduces query load)
- ✅ Connection pooling and rate limiting

---

## INFRASTRUCTURE & DEPLOYMENT

### Cloud Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AIVEN MANAGED SERVICES                       │
├─────────────────────────────────────────────────────────────────┤
│ PostgreSQL              Kafka                ClickHouse          │
│ (Relational DB)         (Event Streaming)    (Analytics DB)     │
│ - Users                 - container-logs     - log_events       │
│ - Projects              - billing-events    │ - Deployment logs  │
│ - Deployments           - billing-dlq       │ - Timeseries data  │
│ - Billing data                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↑
                ┌────────────┼────────────┐
                │            │            │
         ┌──────▼──┐  ┌──────▼──┐  ┌─────▼──────┐
         │  API    │  │S3 Rev   │  │ Build      │
         │ Server  │  │ Proxy   │  │ Server     │
         │ (9000)  │  │ (8000)  │  │ (ECS)      │
         └──────┬──┘  └──────┬──┘  └─────┬──────┘
                │            │           │
                │     ┌──────┴───────────┘
                │     │
         ┌──────┴─────▼──┐
         │    AWS S3     │
         │ {__outputs/}  │
         └───────────────┘
                ↑
              (Uses)
         AWS ECS Fargate
         (Builds run here)
```

### AWS Infrastructure Components

#### **AWS ECS (Elastic Container Service)**
- **Cluster:** `builder-cluster2`
- **Service:** Build execution
- **Task Definition:** `builder-task2`
- **Region:** `ap-south-1` (Asia Pacific - Mumbai)
- **Scaling:** Auto-scales based on deployment queue
- **Container:** Docker image with build-server code
- **Networking:** VPC with 3 subnets, security group
- **Execution:** Fargate (serverless) pricing model

**Security Group:** `sg-041431be00b10ac41`
- Inbound: None (internal VPC only)
- Outbound: Allow all (needed for package downloads, git clone)

**Subnets:** 3 private subnets for redundancy

#### **AWS S3 (Simple Storage Service)**
- **Bucket:** `nexus-cloud-v2.0`
- **Region:** `ap-south-1` (Asia Pacific - Mumbai)
- **Storage Path:** `__outputs/{PROJECT_ID}/{files}`
- **Access:** Private bucket with IAM key authentication
- **Served via:** s3-reverse-proxy for subdomain routing
- **Versioning:** Disabled (not needed)
- **Public Access:** Blocked (only via reverse proxy)

#### **AWS IAM**
- **Service Account:** API server and build-server
- **Permissions:** ECS task launch, S3 read/write
- **Keys:** Exposed in .env files (security concern)

### Aiven Managed Services

#### **PostgreSQL Database**
- **Host:** `pg-27781e90-experientiallearning69-3592.h.aivencloud.com`
- **Port:** 17277
- **Database:** `defaultdb`
- **User:** `avnadmin`
- **SSL Mode:** `require` (mandatory TLS)
- **CA Certificate:** `ca.pem` (Aiven-signed)
- **Features:**
  - Automated backups
  - High availability (replication)
  - Connection pooling
  - Monitoring and alerts

**Tables:**
- User, Project, Deployment (core)
- BillingAccount, BillingAccountMember (billing)
- UsageEventRaw, UsageAggregateHourly, UsageAggregateDaily, UsageAggregateMonthly (usage)
- Invoice, InvoiceLineItem, PaymentEvent (invoicing)
- PricingRule, QuotaPolicy, BillingAdjustment (policies)
- WebhookEvent (webhooks)

#### **Apache Kafka**
- **Host:** `kafka-16fc4329-vitbhopal-256e.k.aivencloud.com`
- **Port:** 21090 (SSL/TLS)
- **Auth:** SASL Plaintext (avnadmin / password)
- **Features:**
  - Message persistence
  - Consumer groups
  - Topic replication
  - Dead-letter queue support

**Topics:**
```
container-logs
├─ Partition count: 1 or more
├─ Replication factor: 2+
├─ Message format: { PROJECT_ID, DEPLOYEMENT_ID, log }
└─ Retention: 7 days (default)

billing-usage-events
├─ Partition count: 3+
├─ Replication factor: 2+
├─ Message format: Usage event JSON
├─ Retention: 30 days
└─ Consumer groups: billing-usage-consumer-v1

billing-usage-events-dlq
├─ Purpose: Dead-letter queue for failed billing events
└─ Retention: 90 days
```

#### **ClickHouse**
- **Host:** `clickhouse-3da3b8a-vitbhopal-256e.i.aivencloud.com`
- **Port:** 21078 (HTTPS)
- **Auth:** avnadmin / password
- **Features:**
  - Time-series optimized
  - Column-oriented storage
  - Real-time analytics
  - Fast aggregation queries

**Tables:**
```
log_events
├─ Columns: event_id, deployment_id, log, timestamp
├─ Primary key: (deployment_id, timestamp)
├─ Retention: 90 days (default)
└─ Used for: Real-time log display and archival
```

### Domain & DNS

**Production Domain:** `nexus-cloud.tech`
**Subdomain Routing:** `*.nexus-cloud.tech` → s3-reverse-proxy (port 8000)
**Vercel Frontend:** `nexus-cloud-v2-0.vercel.app` (deployed frontend)

**DNS Configuration:**
```
nexus-cloud.tech A → API Server (production)
*.nexus-cloud.tech CNAME → s3-reverse-proxy or ALB
localhost:5173 → Frontend dev server (dev only)
localhost:9000 → API server (dev only)
https://[project-name].nexus-cloud.tech → S3 reverse proxy (wildcard subdomain routing)
```

### Deployment Pipeline

**Frontend:**
1. Deploy to Vercel (CI/CD automatic)
2. Static builds stored in Vercel CDN
3. Environment variables in Vercel console

**Backend Services:**
1. API Server - Could be deployed to: Render, Railway, EC2, Heroku
2. Build Server - ECS task definition (Docker image)
3. S3 Reverse Proxy - Could be deployed to: Render, EC2, Vercel (Node.js)

**Current Setup (from .env):**
- API Server: `https://nexus-cloud-v2-0.onrender.com` (production option)
- Local dev: `http://localhost:9000`

### Environment Configuration by Service

```
API Server (.env):
├─ Database: DATABASE_URL
├─ AWS: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
├─ Kafka: KAFKA_BROKER, KAFKA_USERNAME, KAFKA_PASSWORD
├─ ClickHouse: CLICKHOUSE_HOST, CLICKHOUSE_PASSWORD
├─ ECS: ECS_CLUSTER, ECS_TASK, SUBNET_1-3, SG, CONTAINER_NAME
├─ CORS: ALLOWED_ORIGINS
├─ Billing: BILLING_TAX_RATE
└─ Razorpay: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET

Build Server (.env):
├─ AWS: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
└─ Kafka: KAFKA_BROKER, KAFKA_USERNAME, KAFKA_PASSWORD

Client (.env):
├─ Firebase: VITE_FIREBASE_* (all required)
├─ Cloudinary: VITE_CLOUDINARY_CLOUD_NAME
└─ Analytics: VITE_FIREBASE_MEASUREMENT_ID

S3 Reverse Proxy (.env):
├─ Routing: BASE_PATH, API_SERVER_URL
├─ Kafka: KAFKA_BROKER, KAFKA_USERNAME, KAFKA_PASSWORD, BILLING_USAGE_TOPIC
└─ Server: PORT
```

---

## SECURITY CONSIDERATIONS

### Current Security Posture

#### Strengths ✅
1. **Firebase Authentication** - Industry-standard auth provider
2. **TLS/SSL Encryption**
   - PostgreSQL requires TLS
   - Kafka uses SSL/TLS with certificates
   - ClickHouse HTTPS
3. **Rate Limiting** - Billing endpoints rate-limited (200 req/15 min)
4. **CORS Protection** - Configured CORS for API
5. **Environment Separation** - Dev and production environments
6. **Database Transactions** - Atomicity in billing operations
7. **Event Idempotency** - UUID-based event IDs prevent duplicates
8. **Signature Verification** - Razorpay webhook validation (HMAC-SHA256)
9. **Authorization Checks**
   - requireAuth middleware validates user ownership
   - Billing role-based access (OWNER/ADMIN)
   - User validation for projects and deployments

#### Vulnerabilities & Security Concerns ⚠️

1. **Exposed AWS Credentials** (CRITICAL)
   - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY hardcoded in .env files
   - Visible in repository history
   - Visible in Docker build artifacts
   - **Recommendation:** Use AWS IAM roles (IRSA for ECS), AWS Secrets Manager

2. **Exposed Kafka Credentials** (CRITICAL)
   - KAFKA_PASSWORD plaintext in .env
   - Multiple services share same credentials
   - No rotation policy visible
   - **Recommendation:** Use AWS Secrets Manager, rotate credentials regularly

3. **Hardcoded Razorpay Keys** (HIGH)
   - RAZORPAY_KEY_SECRET visible in .env
   - Should be environment-only, not in repo
   - **Recommendation:** Move to secrets management, use restricted keys

4. **Webhook Secret Weakness** (MEDIUM)
   - RAZORPAY_WEBHOOK_SECRET = "12346" (too simple)
   - Should be cryptographically secure random value
   - **Recommendation:** Use 32+ character random secret

5. **HTTP in Development Configuration** (MEDIUM)
   - Local API calls use `http://localhost:9000`
   - Should use HTTPS in production
   - API_SERVER_URL commented as production URL shows wrong protocol risk
   - **Recommendation:** Enforce HTTPS in production

6. **Incomplete CORS Configuration** (MEDIUM)
   - ALLOWED_ORIGINS has multiple hardcoded values
   - Includes localhost (development)
   - Should be environment-specific
   - **Recommendation:** Use environment variable for origins

7. **No Request Signing** (MEDIUM)
   - Internal API calls lack signatures
   - Relies only on Firebase UID header
   - Could be spoofed if headers not validated properly
   - **Recommendation:** Add request signing (HMAC) for sensitive operations

8. **Logs in Plaintext** (MEDIUM)
   - Deployment logs stored in ClickHouse without encryption at rest
   - Contains build commands, env vars, errors
   - May contain sensitive information
   - **Recommendation:** Encrypt ClickHouse data at rest, filter sensitive data

9. **No Input Validation on Custom Build Commands** (MEDIUM)
   - Users can specify custom build commands
   - Potential command injection in ECS task
   - **Recommendation:** Sandbox/validate build commands before execution

10. **Missing Update/Patch Notifications** (LOW)
    - No visible security update process
    - npm dependencies may have vulnerabilities
    - **Recommendation:** Regular security audits, dependabot integration

11. **Billing Webhook Race Conditions** (MEDIUM)
    - Multiple parallel webhook payments could cause issues
    - No mention of idempotency keys in webhook handling
    - **Recommendation:** Implement idempotency keys in webhook handler

### Recommended Security Improvements

#### Immediate (Critical)
1. Rotate all exposed AWS credentials
2. Rotate all Kafka credentials
3. Rotate Razorpay keys
4. Move all secrets to AWS Secrets Manager/Parameter Store
5. Update .gitignore to prevent future credential leaks
6. Check git history for credential exposure (use git-secrets)

#### Short-term (High Priority)
1. Implement IAM roles for ECS tasks (IRSA)
2. Use AWS Secrets Manager for all service credentials
3. Implement request signing for inter-service communication
4. Add input validation and sandboxing for build commands
5. Generate cryptographically secure webhook secrets
6. Enforce HTTPS in production (use HTTPS-only cookies)
7. Implement rate limiting on all endpoints (not just billing)

#### Medium-term (Enhancement)
1. Add encryption at rest for ClickHouse
2. Implement comprehensive API logging and monitoring
3. Add security scanning to CI/CD pipeline
4. Regular penetration testing
5. Security headers (CSP, X-Frame-Options, etc.)
6. Implement CSRF tokens for state-changing operations
7. Add IP whitelisting for sensitive endpoints

#### Long-term (Strategic)
1. SOC 2 Type II compliance
2. Regular security audits by third-party
3. Bug bounty program
4. Advanced threat detection/SIEM
5. Zero-trust internal network architecture

---

## CONCLUSION

Nexus Cloud is a **comprehensive full-stack deployment platform** that combines:

1. **Modern DevOps** - Automatic builds, deployments, and monitoring
2. **Real-time Analytics** - Live logs, metrics, and performance data
3. **Sophisticated Billing** - Usage tracking, invoicing, and payments
4. **Enterprise-Grade Infrastructure** - AWS + Aiven managed services
5. **Developer-Friendly UX** - Framework detection, configuration wizards, one-click deployment

The platform leverages:
- **Kafka** for event streaming and real-time updates
- **ClickHouse** for high-volume analytics
- **PostgreSQL** for transactional data
- **AWS ECS** for containerized builds
- **S3** for artifact storage
- **Socket.io** for real-time UI updates
- **Firebase** for authentication

**Current Status:** Active development with focus on billing features and usage tracking integration. The codebase is well-structured with clear separation of concerns (microservices), proper error handling, and comprehensive API coverage.

**Key Strength:** The event-driven architecture using Kafka enables scalability and real-time updates across services.

**Priority Security Improvements:** Address exposed credentials, implement IAM roles, and move secrets to managed services.

---

*Report Generated: March 21, 2026*
*Current Branch: Feature/billing*
*Last Commits: Billing system, usage tracking, Kafka configuration*

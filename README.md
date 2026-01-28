# Nexus Cloud - Modern Deployment Platform

A comprehensive cloud deployment platform that enables seamless GitHub repository deployment with real-time monitoring, automatic subdomain generation, and live project hosting.

## 🚀 Features

- **GitHub Integration**: Deploy any public GitHub repository with one click
- **Automatic Subdomains**: Each project gets a unique subdomain (e.g., `my-app.localhost:8000`)
- **Real-time Deployment Logs**: Watch your build process live with streaming logs
- **User Authentication**: Secure login/signup with Google OAuth and email/password via Firebase
- **Project Management Dashboard**: Comprehensive dashboard for managing all your projects
- **Live Deployment URLs**: Instant access to deployed applications
- **Deployment Status Tracking**: Real-time status updates (Queued, In Progress, Ready, Failed)
- **Analytics & Monitoring**: Platform-wide statistics and user analytics
- **Error Handling & Retry**: Robust error handling with one-click deployment retry
- **Responsive Design**: Modern, mobile-first UI with smooth animations

## 🏗️ Architecture

The platform follows a microservices architecture with the following components:

- **api-server**: REST API backend handling user management, projects, deployments, and analytics
- **build-server**: Dockerized build service that clones, builds, and deploys projects to S3
- **s3-reverse-proxy**: Reverse proxy service that routes subdomains to appropriate S3 static assets
- **client**: React frontend application with modern UI and real-time features

### Technology Stack

- **Backend**: Node.js, Express.js, Prisma ORM, PostgreSQL
- **Frontend**: React, Vite, Firebase Authentication
- **Infrastructure**: AWS S3, AWS ECS Fargate, Docker
- **Real-time**: Socket.io, Apache Kafka, ClickHouse
- **Authentication**: Firebase Auth (Google OAuth, Email/Password)

## 📋 Prerequisites

- Node.js (v18+ recommended)
- Docker
- AWS Account (S3, ECS access)
- PostgreSQL Database
- Firebase Project
- Apache Kafka (for log streaming)
- ClickHouse (for log storage)

## 🚀 Local Setup

1. **Install dependencies** in all services:
   ```bash
   # Install dependencies for each service
   cd api-server && npm install
   cd ../build-server && npm install
   cd ../s3-reverse-proxy && npm install
   cd ../client && npm install
   ```

2. **Configure environment variables** for each service (see individual service folders for .env.example)

3. **Build and push Docker image**:
   ```bash
   cd build-server
   docker build -t nexus-build-server .
   # Push to your AWS ECR repository
   ```

4. **Setup database**:
   ```bash
   cd api-server
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Start all services**:
   ```bash
   # Terminal 1: API Server
   cd api-server && node index.js
   
   # Terminal 2: S3 Reverse Proxy
   cd s3-reverse-proxy && node index.js
   
   # Terminal 3: Frontend Client
   cd client && npm run dev
   ```

## 🌐 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| `api-server` | `:9000` | REST API endpoints |
| `s3-reverse-proxy` | `:8000` | Subdomain routing |
| `client` | `:5173` | React frontend (Vite dev server) |

## 📊 Platform Features

### Dashboard
- Project overview with status indicators
- Platform analytics (total users, projects, live deployments)
- Recent deployments monitoring

### Project Management
- Create projects from GitHub repositories
- Real-time deployment monitoring
- Deployment history and logs
- One-click deployment retry for failed builds

### User Profile
- Personal project statistics
- Account management
- Recent activity tracking

### Documentation
- Comprehensive in-app documentation
- Getting started guides
- API architecture overview

## 🔄 Deployment Flow

1. **User creates project** → GitHub repository validation
2. **Deployment triggered** → ECS container spins up
3. **Build process** → Clone → Install → Build → Upload to S3
4. **Real-time logs** → Streamed via Kafka to frontend
5. **Completion** → Project accessible via subdomain URL

## 🌍 URL Structure

- **Local Development**: `http://[project-name].localhost:8000`
- **Production**: `http://[project-name].yourdomain.com`

## 📈 Analytics

- **Platform Statistics**: Total users, projects, and live deployments
- **Real-time Monitoring**: Live deployment status and logs
- **User Analytics**: Individual user project statistics

## 🛡️ Security

- **Firebase Authentication**: Secure user management
- **API Authentication**: Firebase UID-based request validation
- **Input Validation**: GitHub repository validation before deployment
- **Error Handling**: Comprehensive error management and user feedback

## 🎯 Demo

[Watch The Demo Video](https://imgur.com/I6KgmNR)

## 📐 Architecture Diagram

![Nexus Cloud Architecture](https://i.imgur.com/r7QUXqZ.png)

## 🤝 Contributing

This project demonstrates modern cloud deployment platform architecture and is designed for educational and development purposes.

---

**Built with modern technologies for seamless GitHub repository deployment and management.**
# Nexus-Cloud--V2.0

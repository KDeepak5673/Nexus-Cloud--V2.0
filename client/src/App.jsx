import { useState, useEffect, createContext } from 'react'
import './App.css'
import './styles/index.css'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'
import UserProfilePage from './pages/UserProfilePage'
import DocsPage from './pages/DocsPage'
import ProjectDetailsPage from './pages/ProjectDetailsPage'
import RequireAuth from './components/RequireAuth.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import NewProjectPage from './pages/NewProjectPage.jsx'

export const ThemeContext = createContext()

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [pageParams, setPageParams] = useState({})
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus-theme') || 'light'
    }
    return 'light'
  })

  // Update theme in localStorage and document
  useEffect(() => {
    localStorage.setItem('nexus-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    window.appState = {
      setPage: (page, params = {}) => {
        setCurrentPage(page)
        setPageParams(params)
        window.scrollTo(0, 0)
      }
    }
    // Expose theme control globally
    window.themeState = {
      setTheme: (newTheme) => setTheme(newTheme),
      getTheme: () => theme
    }
  }, [theme])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        )
      case 'new-project':
        return (
          <RequireAuth>
            <NewProjectPage />
          </RequireAuth>
        )
      case 'projectDetails':
        return (
          <RequireAuth>
            <ProjectDetailsPage projectId={pageParams.projectId} />
          </RequireAuth>
        )
      case 'analytics':
        return (
          <RequireAuth>
            <AnalyticsPage />
          </RequireAuth>
        )
      case 'profile':
        return (
          <RequireAuth>
            <UserProfilePage />
          </RequireAuth>
        )
      case 'login':
        return <LoginPage />
      case 'signup':
        return <SignupPage />
      case 'docs':
        return <DocsPage />
      default:
        return <HomePage />
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Navigation currentPage={currentPage} />
      {renderPage()}
      <Footer />
    </ThemeContext.Provider>
  )
}

export default App
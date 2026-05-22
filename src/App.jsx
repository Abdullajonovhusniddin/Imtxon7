import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getAuthToken } from './api'

// Lazy loading pages for better performance
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

// Loading component
const PageLoader = () => {
  const isDark = localStorage.getItem('najot-theme') === 'dark'

  return (
    <div className={`page-loader ${isDark ? 'dark' : ''}`}>
      <div className="page-loader-card">
        <div className="page-loader-mark">
          <span className="page-loader-ring"></span>
          <span className="page-loader-logo">N</span>
        </div>
        <div className="page-loader-copy">
          <strong>EduNajot</strong>
          <span>Ma'lumotlar yuklanmoqda...</span>
        </div>
        <div className="page-loader-track">
          <span></span>
        </div>
      </div>
  </div>
  )
}

const ProtectedRoute = ({ children }) => {
  const token = getAuthToken()
  if (!token) return <Navigate to="/" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const token = getAuthToken()
  if (token) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/:subId" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/teachers" element={
          <ProtectedRoute>
            <DashboardPage activePage="teachers" />
          </ProtectedRoute>
        } />
        
        <Route path="/groups" element={
          <ProtectedRoute>
            <DashboardPage activePage="groups" />
          </ProtectedRoute>
        } />
        <Route path="/groups/:id" element={
          <ProtectedRoute>
            <DashboardPage activePage="groups" />
          </ProtectedRoute>
        } />
        
        <Route path="/students" element={
          <ProtectedRoute>
            <DashboardPage activePage="students" />
          </ProtectedRoute>
        } />
        
        <Route path="/gifts" element={
          <ProtectedRoute>
            <DashboardPage activePage="gifts" />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App

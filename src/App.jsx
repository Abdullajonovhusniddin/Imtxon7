import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Lazy loading pages for better performance
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TeachersPage = lazy(() => import('./pages/TeachersPage'))
const GroupsPage = lazy(() => import('./pages/GroupsPage'))

// Loading component
const PageLoader = () => (
  <div style={{ 
    height: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: '#f8fafc'
  }}>
    <div className="loader">Yuklanmoqda...</div>
  </div>
)

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token')
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

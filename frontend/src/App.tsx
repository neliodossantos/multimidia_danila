import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import { useNotificationStore } from './stores/notificationStore'
import { useEffect } from 'react'

import AuthLayout from './components/Layout/AuthLayout'
import Layout from './components/Layout/Layout'

// Pages
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Artists from './pages/Artists/Artists'
import ArtistDetail from './pages/Artists/ArtistDetail'
// import Albums from './pages/Albums/Albums'
// import AlbumDetail from './pages/Albums/AlbumDetail'
// import Music from './pages/Music/Music'
// import Videos from './pages/Videos/Videos'
// import Reviews from './pages/Reviews/Reviews'
// import Files from './pages/Files/Files'
// import Groups from './pages/Groups/Groups'
// import GroupDetail from './pages/Groups/GroupDetail'
// import Profile from './pages/Profile/Profile'
// import Notifications from './pages/Notifications/Notifications'
// import Users from './pages/Users/Users'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Editor Route Component
const EditorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (!user?.is_editor && !user?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { initializeAuth } = useAuthStore()
  const { initializeSocket } = useNotificationStore()

  useEffect(() => {
    initializeAuth()
    initializeSocket()
  }, [initializeAuth, initializeSocket])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          } />
          <Route path="/register" element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          } />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="artists" element={<Artists />} />
            <Route path="artists/:id" element={<ArtistDetail />} />
            {/* <Route path="albums" element={<Albums />} /> */}
            {/* <Route path="albums/:id" element={<AlbumDetail />} /> */}
            {/* <Route path="music" element={<Music />} /> */}
            {/* <Route path="videos" element={<Videos />} /> */}
            {/* <Route path="reviews" element={<Reviews />} /> */}
            {/* <Route path="files" element={<Files />} /> */}
            {/* <Route path="groups" element={<Groups />} /> */}
            {/* <Route path="groups/:id" element={<GroupDetail />} /> */}
            {/* <Route path="profile" element={<Profile />} /> */}
            {/* <Route path="notifications" element={<Notifications />} /> */}
            
            {/* Admin Routes */}
            {/* <Route path="users" element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            } /> */}
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
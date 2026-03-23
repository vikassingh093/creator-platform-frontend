// filepath: c:\laragon\www\creator-platform-frontend\src\App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import CreatorProfilePage from './pages/CreatorProfilePage'
import ChatListPage from './pages/ChatListPage'
import CallPage from './pages/CallPage'
import WalletPage from './pages/WalletPage'
import ProfilePage from './pages/ProfilePage'
import CreatorDashboard from './pages/CreatorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import TransactionPage from './pages/TransactionPage'
import ChatPage from './pages/ChatPage'
import './index.css'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/creator/:id" element={<ProtectedRoute><CreatorProfilePage /></ProtectedRoute>} />
        <Route path="/chats" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
        <Route path="/chat/:creatorId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/call/:id" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/creator-dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
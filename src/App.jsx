import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import CreatorProfilePage from './pages/CreatorProfilePage'
import ChatListPage from './pages/ChatListPage'
import CallPage from './pages/CallPage'
import WalletPage from './pages/WalletPage'
import ProfilePage from './pages/ProfilePage'
import CreatorDashboard from './pages/CreatorDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'  // ✅ CHANGED
import TransactionPage from './pages/TransactionPage'
import ChatPage from './pages/ChatPage'
import NotificationPage from './pages/NotificationPage'
import CreatorCallPage from './pages/CreatorCallPage'
import AdminOffers from './pages/AdminOffers'
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
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/creator/:id" element={<ProtectedRoute><CreatorProfilePage /></ProtectedRoute>} />
      <Route path="/chats" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
      <Route path="/chat/room/:roomId" element={<ChatPage />} />
      <Route path="/chat/:creatorId" element={<ChatPage />} />
      <Route path="/call" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
      <Route path="/call/:creatorId" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
      <Route path="/creator-call/:roomId" element={<ProtectedRoute><CreatorCallPage /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/creator-dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/offers" element={<ProtectedRoute><AdminOffers /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<NotificationPage />} />
    </Routes>
  )
}
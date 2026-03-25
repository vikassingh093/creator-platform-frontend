import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../api/notifications';
import apiClient from '../api/client';  // ✅ ADD THIS
import BottomNav from '../components/BottomNav';

export default function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsAPI.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClear = async () => {
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await notificationsAPI.markRead(notification.id)
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: 1 } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    // 🚫 MISSED CALL CALLBACK — TEMPORARILY DISABLED
    // TODO: Re-enable when call-back flow is fully tested
    // The issue: after callback, new room polled too fast → got "ended" status
    // from stale DB read → immediate rejection screen shown again.
    // Fix needed before re-enabling:
    //   1. Add proper delay before polling new room
    //   2. Test full flow: tap notification → call initiates → creator accepts → active
    //
    // if (notification.type === 'call' && notification.reference_id?.startsWith('missed_call_')) {
    //   const parts = notification.reference_id.split('_')
    //   // format: missed_call_{creatorId}_{callType}
    //   const creatorId = Number(parts[2])
    //   const callType = parts[3] || 'audio'
    //   try {
    //     const res = await apiClient.post('/calls/initiate', {
    //       creator_id: creatorId,
    //       call_type: callType
    //     })
    //     const data = res.data
    //     navigate('/call', {
    //       state: {
    //         roomId: data.room_id,
    //         channelName: data.channel_name,
    //         token: data.token,
    //         uid: data.uid,
    //         callType: callType,
    //         creatorName: data.creator?.name || 'Creator',
    //         ratePerMinute: data.rate_per_minute,
    //         balance: data.balance,
    //         creatorId: creatorId,
    //       }
    //     })
    //   } catch (err) {
    //     alert(err.response?.data?.detail || 'Creator is offline or insufficient balance')
    //   }
    //   return
    // }

    // ✅ Missed call notification → go to creator profile instead (call back disabled)
    if (notification.type === 'call' && notification.reference_id?.startsWith('missed_call_')) {
      const parts = notification.reference_id.split('_')
      const creatorId = Number(parts[2])
      if (creatorId) navigate(`/creator/${creatorId}`)
      return
    }

    // ✅ existing navigation
    if (notification.type === 'chat' && notification.reference_id) {
      const roomId = notification.reference_id.replace('room_', '')
      navigate(`/chat/room/${roomId}`)
    } else if (notification.type === 'call' && notification.reference_id) {
      navigate('/home')
    } else if (notification.type === 'wallet') {
      navigate('/wallet')
    }
  };

  // ✅ Show 📵 for missed call, 📞 for regular call
  const getIcon = (type, referenceId) => {
    if (type === 'call' && referenceId?.startsWith('missed_call_')) return '📵'
    switch (type) {
      case 'chat': return '💬'
      case 'call': return '📞'
      case 'wallet': return '💰'
      default: return '🔔'
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'chat': return 'bg-pink-100'
      case 'call': return 'bg-blue-100'
      case 'wallet': return 'bg-green-100'
      default: return 'bg-gray-100'
    }
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-pink-200 text-xs">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs bg-white text-pink-600 font-bold px-3 py-1 rounded-full"
              >
                Read All
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs bg-red-500 text-white font-bold px-3 py-1 rounded-full"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔔</p>
            <p className="text-gray-500 font-semibold">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">We'll notify you when something happens</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 cursor-pointer transition
                ${!notification.is_read ? 'border-l-4 border-pink-500' : 'opacity-70'}
              `}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0
                ${!notification.is_read ? getBgColor(notification.type) : 'bg-gray-100'}
              `}>
                {getIcon(notification.type, notification.reference_id)}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className={`text-sm font-bold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                    {notification.title}
                  </p>
                  {!notification.is_read && (
                    <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-1"></span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">{getTimeAgo(notification.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
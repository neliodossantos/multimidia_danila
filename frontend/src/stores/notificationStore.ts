import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'
import { Notification } from '../types'
import { notificationService } from '../services/notificationService'
import toast from 'react-hot-toast'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  socket: Socket | null
  isConnected: boolean
  initializeSocket: () => void
  disconnectSocket: () => void
  fetchNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: number) => Promise<void>
  clearReadNotifications: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,
  isConnected: false,

  initializeSocket: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) return

    const user = JSON.parse(userStr)
    const socket = io('http://localhost:3000', {
      auth: { token }
    })

    socket.on('connect', () => {
      console.log('Socket connected')
      set({ isConnected: true })
      socket.emit('register_user', user.id)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      set({ isConnected: false })
    })

    socket.on('notification', (notification: Notification) => {
      const { notifications, unreadCount } = get()
      
      set({
        notifications: [notification, ...notifications],
        unreadCount: unreadCount + 1
      })
      
      // Show toast notification
      toast.success(notification.title, {
        duration: 5000,
      })
    })

    set({ socket })

    // Fetch initial notifications
    get().fetchNotifications()
  },

  disconnectSocket: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false })
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await notificationService.getNotifications({ limit: 50 })
      set({
        notifications: response.notifications,
        unreadCount: response.unread_count
      })
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  },

  markAsRead: async (id: number) => {
    try {
      await notificationService.markAsRead(id)
      const { notifications, unreadCount } = get()
      
      const updatedNotifications = notifications.map(notification =>
        notification.id === id
          ? { ...notification, is_read: true }
          : notification
      )
      
      const wasUnread = notifications.find(n => n.id === id && !n.is_read)
      
      set({
        notifications: updatedNotifications,
        unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead()
      const { notifications } = get()
      
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        is_read: true
      }))
      
      set({
        notifications: updatedNotifications,
        unreadCount: 0
      })
      
      toast.success('Todas as notificações foram marcadas como lidas')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  },

  deleteNotification: async (id: number) => {
    try {
      await notificationService.deleteNotification(id)
      const { notifications, unreadCount } = get()
      
      const notificationToDelete = notifications.find(n => n.id === id)
      const updatedNotifications = notifications.filter(n => n.id !== id)
      
      set({
        notifications: updatedNotifications,
        unreadCount: notificationToDelete && !notificationToDelete.is_read 
          ? Math.max(0, unreadCount - 1) 
          : unreadCount
      })
      
      toast.success('Notificação eliminada')
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  },

  clearReadNotifications: async () => {
    try {
      const response = await notificationService.clearReadNotifications()
      const { notifications } = get()
      
      const updatedNotifications = notifications.filter(n => !n.is_read)
      
      set({ notifications: updatedNotifications })
      
      toast.success(`${response.deleted_count} notificações limpas`)
    } catch (error) {
      console.error('Error clearing read notifications:', error)
    }
  }
}))
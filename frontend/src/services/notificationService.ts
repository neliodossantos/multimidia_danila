import api from './api'
import { Notification } from '../types'

export const notificationService = {
  async getNotifications(params?: {
    limit?: number
    offset?: number
    unread_only?: boolean
  }): Promise<{
    notifications: Notification[]
    unread_count: number
  }> {
    const response = await api.get('/notifications', { params })
    return response.data
  },

  async getNotification(id: number): Promise<Notification> {
    const response = await api.get(`/notifications/${id}`)
    return response.data
  },

  async markAsRead(id: number): Promise<{ message: string }> {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  },

  async markAllAsRead(): Promise<{ message: string }> {
    const response = await api.put('/notifications/read-all')
    return response.data
  },

  async deleteNotification(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  },

  async clearReadNotifications(): Promise<{ message: string; deleted_count: number }> {
    const response = await api.delete('/notifications/clear-read')
    return response.data
  }
}
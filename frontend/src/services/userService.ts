import api from './api'
import { User } from '../types'

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get('/users')
    return response.data
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/users/profile')
    return response.data
  },

  async updateProfile(data: {
    firstName?: string
    lastName?: string
    email?: string
  }): Promise<{ message: string }> {
    const response = await api.put('/users/profile', data)
    return response.data
  },

  async promoteUser(userId: number): Promise<{ message: string }> {
    const response = await api.post(`/users/${userId}/promote`)
    return response.data
  }
}
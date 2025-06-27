import api from './api'
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types'

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  async register(userData: RegisterRequest): Promise<{ message: string; isFirstUser?: boolean }> {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async verifyToken(): Promise<{ user: User }> {
    const response = await api.get('/auth/verify')
    return response.data
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}
import { create } from 'zustand'
import { User } from '../types'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  register: (userData: {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<boolean>
  logout: () => void
  initializeAuth: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const response = await authService.login({ username, password })
      
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false
      })
      
      toast.success('Login realizado com sucesso!')
      return true
    } catch (error: any) {
      set({ isLoading: false })
      const errorMessage = error.response?.data?.error || 'Erro ao fazer login'
      toast.error(errorMessage)
      return false
    }
  },

  register: async (userData) => {
    set({ isLoading: true })
    try {
      const response = await authService.register(userData)
      set({ isLoading: false })
      
      if (response.isFirstUser) {
        toast.success('Primeiro utilizador criado! Você é agora administrador.')
      } else {
        toast.success('Conta criada com sucesso! Faça login para continuar.')
      }
      
      return true
    } catch (error: any) {
      set({ isLoading: false })
      const errorMessage = error.response?.data?.error || 'Erro ao criar conta'
      toast.error(errorMessage)
      return false
    }
  },

  logout: () => {
    authService.logout()
    set({
      user: null,
      token: null,
      isAuthenticated: false
    })
    toast.success('Logout realizado com sucesso!')
  },

  initializeAuth: async () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        // Verify token is still valid
        await authService.verifyToken()
        
        set({
          user,
          token,
          isAuthenticated: true
        })
      } catch (error) {
        // Token is invalid, clear storage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      }
    }
  },

  updateUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  }
}))
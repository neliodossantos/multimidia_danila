import api from './api'
import { Artist } from '../types'

export const artistService = {
  async getArtists(params?: {
    search?: string
    genre?: string
    limit?: number
    offset?: number
  }): Promise<Artist[]> {
    const response = await api.get('/artists', { params })
    return response.data
  },

  async getArtist(id: number): Promise<Artist> {
    const response = await api.get(`/artists/${id}`)
    return response.data
  },

  async createArtist(data: {
    name: string
    biography?: string
    genre?: string
    country?: string
    formedYear?: number
    imageUrl?: string
  }): Promise<{ message: string; artistId: number }> {
    const response = await api.post('/artists', data)
    return response.data
  },

  async updateArtist(id: number, data: {
    name?: string
    biography?: string
    genre?: string
    country?: string
    formedYear?: number
    imageUrl?: string
  }): Promise<{ message: string }> {
    const response = await api.put(`/artists/${id}`, data)
    return response.data
  },

  async deleteArtist(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/artists/${id}`)
    return response.data
  }
}
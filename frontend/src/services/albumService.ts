import api from './api'
import { Album } from '../types'

export const albumService = {
  async getAlbums(params?: {
    search?: string
    artist_id?: number
    genre?: string
    limit?: number
    offset?: number
  }): Promise<Album[]> {
    const response = await api.get('/albums', { params })
    return response.data
  },

  async getAlbum(id: number): Promise<Album> {
    const response = await api.get(`/albums/${id}`)
    return response.data
  },

  async createAlbum(data: {
    title: string
    artist_id: number
    description?: string
    genre?: string
    release_date?: string
    cover_url?: string
  }): Promise<{ message: string; albumId: number }> {
    const response = await api.post('/albums', data)
    return response.data
  },

  async updateAlbum(id: number, data: {
    title?: string
    artist_id?: number
    description?: string
    genre?: string
    release_date?: string
    cover_url?: string
  }): Promise<{ message: string }> {
    const response = await api.put(`/albums/${id}`, data)
    return response.data
  },

  async deleteAlbum(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/albums/${id}`)
    return response.data
  }
}
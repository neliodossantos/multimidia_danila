import api from './api'
import { Music } from '../types'

export const musicService = {
  async getMusic(params?: {
    search?: string
    artist_id?: number
    album_id?: number
    limit?: number
    offset?: number
  }): Promise<Music[]> {
    const response = await api.get('/music', { params })
    return response.data
  },

  async getMusicById(id: number): Promise<Music> {
    const response = await api.get(`/music/${id}`)
    return response.data
  },

  async createMusic(data: {
    title: string
    artist_id: number
    album_id?: number
    duration?: number
    track_number?: number
    lyrics?: string
    composer?: string
    file_url?: string
  }): Promise<{ message: string; musicId: number }> {
    const response = await api.post('/music', data)
    return response.data
  },

  async updateMusic(id: number, data: {
    title?: string
    artist_id?: number
    album_id?: number
    duration?: number
    track_number?: number
    lyrics?: string
    composer?: string
    file_url?: string
  }): Promise<{ message: string }> {
    const response = await api.put(`/music/${id}`, data)
    return response.data
  },

  async deleteMusic(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/music/${id}`)
    return response.data
  }
}
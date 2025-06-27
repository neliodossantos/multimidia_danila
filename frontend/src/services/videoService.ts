import api from './api'
import { Video } from '../types'

export const videoService = {
  async getVideos(params?: {
    search?: string
    artist_id?: number
    genre?: string
    limit?: number
    offset?: number
  }): Promise<Video[]> {
    const response = await api.get('/videos', { params })
    return response.data
  },

  async getVideo(id: number): Promise<Video> {
    const response = await api.get(`/videos/${id}`)
    return response.data
  },

  async createVideo(data: {
    title: string
    description?: string
    artist_id?: number
    duration?: number
    video_url?: string
    thumbnail_url?: string
    genre?: string
  }): Promise<{ message: string; videoId: number }> {
    const response = await api.post('/videos', data)
    return response.data
  },

  async updateVideo(id: number, data: {
    title?: string
    description?: string
    artist_id?: number
    duration?: number
    video_url?: string
    thumbnail_url?: string
    genre?: string
  }): Promise<{ message: string }> {
    const response = await api.put(`/videos/${id}`, data)
    return response.data
  },

  async deleteVideo(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/videos/${id}`)
    return response.data
  }
}
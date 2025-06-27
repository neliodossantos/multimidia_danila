import api from './api'
import { SharedFile } from '../types'

export const fileService = {
  async getFiles(params?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<SharedFile[]> {
    const response = await api.get('/files', { params })
    return response.data
  },

  async getPublicFiles(params?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<SharedFile[]> {
    const response = await api.get('/files/public', { params })
    return response.data
  },

  async getSharedFiles(params?: {
    limit?: number
    offset?: number
  }): Promise<SharedFile[]> {
    const response = await api.get('/files/shared-with-me', { params })
    return response.data
  },

  async getFile(id: number): Promise<SharedFile> {
    const response = await api.get(`/files/${id}`)
    return response.data
  },

  async createFile(data: {
    filename: string
    original_name: string
    file_path: string
    file_size: number
    mime_type?: string
    music_id?: number
    video_id?: number
    is_public?: boolean
  }): Promise<{ message: string; fileId: number }> {
    const response = await api.post('/files', data)
    return response.data
  },

  async updateFile(id: number, data: {
    filename?: string
    original_name?: string
    music_id?: number
    video_id?: number
    is_public?: boolean
  }): Promise<{ message: string }> {
    const response = await api.put(`/files/${id}`, data)
    return response.data
  },

  async deleteFile(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/files/${id}`)
    return response.data
  },

  async shareFile(id: number, username: string): Promise<{ message: string }> {
    const response = await api.post(`/files/${id}/share`, { username })
    return response.data
  },

  async removeShare(id: number, userId: number): Promise<{ message: string }> {
    const response = await api.delete(`/files/${id}/share/${userId}`)
    return response.data
  },

  async getFileShares(id: number): Promise<Array<{
    id: number
    username: string
    email: string
    shared_at: string
  }>> {
    const response = await api.get(`/files/${id}/shares`)
    return response.data
  }
}
import api from './api'
import { Group, GroupDiscussion } from '../types'

export const groupService = {
  async getGroups(params?: {
    search?: string
    my_groups?: boolean
    limit?: number
    offset?: number
  }): Promise<Group[]> {
    const response = await api.get('/groups', { params })
    return response.data
  },

  async getGroup(id: number): Promise<Group> {
    const response = await api.get(`/groups/${id}`)
    return response.data
  },

  async createGroup(data: {
    name: string
    description?: string
    is_public?: boolean
    image_url?: string
  }): Promise<{ message: string; groupId: number }> {
    const response = await api.post('/groups', data)
    return response.data
  },

  async updateGroup(id: number, data: {
    name?: string
    description?: string
    is_public?: boolean
    image_url?: string
  }): Promise<{ message: string }> {
    const response = await api.put(`/groups/${id}`, data)
    return response.data
  },

  async deleteGroup(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/groups/${id}`)
    return response.data
  },

  async joinGroup(id: number): Promise<{ message: string }> {
    const response = await api.post(`/groups/${id}/join`)
    return response.data
  },

  async leaveGroup(id: number): Promise<{ message: string }> {
    const response = await api.post(`/groups/${id}/leave`)
    return response.data
  },

  async inviteUser(id: number, username: string): Promise<{ message: string }> {
    const response = await api.post(`/groups/${id}/invite`, { username })
    return response.data
  },

  async removeMember(id: number, userId: number): Promise<{ message: string }> {
    const response = await api.delete(`/groups/${id}/members/${userId}`)
    return response.data
  },

  async updateMemberRole(id: number, userId: number, role: string): Promise<{ message: string }> {
    const response = await api.put(`/groups/${id}/members/${userId}/role`, { role })
    return response.data
  },

  async getDiscussions(id: number, params?: {
    limit?: number
    offset?: number
  }): Promise<GroupDiscussion[]> {
    const response = await api.get(`/groups/${id}/discussions`, { params })
    return response.data
  },

  async createDiscussion(id: number, data: {
    title: string
    content: string
  }): Promise<{ message: string; discussionId: number }> {
    const response = await api.post(`/groups/${id}/discussions`, data)
    return response.data
  }
}
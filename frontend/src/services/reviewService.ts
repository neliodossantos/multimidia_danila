import api from './api'
import { Review, ReviewStats } from '../types'

export const reviewService = {
  async getReviews(params?: {
    album_id?: number
    user_id?: number
    limit?: number
    offset?: number
  }): Promise<Review[]> {
    const response = await api.get('/reviews', { params })
    return response.data
  },

  async getReview(id: number): Promise<Review> {
    const response = await api.get(`/reviews/${id}`)
    return response.data
  },

  async getReviewStats(albumId: number): Promise<ReviewStats> {
    const response = await api.get(`/reviews/stats/${albumId}`)
    return response.data
  },

  async createReview(data: {
    album_id: number
    rating: number
    comment?: string
  }): Promise<{ message: string; reviewId: number }> {
    const response = await api.post('/reviews', data)
    return response.data
  },

  async updateReview(id: number, data: {
    rating: number
    comment?: string
  }): Promise<{ message: string }> {
    const response = await api.put(`/reviews/${id}`, data)
    return response.data
  },

  async deleteReview(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/reviews/${id}`)
    return response.data
  }
}
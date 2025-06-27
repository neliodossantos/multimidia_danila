import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { albumService } from '../../services/albumService'
import { reviewService } from '../../services/reviewService'
import { useAuthStore } from '../../stores/authStore'
import { Album, Review, ReviewStats } from '../../types'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Modal from '../../components/UI/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  PlayCircleIcon,
  MusicalNoteIcon,
  CalendarIcon,
  TagIcon,
  StarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface ReviewForm {
  rating: number
  comment?: string
}

const AlbumDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [album, setAlbum] = useState<Album | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ReviewForm>()
  const rating = watch('rating')

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      try {
        const [albumData, reviewsData, statsData] = await Promise.all([
          albumService.getAlbum(parseInt(id)),
          reviewService.getReviews({ album_id: parseInt(id), limit: 50 }),
          reviewService.getReviewStats(parseInt(id))
        ])

        setAlbum(albumData)
        setReviews(reviewsData)
        setReviewStats(statsData)

        // Find user's review
        const userReviewData = reviewsData.find(review => review.user_id === user?.id)
        setUserReview(userReviewData || null)
      } catch (error) {
        console.error('Error fetching album data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user?.id])

  const handleCreateOrUpdateReview = async (data: ReviewForm) => {
    if (!album) return

    setSubmitting(true)
    try {
      if (editingReview) {
        await reviewService.updateReview(editingReview.id, data)
        toast.success('Review atualizada com sucesso!')
      } else {
        await reviewService.createReview({
          album_id: album.id,
          rating: data.rating,
          comment: data.comment
        })
        toast.success('Review criada com sucesso!')
      }
      
      setShowReviewModal(false)
      setEditingReview(null)
      reset()
      
      // Refresh data
      const [reviewsData, statsData] = await Promise.all([
        reviewService.getReviews({ album_id: album.id, limit: 50 }),
        reviewService.getReviewStats(album.id)
      ])
      
      setReviews(reviewsData)
      setReviewStats(statsData)
      
      const userReviewData = reviewsData.find(review => review.user_id === user?.id)
      setUserReview(userReviewData || null)
    } catch (error) {
      console.error('Error saving review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditReview = (review: Review) => {
    setEditingReview(review)
    reset({
      rating: review.rating,
      comment: review.comment || ''
    })
    setShowReviewModal(true)
  }

  const handleDeleteReview = async (review: Review) => {
    if (!confirm('Tem certeza que deseja eliminar esta review?')) {
      return
    }

    try {
      await reviewService.deleteReview(review.id)
      toast.success('Review eliminada com sucesso!')
      
      // Refresh data
      if (album) {
        const [reviewsData, statsData] = await Promise.all([
          reviewService.getReviews({ album_id: album.id, limit: 50 }),
          reviewService.getReviewStats(album.id)
        ])
        
        setReviews(reviewsData)
        setReviewStats(statsData)
        setUserReview(null)
      }
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  const openCreateReviewModal = () => {
    setEditingReview(null)
    reset({ rating: 5 })
    setShowReviewModal(true)
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    }

    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!album) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Álbum não encontrado</h2>
        <Link to="/albums" className="btn-primary">
          Voltar aos Álbuns
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Album Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            {album.cover_url ? (
              <img
                src={album.cover_url}
                alt={album.title}
                className="h-64 w-full object-cover md:h-full md:w-64"
              />
            ) : (
              <div className="h-64 w-full md:h-full md:w-64 bg-gray-200 flex items-center justify-center">
                <PlayCircleIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{album.title}</h1>
            <p className="text-xl text-gray-600 mb-4">
              por <Link to={`/artists/${album.artist_id}`} className="text-primary-600 hover:text-primary-700">
                {album.artist_name}
              </Link>
            </p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              {album.genre && (
                <div className="flex items-center text-gray-600">
                  <TagIcon className="h-5 w-5 mr-2" />
                  <span>{album.genre}</span>
                </div>
              )}
              {album.release_date && (
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  <span>{new Date(album.release_date).toLocaleDateString('pt-PT')}</span>
                </div>
              )}
            </div>

            {/* Rating */}
            {reviewStats && reviewStats.total_reviews > 0 && (
              <div className="flex items-center space-x-4 mb-6">
                {renderStars(Math.round(reviewStats.average_rating), 'lg')}
                <span className="text-2xl font-bold text-gray-900">
                  {reviewStats.average_rating.toFixed(1)}
                </span>
                <span className="text-gray-600">
                  ({reviewStats.total_reviews} {reviewStats.total_reviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {album.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-700 leading-relaxed">{album.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracks */}
      {album.tracks && album.tracks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MusicalNoteIcon className="h-6 w-6 mr-2" />
            Faixas ({album.tracks.length})
          </h2>
          <div className="space-y-2">
            {album.tracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-500 w-8">
                  {track.track_number || index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {track.title}
                  </p>
                  {track.composer && (
                    <p className="text-sm text-gray-500">
                      Compositor: {track.composer}
                    </p>
                  )}
                </div>
                {track.duration && (
                  <span className="text-sm text-gray-500">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <StarIcon className="h-6 w-6 mr-2" />
            Reviews
          </h2>
          {user && !userReview && (
            <button
              onClick={openCreateReviewModal}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Escrever Review</span>
            </button>
          )}
        </div>

        {/* Rating Distribution */}
        {reviewStats && reviewStats.total_reviews > 0 && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Distribuição de Avaliações</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewStats[`rating_${star}` as keyof ReviewStats] as number
                const percentage = reviewStats.total_reviews > 0 ? (count / reviewStats.total_reviews) * 100 : 0
                
                return (
                  <div key={star} className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-8">{star}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* User's Review */}
        {userReview && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-900">A sua review</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditReview(userReview)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="Editar"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteReview(userReview)}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Eliminar"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              {renderStars(userReview.rating)}
              <span className="text-sm text-gray-600">
                {new Date(userReview.created_at).toLocaleDateString('pt-PT')}
              </span>
            </div>
            {userReview.comment && (
              <p className="text-gray-700">{userReview.comment}</p>
            )}
          </div>
        )}

        {/* Other Reviews */}
        <div className="space-y-4">
          {reviews.filter(review => review.user_id !== user?.id).map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {review.first_name?.[0]}{review.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {review.first_name} {review.last_name}
                    </p>
                    <p className="text-sm text-gray-500">@{review.username}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('pt-PT')}
                </span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                {renderStars(review.rating)}
              </div>
              {review.comment && (
                <p className="text-gray-700">{review.comment}</p>
              )}
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-8">
            <StarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma review ainda
            </h3>
            <p className="text-gray-500">
              Seja o primeiro a avaliar este álbum!
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false)
          setEditingReview(null)
          reset()
        }}
        title={editingReview ? 'Editar Review' : 'Nova Review'}
      >
        <form onSubmit={handleSubmit(handleCreateOrUpdateReview)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avaliação *
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => reset({ rating: star, comment: watch('comment') })}
                  className="focus:outline-none"
                >
                  <StarIcon
                    className={`h-8 w-8 ${
                      star <= (rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating ? `${rating} estrela${rating !== 1 ? 's' : ''}` : 'Selecione uma avaliação'}
              </span>
            </div>
            <input
              {...register('rating', { 
                required: 'Avaliação é obrigatória',
                min: { value: 1, message: 'Mínimo 1 estrela' },
                max: { value: 5, message: 'Máximo 5 estrelas' }
              })}
              type="hidden"
            />
            {errors.rating && (
              <p className="text-sm text-red-600 mt-1">{errors.rating.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentário
            </label>
            <textarea
              {...register('comment')}
              rows={4}
              className="input w-full resize-none"
              placeholder="Escreva sua opinião sobre o álbum..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowReviewModal(false)
                setEditingReview(null)
                reset()
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center space-x-2"
            >
              {submitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span>{editingReview ? 'Atualizar' : 'Publicar'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AlbumDetail
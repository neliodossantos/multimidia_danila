import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { videoService } from '../../services/videoService'
import { artistService } from '../../services/artistService'
import { Video, Artist } from '../../types'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import EmptyState from '../../components/UI/EmptyState'
import Modal from '../../components/UI/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  FilmIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline'

interface VideoForm {
  title: string
  description?: string
  artist_id?: number
  duration?: number
  video_url?: string
  thumbnail_url?: string
  genre?: string
}

const Videos: React.FC = () => {
  const { user } = useAuthStore()
  const [videos, setVideos] = useState<Video[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArtist, setSelectedArtist] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<VideoForm>()

  const canEdit = user?.is_editor || user?.is_admin

  useEffect(() => {
    fetchArtists()
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [searchTerm, selectedArtist, selectedGenre])

  const fetchArtists = async () => {
    try {
      const data = await artistService.getArtists({ limit: 100 })
      setArtists(data)
    } catch (error) {
      console.error('Error fetching artists:', error)
    }
  }

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const data = await videoService.getVideos({
        search: searchTerm || undefined,
        artist_id: selectedArtist ? parseInt(selectedArtist) : undefined,
        genre: selectedGenre || undefined,
        limit: 50
      })
      setVideos(data)
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (data: VideoForm) => {
    setSubmitting(true)
    try {
      if (editingVideo) {
        await videoService.updateVideo(editingVideo.id, data)
        toast.success('Vídeo atualizado com sucesso!')
      } else {
        await videoService.createVideo(data)
        toast.success('Vídeo criado com sucesso!')
      }
      
      setShowModal(false)
      setEditingVideo(null)
      reset()
      fetchVideos()
    } catch (error) {
      console.error('Error saving video:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (video: Video) => {
    setEditingVideo(video)
    reset({
      title: video.title,
      description: video.description || '',
      artist_id: video.artist_id || undefined,
      duration: video.duration || undefined,
      video_url: video.video_url || '',
      thumbnail_url: video.thumbnail_url || '',
      genre: video.genre || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (video: Video) => {
    if (!confirm(`Tem certeza que deseja eliminar o vídeo "${video.title}"?`)) {
      return
    }

    try {
      await videoService.deleteVideo(video.id)
      toast.success('Vídeo eliminado com sucesso!')
      fetchVideos()
    } catch (error) {
      console.error('Error deleting video:', error)
    }
  }

  const openCreateModal = () => {
    setEditingVideo(null)
    reset()
    setShowModal(true)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const genres = [...new Set(videos.map(video => video.genre).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vídeos</h1>
          <p className="text-gray-600">Gerir vídeos e suas informações</p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Novo Vídeo</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar vídeos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={selectedArtist}
          onChange={(e) => setSelectedArtist(e.target.value)}
          className="input"
        >
          <option value="">Todos os artistas</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="input"
        >
          <option value="">Todos os géneros</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <EmptyState
          icon={FilmIcon}
          title="Nenhum vídeo encontrado"
          description="Não há vídeos cadastrados no sistema."
          action={canEdit ? {
            label: 'Criar primeiro vídeo',
            onClick: openCreateModal
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FilmIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {video.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all">
                      <PlayIcon className="h-8 w-8" />
                    </button>
                  </div>
                )}
                
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {video.title}
                </h3>
                
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  {video.artist_name && (
                    <p>por {video.artist_name}</p>
                  )}
                  {video.genre && (
                    <p className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      {video.genre}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(video.created_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>

                {video.description && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {video.description}
                  </p>
                )}

                {canEdit && (
                  <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(video)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(video)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingVideo(null)
          reset()
        }}
        title={editingVideo ? 'Editar Vídeo' : 'Novo Vídeo'}
        size="lg"
      >
        <form onSubmit={handleSubmit(handleCreateOrUpdate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título do Vídeo *
            </label>
            <input
              {...register('title', { required: 'Título é obrigatório' })}
              type="text"
              className="input w-full"
              placeholder="Título do vídeo"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artista
            </label>
            <select
              {...register('artist_id', { valueAsNumber: true })}
              className="input w-full"
            >
              <option value="">Selecionar artista (opcional)</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género
              </label>
              <input
                {...register('genre')}
                type="text"
                className="input w-full"
                placeholder="Ex: Música, Documentário"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duração (segundos)
              </label>
              <input
                {...register('duration', { valueAsNumber: true })}
                type="number"
                className="input w-full"
                placeholder="Ex: 180"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL do Vídeo
              </label>
              <input
                {...register('video_url')}
                type="url"
                className="input w-full"
                placeholder="https://exemplo.com/video.mp4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL da Miniatura
              </label>
              <input
                {...register('thumbnail_url')}
                type="url"
                className="input w-full"
                placeholder="https://exemplo.com/thumbnail.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="input w-full resize-none"
              placeholder="Descrição do vídeo..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                setEditingVideo(null)
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
                <span>{editingVideo ? 'Atualizar' : 'Criar'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Videos
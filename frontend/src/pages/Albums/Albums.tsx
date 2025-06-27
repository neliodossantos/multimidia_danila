import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { albumService } from '../../services/albumService'
import { artistService } from '../../services/artistService'
import { Album, Artist } from '../../types'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import EmptyState from '../../components/UI/EmptyState'
import Modal from '../../components/UI/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  PlayCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline'

interface AlbumForm {
  title: string
  artist_id: number
  description?: string
  genre?: string
  release_date?: string
  cover_url?: string
}

const Albums: React.FC = () => {
  const { user } = useAuthStore()
  const [albums, setAlbums] = useState<Album[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArtist, setSelectedArtist] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AlbumForm>()

  const canEdit = user?.is_editor || user?.is_admin

  useEffect(() => {
    fetchArtists()
  }, [])

  useEffect(() => {
    fetchAlbums()
  }, [searchTerm, selectedArtist, selectedGenre])

  const fetchArtists = async () => {
    try {
      const data = await artistService.getArtists({ limit: 100 })
      setArtists(data)
    } catch (error) {
      console.error('Error fetching artists:', error)
    }
  }

  const fetchAlbums = async () => {
    try {
      setLoading(true)
      const data = await albumService.getAlbums({
        search: searchTerm || undefined,
        artist_id: selectedArtist ? parseInt(selectedArtist) : undefined,
        genre: selectedGenre || undefined,
        limit: 50
      })
      setAlbums(data)
    } catch (error) {
      console.error('Error fetching albums:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (data: AlbumForm) => {
    setSubmitting(true)
    try {
      if (editingAlbum) {
        await albumService.updateAlbum(editingAlbum.id, data)
        toast.success('Álbum atualizado com sucesso!')
      } else {
        await albumService.createAlbum(data)
        toast.success('Álbum criado com sucesso!')
      }
      
      setShowModal(false)
      setEditingAlbum(null)
      reset()
      fetchAlbums()
    } catch (error) {
      console.error('Error saving album:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (album: Album) => {
    setEditingAlbum(album)
    reset({
      title: album.title,
      artist_id: album.artist_id,
      description: album.description || '',
      genre: album.genre || '',
      release_date: album.release_date || '',
      cover_url: album.cover_url || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (album: Album) => {
    if (!confirm(`Tem certeza que deseja eliminar o álbum "${album.title}"?`)) {
      return
    }

    try {
      await albumService.deleteAlbum(album.id)
      toast.success('Álbum eliminado com sucesso!')
      fetchAlbums()
    } catch (error) {
      console.error('Error deleting album:', error)
    }
  }

  const openCreateModal = () => {
    setEditingAlbum(null)
    reset()
    setShowModal(true)
  }

  const genres = [...new Set(albums.map(album => album.genre).filter(Boolean))]

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
          <h1 className="text-2xl font-bold text-gray-900">Álbuns</h1>
          <p className="text-gray-600">Gerir álbuns e suas informações</p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Novo Álbum</span>
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
            placeholder="Pesquisar álbuns..."
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

      {/* Albums Grid */}
      {albums.length === 0 ? (
        <EmptyState
          icon={PlayCircleIcon}
          title="Nenhum álbum encontrado"
          description="Não há álbuns cadastrados no sistema."
          action={canEdit ? {
            label: 'Criar primeiro álbum',
            onClick: openCreateModal
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {albums.map((album) => (
            <div key={album.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-1 aspect-h-1">
                {album.cover_url ? (
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <PlayCircleIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  <Link
                    to={`/albums/${album.id}`}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {album.title}
                  </Link>
                </h3>
                
                <p className="text-sm text-gray-600 mb-2">
                  por <Link to={`/artists/${album.artist_id}`} className="text-primary-600 hover:text-primary-700">
                    {album.artist_name}
                  </Link>
                </p>

                <div className="text-sm text-gray-600 space-y-1">
                  {album.genre && (
                    <p className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      {album.genre}
                    </p>
                  )}
                  {album.release_date && (
                    <p className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(album.release_date).getFullYear()}
                    </p>
                  )}
                </div>

                {album.description && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                    {album.description}
                  </p>
                )}

                {canEdit && (
                  <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(album)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(album)}
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
          setEditingAlbum(null)
          reset()
        }}
        title={editingAlbum ? 'Editar Álbum' : 'Novo Álbum'}
        size="lg"
      >
        <form onSubmit={handleSubmit(handleCreateOrUpdate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título do Álbum *
            </label>
            <input
              {...register('title', { required: 'Título é obrigatório' })}
              type="text"
              className="input w-full"
              placeholder="Título do álbum"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artista *
            </label>
            <select
              {...register('artist_id', { 
                required: 'Artista é obrigatório',
                valueAsNumber: true 
              })}
              className="input w-full"
            >
              <option value="">Selecionar artista</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
            {errors.artist_id && (
              <p className="text-sm text-red-600 mt-1">{errors.artist_id.message}</p>
            )}
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
                placeholder="Ex: Rock, Pop, Semba"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Lançamento
              </label>
              <input
                {...register('release_date')}
                type="date"
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da Capa
            </label>
            <input
              {...register('cover_url')}
              type="url"
              className="input w-full"
              placeholder="https://exemplo.com/capa.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="input w-full resize-none"
              placeholder="Descrição do álbum..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                setEditingAlbum(null)
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
                <span>{editingAlbum ? 'Atualizar' : 'Criar'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Albums
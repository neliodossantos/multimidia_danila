import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { musicService } from '../../services/musicService'
import { artistService } from '../../services/artistService'
import { albumService } from '../../services/albumService'
import { Music, Artist, Album } from '../../types'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import EmptyState from '../../components/UI/EmptyState'
import Modal from '../../components/UI/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  MusicalNoteIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface MusicForm {
  title: string
  artist_id: number
  album_id?: number
  duration?: number
  track_number?: number
  lyrics?: string
  composer?: string
  file_url?: string
}

const MusicPage: React.FC = () => {
  const { user } = useAuthStore()
  const [music, setMusic] = useState<Music[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArtist, setSelectedArtist] = useState('')
  const [selectedAlbum, setSelectedAlbum] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMusic, setEditingMusic] = useState<Music | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<MusicForm>()
  const selectedArtistId = watch('artist_id')

  const canEdit = user?.is_editor || user?.is_admin

  useEffect(() => {
    fetchArtists()
  }, [])

  useEffect(() => {
    fetchMusic()
  }, [searchTerm, selectedArtist, selectedAlbum])

  useEffect(() => {
    if (selectedArtistId) {
      fetchAlbumsByArtist(selectedArtistId)
    }
  }, [selectedArtistId])

  const fetchArtists = async () => {
    try {
      const data = await artistService.getArtists({ limit: 100 })
      setArtists(data)
    } catch (error) {
      console.error('Error fetching artists:', error)
    }
  }

  const fetchAlbumsByArtist = async (artistId: number) => {
    try {
      const data = await albumService.getAlbums({ artist_id: artistId, limit: 100 })
      setAlbums(data)
    } catch (error) {
      console.error('Error fetching albums:', error)
    }
  }

  const fetchMusic = async () => {
    try {
      setLoading(true)
      const data = await musicService.getMusic({
        search: searchTerm || undefined,
        artist_id: selectedArtist ? parseInt(selectedArtist) : undefined,
        album_id: selectedAlbum ? parseInt(selectedAlbum) : undefined,
        limit: 50
      })
      setMusic(data)
    } catch (error) {
      console.error('Error fetching music:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (data: MusicForm) => {
    setSubmitting(true)
    try {
      if (editingMusic) {
        await musicService.updateMusic(editingMusic.id, data)
        toast.success('Música atualizada com sucesso!')
      } else {
        await musicService.createMusic(data)
        toast.success('Música criada com sucesso!')
      }
      
      setShowModal(false)
      setEditingMusic(null)
      reset()
      fetchMusic()
    } catch (error) {
      console.error('Error saving music:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (musicItem: Music) => {
    setEditingMusic(musicItem)
    reset({
      title: musicItem.title,
      artist_id: musicItem.artist_id,
      album_id: musicItem.album_id || undefined,
      duration: musicItem.duration || undefined,
      track_number: musicItem.track_number || undefined,
      lyrics: musicItem.lyrics || '',
      composer: musicItem.composer || '',
      file_url: musicItem.file_url || ''
    })
    
    // Load albums for the selected artist
    if (musicItem.artist_id) {
      fetchAlbumsByArtist(musicItem.artist_id)
    }
    
    setShowModal(true)
  }

  const handleDelete = async (musicItem: Music) => {
    if (!confirm(`Tem certeza que deseja eliminar a música "${musicItem.title}"?`)) {
      return
    }

    try {
      await musicService.deleteMusic(musicItem.id)
      toast.success('Música eliminada com sucesso!')
      fetchMusic()
    } catch (error) {
      console.error('Error deleting music:', error)
    }
  }

  const openCreateModal = () => {
    setEditingMusic(null)
    setAlbums([])
    reset()
    setShowModal(true)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Músicas</h1>
          <p className="text-gray-600">Gerir músicas e suas informações</p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nova Música</span>
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
            placeholder="Pesquisar músicas..."
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
          value={selectedAlbum}
          onChange={(e) => setSelectedAlbum(e.target.value)}
          className="input"
        >
          <option value="">Todos os álbuns</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
      </div>

      {/* Music List */}
      {music.length === 0 ? (
        <EmptyState
          icon={MusicalNoteIcon}
          title="Nenhuma música encontrada"
          description="Não há músicas cadastradas no sistema."
          action={canEdit ? {
            label: 'Criar primeira música',
            onClick: openCreateModal
          } : undefined}
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {music.length} música{music.length !== 1 ? 's' : ''} encontrada{music.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {music.map((musicItem, index) => (
              <div key={musicItem.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 w-8">
                      {musicItem.track_number || index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {musicItem.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>por {musicItem.artist_name}</span>
                        {musicItem.album_title && (
                          <span>• {musicItem.album_title}</span>
                        )}
                        {musicItem.composer && (
                          <span>• Compositor: {musicItem.composer}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {musicItem.duration && (
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDuration(musicItem.duration)}
                      </div>
                    )}
                    
                    {musicItem.file_url && (
                      <button
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Reproduzir"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    )}
                    
                    {canEdit && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(musicItem)}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(musicItem)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingMusic(null)
          reset()
          setAlbums([])
        }}
        title={editingMusic ? 'Editar Música' : 'Nova Música'}
        size="lg"
      >
        <form onSubmit={handleSubmit(handleCreateOrUpdate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título da Música *
            </label>
            <input
              {...register('title', { required: 'Título é obrigatório' })}
              type="text"
              className="input w-full"
              placeholder="Título da música"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Álbum
            </label>
            <select
              {...register('album_id', { valueAsNumber: true })}
              className="input w-full"
              disabled={!selectedArtistId}
            >
              <option value="">Selecionar álbum (opcional)</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
            {!selectedArtistId && (
              <p className="text-sm text-gray-500 mt-1">
                Selecione um artista primeiro para ver os álbuns
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número da Faixa
              </label>
              <input
                {...register('track_number', { valueAsNumber: true })}
                type="number"
                className="input w-full"
                placeholder="Ex: 1"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compositor
              </label>
              <input
                {...register('composer')}
                type="text"
                className="input w-full"
                placeholder="Nome do compositor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL do Arquivo
              </label>
              <input
                {...register('file_url')}
                type="url"
                className="input w-full"
                placeholder="https://exemplo.com/musica.mp3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Letra
            </label>
            <textarea
              {...register('lyrics')}
              rows={6}
              className="input w-full resize-none"
              placeholder="Letra da música..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                setEditingMusic(null)
                reset()
                setAlbums([])
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
                <span>{editingMusic ? 'Atualizar' : 'Criar'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MusicPage
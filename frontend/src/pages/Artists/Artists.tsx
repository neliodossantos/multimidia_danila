import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { artistService } from '../../services/artistService'
import { Artist } from '../../types'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import EmptyState from '../../components/UI/EmptyState'
import Modal from '../../components/UI/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  MicrophoneIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface ArtistForm {
  name: string
  biography?: string
  genre?: string
  country?: string
  formedYear?: number
  imageUrl?: string
}

const Artists: React.FC = () => {
  const { user } = useAuthStore()
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ArtistForm>()

  const canEdit = user?.is_editor || user?.is_admin

  useEffect(() => {
    fetchArtists()
  }, [searchTerm])

  const fetchArtists = async () => {
    try {
      setLoading(true)
      const data = await artistService.getArtists({
        search: searchTerm || undefined,
        limit: 50
      })
      setArtists(data)
    } catch (error) {
      console.error('Error fetching artists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (data: ArtistForm) => {
    setSubmitting(true)
    try {
      if (editingArtist) {
        await artistService.updateArtist(editingArtist.id, data)
        toast.success('Artista atualizado com sucesso!')
      } else {
        await artistService.createArtist(data)
        toast.success('Artista criado com sucesso!')
      }
      
      setShowModal(false)
      setEditingArtist(null)
      reset()
      fetchArtists()
    } catch (error) {
      console.error('Error saving artist:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist)
    reset({
      name: artist.name,
      biography: artist.biography || '',
      genre: artist.genre || '',
      country: artist.country || '',
      formedYear: artist.formed_year || undefined,
      imageUrl: artist.image_url || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (artist: Artist) => {
    if (!confirm(`Tem certeza que deseja eliminar o artista "${artist.name}"?`)) {
      return
    }

    try {
      await artistService.deleteArtist(artist.id)
      toast.success('Artista eliminado com sucesso!')
      fetchArtists()
    } catch (error) {
      console.error('Error deleting artist:', error)
    }
  }

  const openCreateModal = () => {
    setEditingArtist(null)
    reset()
    setShowModal(true)
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
          <h1 className="text-2xl font-bold text-gray-900">Artistas</h1>
          <p className="text-gray-600">Gerir artistas e suas informações</p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Novo Artista</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Pesquisar artistas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Artists Grid */}
      {artists.length === 0 ? (
        <EmptyState
          icon={MicrophoneIcon}
          title="Nenhum artista encontrado"
          description="Não há artistas cadastrados no sistema."
          action={canEdit ? {
            label: 'Criar primeiro artista',
            onClick: openCreateModal
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artists.map((artist) => (
            <div key={artist.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-1 aspect-h-1">
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <MicrophoneIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  <Link
                    to={`/artists/${artist.id}`}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {artist.name}
                  </Link>
                </h3>
                
                <div className="text-sm text-gray-600 space-y-1">
                  {artist.genre && (
                    <p><span className="font-medium">Género:</span> {artist.genre}</p>
                  )}
                  {artist.country && (
                    <p><span className="font-medium">País:</span> {artist.country}</p>
                  )}
                  {artist.formed_year && (
                    <p><span className="font-medium">Formado em:</span> {artist.formed_year}</p>
                  )}
                </div>

                {artist.biography && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                    {artist.biography}
                  </p>
                )}

                {canEdit && (
                  <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(artist)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(artist)}
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
          setEditingArtist(null)
          reset()
        }}
        title={editingArtist ? 'Editar Artista' : 'Novo Artista'}
        size="lg"
      >
        <form onSubmit={handleSubmit(handleCreateOrUpdate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Artista *
            </label>
            <input
              {...register('name', { required: 'Nome é obrigatório' })}
              type="text"
              className="input w-full"
              placeholder="Nome do artista"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
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
                País
              </label>
              <input
                {...register('country')}
                type="text"
                className="input w-full"
                placeholder="País de origem"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ano de Formação
              </label>
              <input
                {...register('formedYear', { 
                  valueAsNumber: true,
                  min: { value: 1900, message: 'Ano deve ser maior que 1900' },
                  max: { value: new Date().getFullYear(), message: 'Ano não pode ser futuro' }
                })}
                type="number"
                className="input w-full"
                placeholder="Ex: 1980"
              />
              {errors.formedYear && (
                <p className="text-sm text-red-600 mt-1">{errors.formedYear.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL da Imagem
              </label>
              <input
                {...register('imageUrl')}
                type="url"
                className="input w-full"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Biografia
            </label>
            <textarea
              {...register('biography')}
              rows={4}
              className="input w-full resize-none"
              placeholder="Biografia do artista..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                setEditingArtist(null)
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
                <span>{editingArtist ? 'Atualizar' : 'Criar'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Artists
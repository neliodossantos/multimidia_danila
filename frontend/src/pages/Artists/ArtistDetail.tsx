import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { artistService } from '../../services/artistService'
import { Artist } from '../../types'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import {
  MicrophoneIcon,
  PlayCircleIcon,
  MusicalNoteIcon,
  CalendarIcon,
  GlobeAltIcon,
  TagIcon
} from '@heroicons/react/24/outline'

const ArtistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArtist = async () => {
      if (!id) return

      try {
        const data = await artistService.getArtist(parseInt(id))
        setArtist(data)
      } catch (error) {
        console.error('Error fetching artist:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArtist()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Artista não encontrado</h2>
        <Link to="/artists" className="btn-primary">
          Voltar aos Artistas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            {artist.image_url ? (
              <img
                src={artist.image_url}
                alt={artist.name}
                className="h-48 w-full object-cover md:h-full md:w-48"
              />
            ) : (
              <div className="h-48 w-full md:h-full md:w-48 bg-gray-200 flex items-center justify-center">
                <MicrophoneIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{artist.name}</h1>
            
            <div className="flex flex-wrap gap-4 mb-6">
              {artist.genre && (
                <div className="flex items-center text-gray-600">
                  <TagIcon className="h-5 w-5 mr-2" />
                  <span>{artist.genre}</span>
                </div>
              )}
              {artist.country && (
                <div className="flex items-center text-gray-600">
                  <GlobeAltIcon className="h-5 w-5 mr-2" />
                  <span>{artist.country}</span>
                </div>
              )}
              {artist.formed_year && (
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  <span>Formado em {artist.formed_year}</span>
                </div>
              )}
            </div>

            {artist.biography && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Biografia</h3>
                <p className="text-gray-700 leading-relaxed">{artist.biography}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Albums */}
      {artist.albums && artist.albums.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <PlayCircleIcon className="h-6 w-6 mr-2" />
            Álbuns ({artist.albums.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artist.albums.map((album) => (
              <Link
                key={album.id}
                to={`/albums/${album.id}`}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {album.cover_url ? (
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                    <PlayCircleIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {album.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {album.release_date && new Date(album.release_date).getFullYear()}
                    {album.genre && ` • ${album.genre}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Music */}
      {artist.music && artist.music.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MusicalNoteIcon className="h-6 w-6 mr-2" />
            Músicas ({artist.music.length})
          </h2>
          <div className="space-y-2">
            {artist.music.map((music, index) => (
              <div
                key={music.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-500 w-8">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {music.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {music.album_title && `${music.album_title} • `}
                    {music.duration && `${Math.floor(music.duration / 60)}:${(music.duration % 60).toString().padStart(2, '0')}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!artist.albums || artist.albums.length === 0) && (!artist.music || artist.music.length === 0) && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MusicalNoteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum conteúdo disponível
          </h3>
          <p className="text-gray-500">
            Este artista ainda não tem álbuns ou músicas cadastrados.
          </p>
        </div>
      )}
    </div>
  )
}

export default ArtistDetail
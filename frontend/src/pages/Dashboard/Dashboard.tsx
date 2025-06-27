import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { artistService } from '../../services/artistService'
import { albumService } from '../../services/albumService'
import { musicService } from '../../services/musicService'
import { videoService } from '../../services/videoService'
import { Artist, Album, Music, Video } from '../../types'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import {
  MicrophoneIcon,
  PlayCircleIcon,
  MusicalNoteIcon,
  FilmIcon,
  UserGroupIcon,
  FolderIcon,
  StarIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

const Dashboard: React.FC = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    artists: 0,
    albums: 0,
    music: 0,
    videos: 0
  })
  const [recentArtists, setRecentArtists] = useState<Artist[]>([])
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([])
  const [recentMusic, setRecentMusic] = useState<Music[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [artists, albums, music, videos] = await Promise.all([
          artistService.getArtists({ limit: 5 }),
          albumService.getAlbums({ limit: 5 }),
          musicService.getMusic({ limit: 5 }),
          videoService.getVideos({ limit: 5 })
        ])

        setStats({
          artists: artists.length,
          albums: albums.length,
          music: music.length,
          videos: videos.length
        })

        setRecentArtists(artists)
        setRecentAlbums(albums)
        setRecentMusic(music)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const quickActions = [
    {
      name: 'Novo Artista',
      href: '/artists',
      icon: MicrophoneIcon,
      color: 'bg-blue-500',
      show: user?.is_editor || user?.is_admin
    },
    {
      name: 'Novo Álbum',
      href: '/albums',
      icon: PlayCircleIcon,
      color: 'bg-green-500',
      show: user?.is_editor || user?.is_admin
    },
    {
      name: 'Nova Música',
      href: '/music',
      icon: MusicalNoteIcon,
      color: 'bg-purple-500',
      show: user?.is_editor || user?.is_admin
    },
    {
      name: 'Novo Vídeo',
      href: '/videos',
      icon: FilmIcon,
      color: 'bg-red-500',
      show: user?.is_editor || user?.is_admin
    },
    {
      name: 'Grupos',
      href: '/groups',
      icon: UserGroupIcon,
      color: 'bg-indigo-500',
      show: true
    },
    {
      name: 'Ficheiros',
      href: '/files',
      icon: FolderIcon,
      color: 'bg-yellow-500',
      show: true
    }
  ].filter(action => action.show)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Bem-vindo, {user?.first_name}!
        </h1>
        <p className="text-primary-100">
          {user?.is_admin 
            ? 'Você tem acesso total ao sistema como administrador.'
            : user?.is_editor 
            ? 'Você pode criar e editar conteúdo como editor.'
            : 'Explore e desfrute do conteúdo disponível.'
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MicrophoneIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Artistas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.artists}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PlayCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Álbuns</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.albums}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MusicalNoteIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Músicas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.music}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FilmIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vídeos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.videos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className={`p-3 rounded-full ${action.color} mb-2`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 text-center">
                {action.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Artists */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Artistas Recentes</h2>
            <Link to="/artists" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {recentArtists.map((artist) => (
              <div key={artist.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <MicrophoneIcon className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {artist.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {artist.genre} • {artist.country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Albums */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Álbuns Recentes</h2>
            <Link to="/albums" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {recentAlbums.map((album) => (
              <div key={album.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {album.cover_url ? (
                    <img
                      src={album.cover_url}
                      alt={album.title}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-300 flex items-center justify-center">
                      <PlayCircleIcon className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {album.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {album.artist_name} • {album.genre}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
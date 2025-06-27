import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import {
  HomeIcon,
  UserGroupIcon,
  MusicalNoteIcon,
  FilmIcon,
  StarIcon,
  FolderIcon,
  UsersIcon,
  UserIcon,
  BellIcon,
  Cog6ToothIcon,
  MicrophoneIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'

const Sidebar: React.FC = () => {
  const { user } = useAuthStore()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Artistas', href: '/artists', icon: MicrophoneIcon },
    { name: 'Álbuns', href: '/albums', icon: PlayCircleIcon },
    { name: 'Músicas', href: '/music', icon: MusicalNoteIcon },
    { name: 'Vídeos', href: '/videos', icon: FilmIcon },
    { name: 'Reviews', href: '/reviews', icon: StarIcon },
    { name: 'Ficheiros', href: '/files', icon: FolderIcon },
    { name: 'Grupos', href: '/groups', icon: UserGroupIcon },
  ]

  const adminNavigation = [
    { name: 'Utilizadores', href: '/users', icon: UsersIcon },
  ]

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-2xl font-bold text-primary-600">ISPMedia</h1>
        </div>
        
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
            
            {user?.is_admin && (
              <>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="px-2 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administração
                  </p>
                </div>
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                ))}
              </>
            )}
          </nav>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.is_admin ? 'Administrador' : user?.is_editor ? 'Editor' : 'Utilizador'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
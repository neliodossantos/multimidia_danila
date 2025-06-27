import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useNotificationStore } from '../../stores/notificationStore'
import {
  BellIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'

const Header: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar artistas, álbuns, músicas..."
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              {unreadCount > 0 ? (
                <BellSolidIcon className="h-6 w-6 text-primary-600" />
              ) : (
                <BellIcon className="h-6 w-6" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.first_name}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="mr-3 h-4 w-4" />
                    Perfil
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setShowUserMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
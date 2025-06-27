import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../stores/authStore'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

interface LoginForm {
  username: string
  password: string
}

const Login: React.FC = () => {
  const { login, isLoading, isAuthenticated } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    await login(data.username, data.password)
  }

  return (
    <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Nome de utilizador ou email
          </label>
          <div className="mt-1">
            <input
              {...register('username', { required: 'Nome de utilizador é obrigatório' })}
              type="text"
              className="input w-full"
              placeholder="Digite seu nome de utilizador ou email"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Palavra-passe
          </label>
          <div className="mt-1">
            <input
              {...register('password', { required: 'Palavra-passe é obrigatória' })}
              type="password"
              className="input w-full"
              placeholder="Digite sua palavra-passe"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Entrar'
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Criar conta
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default Login
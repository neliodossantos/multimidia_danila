import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../stores/authStore'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

const Register: React.FC = () => {
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>()

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    const success = await registerUser({
      username: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName
    })

    if (success) {
      navigate('/login')
    }
  }

  return (
    <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              Primeiro nome
            </label>
            <div className="mt-1">
              <input
                {...register('firstName', { required: 'Primeiro nome é obrigatório' })}
                type="text"
                className="input w-full"
                placeholder="Primeiro nome"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Último nome
            </label>
            <div className="mt-1">
              <input
                {...register('lastName', { required: 'Último nome é obrigatório' })}
                type="text"
                className="input w-full"
                placeholder="Último nome"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Nome de utilizador
          </label>
          <div className="mt-1">
            <input
              {...register('username', { 
                required: 'Nome de utilizador é obrigatório',
                minLength: { value: 3, message: 'Nome de utilizador deve ter pelo menos 3 caracteres' }
              })}
              type="text"
              className="input w-full"
              placeholder="Nome de utilizador"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="mt-1">
            <input
              {...register('email', { 
                required: 'Email é obrigatório',
                pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' }
              })}
              type="email"
              className="input w-full"
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Palavra-passe
          </label>
          <div className="mt-1">
            <input
              {...register('password', { 
                required: 'Palavra-passe é obrigatória',
                minLength: { value: 6, message: 'Palavra-passe deve ter pelo menos 6 caracteres' }
              })}
              type="password"
              className="input w-full"
              placeholder="Palavra-passe"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmar palavra-passe
          </label>
          <div className="mt-1">
            <input
              {...register('confirmPassword', { 
                required: 'Confirmação de palavra-passe é obrigatória',
                validate: value => value === password || 'As palavras-passe não coincidem'
              })}
              type="password"
              className="input w-full"
              placeholder="Confirmar palavra-passe"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
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
              'Criar conta'
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Fazer login
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default Register
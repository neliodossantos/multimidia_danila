import React from 'react'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export default EmptyState
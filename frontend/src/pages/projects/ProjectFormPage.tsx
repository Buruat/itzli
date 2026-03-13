import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsApi } from '../../api/projects'
import type { ApiErrors } from '../../types'
import ErrorList from '../../components/ErrorList'

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [errors, setErrors] = useState<ApiErrors>({})
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (id) {
      projectsApi.show(id).then(p => {
        setName(p.name)
        setLoading(false)
      })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = isEdit
      ? await projectsApi.update(id!, { name })
      : await projectsApi.create({ name })
    if (Object.keys(result.errors).length === 0) {
      navigate('/projects')
    } else {
      setErrors(result.errors)
    }
  }

  if (loading) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? 'Редактировать проект' : 'Создать проект'}
      </h1>
      <ErrorList errors={errors} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
          >
            {isEdit ? 'Сохранить' : 'Создать'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="text-gray-600 px-4 py-2 rounded-md text-sm hover:text-gray-900"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

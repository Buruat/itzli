import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsApi } from '../../api/projects'
import type { ApiErrors } from '../../types'
import ErrorList from '../../components/ErrorList'

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<ApiErrors>({})
  const [loading, setLoading] = useState(isEdit)
  const imageRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) {
      projectsApi.show(id).then(p => {
        setName(p.name)
        setDescription(p.description ?? '')
        setLoading(false)
      })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name,
      description,
      image: imageRef.current?.files?.[0] ?? null,
    }
    const result = isEdit
      ? await projectsApi.update(id!, data)
      : await projectsApi.create(data)
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Изображение</label>
          <input
            type="file"
            accept="image/*"
            ref={imageRef}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
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

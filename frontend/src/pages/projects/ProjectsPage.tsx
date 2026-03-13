import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../../api/projects'
import type { Project } from '../../types'
import ConfirmButton from '../../components/ConfirmButton'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsApi.index().then(data => {
      setProjects(data)
      setLoading(false)
    })
  }, [])

  const handleDelete = async (id: string) => {
    await projectsApi.destroy(id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Проекты</h1>
        <Link
          to="/projects/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
        >
          Создать
        </Link>
      </div>
      {projects.length === 0 ? (
        <p className="text-gray-500">Проектов пока нет.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4">Название</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">
                  <Link to={`/projects/${p.id}`} className="text-indigo-600 hover:text-indigo-800">
                    {p.name}
                  </Link>
                </td>
                <td className="py-2">
                  <div className="flex gap-3 justify-end">
                    <Link
                      to={`/projects/${p.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      Редактировать
                    </Link>
                    <ConfirmButton onConfirm={() => handleDelete(p.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

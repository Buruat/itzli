import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { projectsApi } from '../../api/projects'
import { tasksApi } from '../../api/tasks'
import type { Project, Task } from '../../types'

export default function ProjectShowPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([projectsApi.show(id), tasksApi.index(id)]).then(([proj, taskList]) => {
      setProject(proj)
      setTasks(taskList)
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-gray-500">Загрузка...</p>
  if (!project) return <p className="text-gray-500">Проект не найден.</p>

  return (
    <div>
      {project.image_url && (
        <img
          src={project.image_url}
          alt={project.name}
          className="w-full max-h-64 object-cover rounded-lg mb-6"
        />
      )}
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Link
          to={`/projects/${id}/edit`}
          className="text-indigo-600 hover:text-indigo-800 text-sm"
        >
          Редактировать
        </Link>
      </div>
      {project.description && (
        <p className="text-gray-700 mb-6 whitespace-pre-wrap">{project.description}</p>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Задачи</h2>
        <Link
          to={`/tasks/new?project_id=${id}`}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
        >
          Создать задачу
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="text-gray-500">Задач пока нет.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4">Название</th>
              <th className="py-2 pr-4">Тип</th>
              <th className="py-2">Дедлайн</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">
                  <Link to={`/tasks/${t.id}/edit`} className="text-indigo-600 hover:text-indigo-800">
                    {t.name}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-gray-600">{t.task_type === 'bug' ? 'Баг' : 'Задача'}</td>
                <td className="py-2 text-gray-600">{t.deadline_date ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

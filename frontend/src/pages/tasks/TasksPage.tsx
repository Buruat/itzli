import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tasksApi } from '../../api/tasks'
import type { Task } from '../../types'
import ConfirmButton from '../../components/ConfirmButton'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tasksApi.index().then(data => {
      setTasks(data)
      setLoading(false)
    })
  }, [])

  const handleDelete = async (id: string) => {
    await tasksApi.destroy(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  if (loading) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Задачи</h1>
        <Link
          to="/tasks/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
        >
          Создать
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
              <th className="py-2 pr-4">Дедлайн</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">{t.name}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      t.task_type === 'bug'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {t.task_type === 'bug' ? 'Баг' : 'Задача'}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-500">{t.deadline_date ?? '—'}</td>
                <td className="py-2">
                  <div className="flex gap-3 justify-end">
                    <Link
                      to={`/tasks/${t.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      Редактировать
                    </Link>
                    <ConfirmButton onConfirm={() => handleDelete(t.id)} />
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

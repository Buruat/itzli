import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { tasksApi } from '../../api/tasks'
import { projectsApi } from '../../api/projects'
import type { ApiErrors, Project } from '../../types'
import ErrorList from '../../components/ErrorList'

export default function TaskFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [taskType, setTaskType] = useState<'bug' | 'task'>('task')
  const [projectId, setProjectId] = useState(searchParams.get('project_id') ?? '')
  const [timeSpent, setTimeSpent] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [errors, setErrors] = useState<ApiErrors>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = projectsApi.index()
    const fetchTask = id ? tasksApi.show(id) : Promise.resolve(null)
    Promise.all([fetchProjects, fetchTask]).then(([projs, task]) => {
      setProjects(projs)
      if (task) {
        setName(task.name)
        setDescription(task.description ?? '')
        setTaskType(task.task_type)
        setProjectId(task.project_id ?? '')
        setTimeSpent(task.time_spent?.toString() ?? '')
        setEstimatedTime(task.estimated_time?.toString() ?? '')
        setDeadlineDate(task.deadline_date ?? '')
      }
      setLoading(false)
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name,
      description: description || null,
      task_type: taskType,
      project_id: projectId || null,
      time_spent: timeSpent ? Number(timeSpent) : null,
      estimated_time: estimatedTime ? Number(estimatedTime) : null,
      deadline_date: deadlineDate || null,
    }
    const result = isEdit
      ? await tasksApi.update(id!, data)
      : await tasksApi.create(data)
    if (Object.keys(result.errors).length === 0) {
      navigate('/tasks')
    } else {
      setErrors(result.errors)
    }
  }

  if (loading) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? 'Редактировать задачу' : 'Создать задачу'}
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
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
          <select
            value={taskType}
            onChange={e => setTaskType(e.target.value as 'bug' | 'task')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="task">Задача</option>
            <option value="bug">Баг</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Проект</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— без проекта —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Затрачено времени (ч)
            </label>
            <input
              type="number"
              value={timeSpent}
              onChange={e => setTimeSpent(e.target.value)}
              min={0}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Оценка времени (ч)
            </label>
            <input
              type="number"
              value={estimatedTime}
              onChange={e => setEstimatedTime(e.target.value)}
              min={0}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Дедлайн</label>
          <input
            type="date"
            value={deadlineDate}
            onChange={e => setDeadlineDate(e.target.value)}
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
            onClick={() => navigate('/tasks')}
            className="text-gray-600 px-4 py-2 rounded-md text-sm hover:text-gray-900"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

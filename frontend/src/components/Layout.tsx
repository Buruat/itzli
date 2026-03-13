import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex gap-6 items-center">
        <span className="font-bold text-lg text-indigo-600">Itzli</span>
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            isActive ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'
          }
        >
          Проекты
        </NavLink>
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            isActive ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'
          }
        >
          Задачи
        </NavLink>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

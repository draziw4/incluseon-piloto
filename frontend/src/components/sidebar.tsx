import { Settings, LogOut, Sparkles } from "lucide-react"

import { NavLink } from "react-router-dom"

import { useAuth } from "../features/auth/hooks/use-auth"
import { navigationItems } from "../routes/navigation"

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-blue-100 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-blue-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Sparkles size={18} />
        </div>

        <div>
          <h1 className="text-lg font-bold text-blue-950">
            IncluseON
          </h1>
          <p className="text-xs text-zinc-400">
            Acompanhamento AEE
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-blue-50 hover:text-blue-700"
                ].join(" ")
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-blue-100 p-4">
        <NavLink to="/settings" className="flex w-full items-center gap-3 rounded-xl border border-blue-100 px-3 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50">
          <Settings size={18} />
          Configurações
        </NavLink>

        <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-blue-950">
              {user?.name || "Usuário"}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {user?.email}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            aria-label="Sair da conta"
            title="Sair"
            className="text-zinc-400 hover:text-red-500"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}

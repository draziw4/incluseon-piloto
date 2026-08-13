import { Bell, HelpCircle } from "lucide-react"
import { useLocation } from "react-router-dom"

import { useAuth } from "../features/auth/hooks/use-auth"
import { getNavigationTitle } from "../routes/navigation"
import { isPilotMode } from "../config/pilot"

export function Navbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  return (
    <header className="flex h-16 items-center justify-between border-b border-blue-100 bg-white px-6">
      <div>
        <h2 className="text-lg font-bold text-blue-950">
          {getNavigationTitle(pathname)}
        </h2>
        <p className="text-xs text-zinc-500">
          Bem-vindo de volta, {user?.name}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {isPilotMode ? "Piloto" : "Ativo"}
        </span>

        <button type="button" aria-label="Notificações" title="Notificações" className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 text-zinc-500 hover:bg-blue-50 hover:text-blue-700">
          <Bell size={18} />
        </button>

        <button type="button" aria-label="Ajuda" title="Ajuda" className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 text-zinc-500 hover:bg-blue-50 hover:text-blue-700">
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  )
}

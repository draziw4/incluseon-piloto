import { Bell, CheckCheck, ClipboardCheck, Link2, ShieldCheck, UserCheck, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useNotificationMutations, useNotifications } from "../hooks/use-notifications"
import type { AppNotification } from "../types/notification"

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { data, isLoading, isError } = useNotifications()
  const { markReadMutation, markAllReadMutation } = useNotificationMutations()
  const unreadCount = data?.unread_count ?? 0

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [])

  async function openNotification(notification: AppNotification) {
    try {
      if (!notification.read_at) await markReadMutation.mutateAsync(notification.id)
    } finally {
      setOpen(false)
      if (notification.action_url?.startsWith("/")) navigate(notification.action_url)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `Notificações: ${unreadCount} não lida(s)` : "Notificações"}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Notificações"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 text-zinc-500 hover:bg-blue-50 hover:text-blue-700"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="motion-notice absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Central de notificações"
          className="motion-popover fixed inset-x-3 top-17 z-50 max-h-[75vh] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[420px]"
        >
          <div className="flex items-center justify-between border-b border-blue-100 px-4 py-3">
            <div>
              <h3 className="font-bold text-blue-950">Notificações</h3>
              <p className="text-xs text-zinc-500">{unreadCount} não lida(s)</p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  <CheckCheck size={15} /> Marcar todas
                </button>
              ) : null}
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar notificações" className="rounded-lg p-2 text-zinc-500 hover:bg-slate-100">
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(75vh-68px)] overflow-y-auto">
            {isLoading ? <p className="p-6 text-center text-sm text-zinc-500">Carregando notificações...</p> : null}
            {isError ? <p className="m-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">Não foi possível carregar as notificações.</p> : null}
            {!isLoading && !isError && data?.items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto text-blue-300" size={28} />
                <p className="mt-3 font-semibold text-blue-950">Nenhuma notificação</p>
                <p className="mt-1 text-sm text-zinc-500">Novos vínculos, pareceres e autorizações aparecerão aqui.</p>
              </div>
            ) : null}
            {data?.items.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void openNotification(notification)}
                className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-blue-50 ${notification.read_at ? "bg-white" : "bg-blue-50/60"}`}
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notificationTone(notification.event_type)}`}>
                  <NotificationIcon eventType={notification.event_type} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span className="flex-1 text-sm font-semibold text-blue-950">{notification.title}</span>
                    {!notification.read_at ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Não lida" /> : null}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-zinc-600">{notification.message}</span>
                  <span className="mt-2 block text-xs text-zinc-400">{formatNotificationDate(notification.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function NotificationIcon({ eventType }: { eventType: string }) {
  if (eventType.includes("report")) return <ClipboardCheck size={18} />
  if (eventType.includes("account")) return <UserCheck size={18} />
  if (eventType.includes("permission")) return <ShieldCheck size={18} />
  return <Link2 size={18} />
}

function notificationTone(eventType: string) {
  if (eventType.includes("adjustment") || eventType.includes("pending")) return "bg-amber-100 text-amber-700"
  if (eventType.includes("reviewed")) return "bg-emerald-100 text-emerald-700"
  return "bg-blue-100 text-blue-700"
}

function formatNotificationDate(value: string) {
  const utcValue = /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(utcValue))
}

export function PageLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-56 items-center justify-center bg-slate-50 text-blue-700"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="route-loader-dot h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span className="route-loader-dot h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span className="route-loader-dot h-2.5 w-2.5 rounded-full bg-blue-600" />
        </div>
        <span className="text-sm font-medium">Preparando a página...</span>
      </div>
    </div>
  )
}

import { useEffect, useRef } from "react"

type GoogleCredentialResponse = {
  credential: string
}

type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string
      callback: (response: GoogleCredentialResponse) => void
    }) => void
    renderButton: (
      parent: HTMLElement,
      options: {
        theme: "outline"
        size: "large"
        shape: "rectangular"
        text: "continue_with"
        width: number
        locale: string
      },
    ) => void
  }
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts }
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services"
let googleScriptPromise: Promise<void> | null = null

function loadGoogleIdentityServices() {
  if (window.google?.accounts.id) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Google indisponível")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.id = GOOGLE_SCRIPT_ID
    script.src = "https://accounts.google.com/gsi/client?hl=pt-BR"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Google indisponível"))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

type GoogleSignInButtonProps = {
  clientId: string
  onCredential: (credential: string) => void
  onError: () => void
  busy?: boolean
}

export function GoogleSignInButton({
  clientId,
  onCredential,
  onError,
  busy = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    void loadGoogleIdentityServices()
      .then(() => {
        if (!active || !containerRef.current || !window.google) return
        containerRef.current.replaceChildren()
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredential(response.credential),
        })
        const buttonWidth = Math.min(336, containerRef.current.clientWidth || 336)
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          width: buttonWidth,
          locale: "pt-BR",
        })
      })
      .catch(() => {
        if (active) onError()
      })

    return () => {
      active = false
    }
  }, [clientId, onCredential, onError])

  return (
    <div
      className={busy ? "pointer-events-none flex justify-center opacity-60" : "flex justify-center"}
      aria-label="Continuar com Google"
      aria-busy={busy}
      ref={containerRef}
    />
  )
}

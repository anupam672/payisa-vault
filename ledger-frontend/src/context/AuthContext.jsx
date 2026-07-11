import { createContext, useContext, useState, useCallback } from "react"
import { authApi } from "../api/client"

const AuthContext = createContext(null)

const STORAGE_KEY = "ledger_session"

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session) {
  if (session) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } else {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password })
    const next = { user: data.user, token: data.token }
    setSession(next)
    saveSession(next)
    return next
  }, [])

  const register = useCallback(async (name, email, password) => {
    const data = await authApi.register({ name, email, password })
    const next = { user: data.user, token: data.token }
    setSession(next)
    saveSession(next)
    return next
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout(session?.token)
    } catch {
      // proceed with local logout even if the API call fails
    }
    setSession(null)
    saveSession(null)
  }, [session])

  const value = {
    user: session?.user || null,
    token: session?.token || null,
    isAuthenticated: !!session?.token,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

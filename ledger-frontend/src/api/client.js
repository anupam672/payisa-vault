const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  logout: (token) => request("/auth/logout", { method: "POST", token }),
}

export const accountApi = {
  create: (token) => request("/accounts/", { method: "POST", token }),
  list: (token) => request("/accounts/", { method: "GET", token }),
  balance: (accountId, token) => request(`/accounts/balance/${accountId}`, { method: "GET", token }),
}

export const transactionApi = {
  create: (payload, token) => request("/transactions/", { method: "POST", body: payload, token }),
  list: (token, { page = 1, limit = 20 } = {}) =>
    request(`/transactions/?page=${page}&limit=${limit}`, { method: "GET", token }),
  getById: (id, token) => request(`/transactions/${id}`, { method: "GET", token }),
}

function genIdempotencyKey() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export { genIdempotencyKey }
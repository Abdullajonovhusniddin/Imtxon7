import axios from 'axios'

const DEFAULT_API_BASE = 'https://najot-edu.softwareengineer.uz/api/v1'

export const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE

export const buildApiUrl = (path = '') => {
  if (!path || path.startsWith('http://') || path.startsWith('https://')) return path
  const base = API_BASE.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${normalizedPath}` : normalizedPath
}

const getCookie = (name) => {
  if (typeof document === 'undefined') return null
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')

  return value ? decodeURIComponent(value) : null
}

const setCookie = (name, value, maxAge = 60 * 60 * 24 * 30) => {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

const deleteCookie = (name) => {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

export const getAuthToken = () => {
  const storageToken = localStorage.getItem('token')
  if (storageToken) return storageToken

  const cookieToken = getCookie('token')
  if (cookieToken) {
    localStorage.setItem('token', cookieToken)
    return cookieToken
  }

  return null
}

const parseJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null

  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

export const getUserRole = () => {
  const storedUser = getStoredUser()
  const tokenPayload = parseJwtPayload(getAuthToken())
  const role =
    storedUser?.role ||
    storedUser?.Role?.name ||
    storedUser?.type ||
    storedUser?.user_role ||
    tokenPayload?.role ||
    tokenPayload?.Role?.name ||
    tokenPayload?.type ||
    tokenPayload?.user_role

  return role ? String(role).toLowerCase() : ''
}

export const saveAuth = ({ token, userPhone, user }) => {
  if (token) {
    localStorage.setItem('token', token)
    setCookie('token', token)
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user))
  }
  if (userPhone) {
    localStorage.setItem('userPhone', userPhone)
    setCookie('userPhone', userPhone)
  }
}

const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userPhone')
  localStorage.removeItem('user')
  deleteCookie('token')
  deleteCookie('userPhone')
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}

const api = axios.create({
  baseURL: API_BASE,
})

// Request interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth and formatting error messages
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        clearAuth()
      }
      
      const data = error.response.data
      const message = data?.message || data?.error || error.message || 'API error'
      error.message = message
    }
    return Promise.reject(error)
  }
)

// Wrapper functions for compatibility
export const getJson = async (path, options = {}) => {
  const { headers, ...config } = options
  const response = await api.get(path, {
    headers,
    ...config,
  })
  return response.data
}

export const postJson = async (path, body, options = {}) => {
  const { headers, ...config } = options
  const response = await api.post(path, body, {
    headers,
    ...config,
  })
  return response.data
}

export const putJson = async (path, body, options = {}) => {
  const { headers, ...config } = options
  const response = await api.put(path, body, {
    headers,
    ...config,
  })
  return response.data
}

export const patchJson = async (path, body, options = {}) => {
  const { headers, ...config } = options
  const response = await api.patch(path, body, {
    headers,
    ...config,
  })
  return response.data
}

export const deleteJson = async (path, options = {}) => {
  const { headers, ...config } = options
  const response = await api.delete(path, {
    headers,
    ...config,
  })
  return response.data
}

export default api

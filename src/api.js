import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

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

export const saveAuth = ({ token, userPhone }) => {
  if (token) {
    localStorage.setItem('token', token)
    setCookie('token', token)
  }
  if (userPhone) {
    localStorage.setItem('userPhone', userPhone)
    setCookie('userPhone', userPhone)
  }
}

const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userPhone')
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

// Response interceptor to handle 401/403 and formatting error messages
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401 || status === 403) {
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

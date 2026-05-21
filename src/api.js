const API_BASE = 'https://najot-edu.softwareengineer.uz/api/v1'

const getToken = () => localStorage.getItem('token')

const getHeaders = (options = {}) => {
  const token = getToken()
  const headers = {
    ...(options.headers || {}),
  }

  if (options.json !== false && headers['Content-Type'] == null) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

const handleResponse = async (response) => {
  const text = await response.text().catch(() => '')
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch (err) {
    data = text
  }

  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || 'API error'
    const error = new Error(message)
    error.response = response
    error.data = data
    throw error
  }

  return data
}

const fetchJson = async (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const init = {
    ...options,
    headers: getHeaders(options),
  }

  if (options.body instanceof FormData) {
    delete init.headers['Content-Type']
  } else if (options.body && typeof options.body !== 'string' && init.headers['Content-Type'] === 'application/json') {
    init.body = JSON.stringify(options.body)
  }

  const response = await fetch(url, init)
  return handleResponse(response)
}

export const getJson = (path, options = {}) => fetchJson(path, { method: 'GET', ...options })
export const postJson = (path, body, options = {}) => fetchJson(path, { method: 'POST', body, ...options })
export const putJson = (path, body, options = {}) => fetchJson(path, { method: 'PUT', body, ...options })
export const deleteJson = (path, options = {}) => fetchJson(path, { method: 'DELETE', ...options })

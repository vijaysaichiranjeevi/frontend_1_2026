import axios from 'axios'

// In development, Vite dev proxy maps '/api' to 'http://localhost:8080/api'.
// If Vite proxy is not used, it can also point directly to http://localhost:8080/api.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const isAuthRoute = err.config?.url?.includes('/auth/')
      if (!isAuthRoute) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api

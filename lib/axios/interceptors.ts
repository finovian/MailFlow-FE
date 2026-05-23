
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'
import { createClient } from '@/lib/supabase/client'
import type { ApiError } from '@/types/api'


const ERROR_CODE_UNAUTHORIZED = 'UNAUTHORIZED'
const ERROR_CODE_TIMEOUT = 'TIMEOUT'
const ERROR_CODE_NETWORK = 'NETWORK_ERROR'
const ERROR_CODE_UNKNOWN = 'UNKNOWN_ERROR'

const TIMEOUT_MESSAGE = 'The request timed out. Please try again.'
const NETWORK_MESSAGE = 'A network error occurred. Please check your connection.'


export function attachAuthInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        config.headers.set('Authorization', `Bearer ${session.access_token}`)
      }

      return config
    },
  )
}

export function attachErrorInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    // success pass-through
    (response) => response,

    // error handler
    (error: AxiosError<{ message?: string; code?: string }>) => {
      // Timeout
      if (error.code === 'ECONNABORTED') {
        const apiError: ApiError = {
          message: TIMEOUT_MESSAGE,
          code: ERROR_CODE_TIMEOUT,
          status: 408,
        }
        return Promise.reject(apiError)
      }


      if (!error.response) {
        const apiError: ApiError = {
          message: NETWORK_MESSAGE,
          code: ERROR_CODE_NETWORK,
          status: 0,
        }
        return Promise.reject(apiError)
      }

      const { status, data } = error.response

      // 401 → sign out and redirect to login
      if (status === 401 && typeof window !== 'undefined') {
        const supabase = createClient()
        supabase.auth.signOut().finally(() => {
          window.location.href = '/login'
        })
      }

      const apiError: ApiError = {
        message: data?.message ?? error.message ?? 'An unexpected error occurred',
        code: data?.code ?? ERROR_CODE_UNKNOWN,
        status,
      }

      return Promise.reject(apiError)
    },
  )
}

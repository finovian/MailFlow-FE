

import axios from 'axios'
import { attachAuthInterceptor, attachErrorInterceptor } from './interceptors'

/** Default timeout for backend API requests (10 seconds). */
const API_TIMEOUT_MS = 10_000

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

attachAuthInterceptor(apiClient)
attachErrorInterceptor(apiClient)

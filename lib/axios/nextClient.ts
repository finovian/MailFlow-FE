
import axios from 'axios'
import { attachAuthInterceptor, attachErrorInterceptor } from './interceptors'

/** Default timeout for internal API routes (30 seconds). */
const NEXT_TIMEOUT_MS = 30_000

export const nextClient = axios.create({
  baseURL: '',
  timeout: NEXT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

attachAuthInterceptor(nextClient)
attachErrorInterceptor(nextClient)

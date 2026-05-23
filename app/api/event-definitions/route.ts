import { NextResponse } from 'next/server'

/**
 * GET /api/event-definitions
 *
 * Returns the full dynamic event registry as JSON.
 * Frontend components can fetch this to avoid importing the registry directly
 * (useful for future dynamic / webhook-driven events loaded from a database).
 */
export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/'
    // Add auth headers or other context if required, but since this route is internal,
    // we fetch definitions directly. Note: backend might require authentication.
    // If the backend /event-definitions is authenticated, we might need to pass headers.
    // However, the client component calls apiClient directly (which has auth interceptors).
    // This server route can just fetch from backend event-definitions or serve a fallback.
    const res = await fetch(`${backendUrl}event-definitions`, {
      cache: 'no-store',
    })
    
    if (!res.ok) {
      throw new Error(`Backend responded with status ${res.status}`)
    }
    
    const body = await res.json()
    const definitions = body.data || body

    return NextResponse.json(definitions, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[event-definitions] Failed to load registry from backend:', err)
    return NextResponse.json(
      { error: 'Failed to load event definitions' },
      { status: 500 },
    )
  }
}

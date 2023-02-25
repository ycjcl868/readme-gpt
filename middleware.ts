import csrf from 'edge-csrf'
import { NextResponse } from 'next/server'

// initalize protection function
const csrfProtect = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production'
  }
})

export async function middleware(request) {
  const response = NextResponse.next()

  // csrf protection
  const csrfError = await csrfProtect(request, response)

  // check result
  if (csrfError) {
    return new NextResponse('invalid csrf token', { status: 403 })
  }

  return response
}

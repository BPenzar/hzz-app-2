import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const providerError = requestUrl.searchParams.get('error')
  const providerErrorDescription = requestUrl.searchParams.get('error_description')
  const redirectPath = requestUrl.searchParams.get('redirectTo')
  const safeRedirectPath =
    redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')
      ? redirectPath
      : '/dashboard'

  if (providerError) {
    const fallbackUrl = new URL('/auth/login', request.url)
    fallbackUrl.searchParams.set('error', providerError)
    if (providerErrorDescription) {
      fallbackUrl.searchParams.set('error_description', providerErrorDescription)
    }
    return NextResponse.redirect(fallbackUrl)
  }

  if (!code) {
    const fallbackUrl = new URL('/auth/login', request.url)
    fallbackUrl.searchParams.set('error', 'oauth_missing_code')
    return NextResponse.redirect(fallbackUrl)
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const fallbackUrl = new URL('/auth/login', request.url)
    fallbackUrl.searchParams.set('error', 'oauth_exchange_failed')
    return NextResponse.redirect(fallbackUrl)
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(new URL(safeRedirectPath, request.url))
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { GoogleButton } from '@/components/auth/GoogleButton'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTo = (() => {
    const value = searchParams.get('redirectTo')
    if (!value || !value.startsWith('/') || value.startsWith('//')) {
      return null
    }
    return value
  })()

  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (!oauthError) return

    const errorDescription = searchParams.get('error_description')
    if (errorDescription) {
      setError(errorDescription)
      return
    }

    const errorMap: Record<string, string> = {
      oauth_missing_code: 'Google prijava nije dovršena. Pokušajte ponovno.',
      oauth_exchange_failed: 'Ne možemo dovršiti Google prijavu. Pokušajte ponovno.',
      access_denied: 'Google prijava je otkazana. Pokušajte ponovno.',
    }

    setError(errorMap[oauthError] ?? 'Ne možemo se prijaviti putem Googlea.')
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    toast({
      title: 'Uspješna prijava',
      description: 'Preusmjeravanje na dashboard...',
    })

    router.push(redirectTo ?? '/dashboard')
    router.refresh()
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const redirectUrl = new URL('/auth/callback', window.location.origin)
    if (redirectTo) {
      redirectUrl.searchParams.set('redirectTo', redirectTo)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl.toString(),
      },
    })

    if (error) {
      setError(error.message ?? 'Neuspješna Google prijava.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <GoogleButton disabled={isLoading} onClick={handleGoogleSignIn} />

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>ili s emailom</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="ime@primjer.com"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Lozinka</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 text-white hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? 'Prijava u tijeku...' : 'Prijavi se'}
      </Button>
    </form>
  )
}

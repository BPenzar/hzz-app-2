import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-100/70 via-white to-slate-50 flex flex-col">
      <Header showAuth={true} showAuthButtons={false} />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-primary">
              HZZ Zahtjev
            </Link>
          </div>

          <Card className="border-white/80 bg-white/95 shadow-xl shadow-slate-200/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Prijava</CardTitle>
              <CardDescription>
                Unesite svoje podatke za pristup aplikaciji
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-gray-600">
                Nemate račun?{' '}
                <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                  Registrirajte se
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}

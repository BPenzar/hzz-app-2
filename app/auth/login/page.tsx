import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showAuth={false} />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-primary">
              HZZ Zahtjev
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Prijava</CardTitle>
              <CardDescription>
                Unesite svoje podatke za pristup aplikaciji
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
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

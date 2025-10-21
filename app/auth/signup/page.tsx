import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function SignupPage() {
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
              <CardTitle>Registracija</CardTitle>
              <CardDescription>
                Kreirajte novi račun za pristup aplikaciji
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignupForm />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-gray-600">
                Već imate račun?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Prijavite se
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

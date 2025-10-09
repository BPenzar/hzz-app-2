import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary">
            HZZ-App
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
  )
}

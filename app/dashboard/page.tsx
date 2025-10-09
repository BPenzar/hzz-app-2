import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ApplicationList } from '@/components/dashboard/ApplicationList'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Ensure user profile exists (fallback if trigger failed)
  await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      role: 'applicant',
    } as any)

  // Fetch user's applications
  const { data: applications, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Moje prijave</h1>
            <p className="text-gray-600 mt-1">
              Upravljajte svojim HZZ zahtjevima
            </p>
          </div>
          <Link href="/applications/new">
            <Button size="lg">
              <PlusCircle className="h-5 w-5 mr-2" />
              Nova prijava
            </Button>
          </Link>
        </div>

        <ApplicationList applications={applications || []} />
      </div>

      <Footer />
    </div>
  )
}

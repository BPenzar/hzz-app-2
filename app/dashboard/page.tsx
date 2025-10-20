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
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching applications:', error)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header user={user} />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Moje prijave</h1>
            <p className="text-muted-foreground mt-2">
              Upravljajte svojim HZZ zahtjevima
            </p>
          </div>
          <Link href="/applications/new">
            <Button size="lg" className="rounded-full">
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

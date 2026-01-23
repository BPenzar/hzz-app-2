import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GuestLanding } from '@/components/landing/GuestLanding'
import { createServerClient } from '@/lib/supabase/server'

export default async function PrimjerPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header user={user} showAuth={true} />
      <GuestLanding />
      <Footer />
    </div>
  )
}

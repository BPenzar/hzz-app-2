import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { GuestLanding } from '@/components/landing/GuestLanding'

export default async function HomePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header user={user} showAuth={true} />

      {user ? (
        <section className="container mx-auto px-4 py-16 md:py-20 text-center flex items-center justify-center flex-1">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-accent/10 rounded-full">
              <Sparkles className="h-4 w-4 text-foreground" />
              <p className="text-sm font-medium text-foreground">Vaš HZZ zahtjev, sve na jednom mjestu</p>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-foreground tracking-tight leading-tight">
              Dobrodošli natrag
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Nastavite uređivati svoje zahtjeve ili otvorite novi nacrt uz napredni AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/applications/new">
                <Button size="lg" className="text-lg px-8 py-5 bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-lg hover:shadow-xl">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Novi zahtjev s AI
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="text-lg px-8 py-5 transition-colors">
                  Otvori nadzornu ploču
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <GuestLanding />
      )}
      <Footer />
    </div>
  )
}

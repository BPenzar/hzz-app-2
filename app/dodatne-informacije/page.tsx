import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { createServerClient } from '@/lib/supabase/server'

export default async function AdditionalInfoPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header user={user} showAuth={true} />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col justify-center min-h-[70vh] md:min-h-[calc(100vh-8rem)]">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">HZZ potpora</p>
            <h1 className="mt-4 text-3xl md:text-5xl font-semibold text-foreground">
              Pripremite HZZ zahtjev uz AI
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              Odgovorite na nekoliko kratkih pitanja, a AI priprema nacrt poslovnog plana i troškovnika za Vaš
              zahtjev za sredstva za samozapošljavanje HZZ-a.
              <br />
              <Link
                href="https://mjere.hzz.hr/mjere/potpore-za-samozaposljavanje-2026/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-1 text-blue-600 underline"
              >
                https://mjere.hzz.hr/mjere/potpore-za-samozaposljavanje-2026/
              </Link>
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Link href="/primjer" className="w-full sm:w-auto">
                <Button
                  size="default"
                  className="w-full sm:w-auto h-11 px-8 text-base shadow-lg bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200"
                >
                  Kreiraj Primjer Zahtjeva
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                Primjer za 3 minute, bez registracije.
              </p>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Izvoz PDF/DOCX, trajno spremanje i napredni AI uz registraciju.
            </p>
          </div>

        </section>
      </main>

      <Footer />
    </div>
  )
}

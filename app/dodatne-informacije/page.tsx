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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-100/70 via-white to-slate-50 flex flex-col">
      <Header user={user} showAuth={true} />

      <main className="relative z-10 flex-1">
        <section className="container mx-auto flex min-h-[70vh] px-4 py-20 md:min-h-[calc(100vh-8rem)] md:py-28">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-center">
            <div className="w-full px-6 py-10 text-center sm:px-10 sm:py-14 md:px-14 md:py-16">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">HZZ potpora</p>
              <h1 className="mt-4 text-3xl font-semibold text-foreground md:text-5xl">
                Pripremite HZZ zahtjev uz AI
              </h1>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                Odgovorite na nekoliko kratkih pitanja, a AI priprema nacrt poslovnog plana i troškovnika za Vaš
                zahtjev za sredstva za samozapošljavanje HZZ-a.
              </p>
              <Link
                href="https://mjere.hzz.hr/mjere/potpore-za-samozaposljavanje-2026/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full border border-sky-100 bg-sky-50/80 px-4 py-2 text-sm text-sky-700 transition-colors hover:bg-sky-100/80"
              >
                Pogledajte službene uvjete HZZ 2026
              </Link>

              <div className="mt-10 flex flex-col items-center gap-4">
                <Link href="/primjer" className="w-full sm:w-auto">
                  <Button
                    size="default"
                    className="h-11 w-full border border-amber-200 bg-amber-100 px-8 text-base text-amber-700 shadow-sm hover:bg-amber-200 sm:w-auto"
                  >
                    Kreiraj Primjer Zahtjeva
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  Primjer za 3 minute, bez registracije.
                </p>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Izvoz PDF/DOCX, trajno spremanje i napredni AI uz registraciju.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

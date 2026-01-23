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
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">HZZ zahtjev</p>
            <h1 className="mt-4 text-3xl md:text-5xl font-semibold text-foreground">
              Najjednostavniji način za izradu HZZ zahtjeva
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              Odgovorite na par pitanja, a AI sastavlja nacrt poslovnog plana i troškovnika.
              <br />
              Kliknite i odmah kreirajte primjer zahtjeva.
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
                Izrada primjera upitnika i gotovog zahtjeva za 3 minute, bez registracije.
              </p>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Preuzimanje PDF/DOCX i trajno spremanje dostupni su samo uz registraciju, uz bolji AI model i rezultate.
            </p>
          </div>

        </section>
      </main>

      <Footer />
    </div>
  )
}

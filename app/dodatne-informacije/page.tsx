import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { createServerClient } from '@/lib/supabase/server'
import fs from 'fs/promises'
import path from 'path'

const loadHelpfulLinks = async () => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'useful_links.md')
    const content = await fs.readFile(filePath, 'utf8')

    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.replace(/^- /, '').trim())
      .filter((line) => line.length > 0)
  } catch (error) {
    console.warn('[AdditionalInfoPage] Unable to load helpful links:', error)
    return []
  }
}

export default async function AdditionalInfoPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const helpfulLinks = await loadHelpfulLinks()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header user={user} showAuth={true} />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Informacije</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
              Što je HZZ Zahtjev Creator i kako pomaže?
            </h1>
            <p className="text-base text-muted-foreground mt-4 leading-relaxed">
              Ovo je AI alat za brzu izradu HZZ zahtjeva. Ispunite kratki upitnik, a AI generira poslovni plan
              u skladu s HZZ pravilima. Vi zatim pregledate i doradite sadržaj prije predaje.
            </p>

            <div className="mt-10 space-y-6 text-sm text-muted-foreground leading-relaxed">
              <div>
                <h2 className="text-base font-semibold text-foreground">Kako aplikacija radi</h2>
                <ol className="mt-3 list-decimal pl-4 space-y-2">
                  <li>Ispunite upitnik s ključnim informacijama o ideji i potpori.</li>
                  <li>AI generira sekcije 2–5 uz troškovnik i opis poslovanja.</li>
                  <li>Po potrebi uredite i izvezite PDF/DOCX.</li>
                </ol>
              </div>

              <div>
                <h2 className="text-base font-semibold text-foreground">Lokalni nacrt</h2>
                <p className="mt-2">
                  Bez registracije možete napraviti brzi nacrt koji se sprema samo u vašem pregledniku.
                </p>
                <p className="mt-2">
                  Preuzimanje PDF/DOCX dostupno je samo uz račun.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-foreground">Uz račun</h2>
                <p className="mt-2">
                  Registrirani korisnici imaju detaljniji AI, trajno spremanje i potpuni pregled dokumenata.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Kreiraj račun i kreni
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Prijavi se
                </Button>
              </Link>
            </div>

            <div className="mt-8 border-t pt-6">
              <Link href="/">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Generiraj lokalni test zahtjev
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-3">
                Lokalni test koristi slabiji AI i ne sprema zahtjev. Podaci ostaju samo u vašem pregledniku.
              </p>
            </div>

            <div className="mt-12">
              <h2 className="text-base font-semibold text-foreground">Korisne poveznice</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {helpfulLinks.length > 0 ? (
                  helpfulLinks.map((link) => (
                    <li key={link}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:underline break-all"
                      >
                        {link}
                      </a>
                    </li>
                  ))
                ) : (
                  <li>Trenutno nema dostupnih poveznica.</li>
                )}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

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
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Informacije</p>

            <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Najbrži put do HZZ zahtjeva uz AI
                </h1>
                <p className="text-base text-muted-foreground mt-4 leading-relaxed">
                  Ispunite kratki upitnik i dobijte strukturirani nacrt zahtjeva koji možete odmah pregledati,
                  doraditi i pripremiti za predaju.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link href="/primjer">
                    <Button size="lg" className="w-full sm:w-auto shadow-lg">
                      Primjer zahtjev
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Kreiraj račun
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Primjer radi lokalno u pregledniku i ne sprema podatke. Za trajno spremanje potreban je račun.
                </p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-6">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Što dobivate
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li>AI izrađuje sekcije 2–5 i troškovnik u skladu s HZZ pravilima.</li>
                  <li>Možete uređivati, spremati i izvoziti PDF/DOCX.</li>
                  <li>Brzi lokalni nacrt bez registracije.</li>
                </ul>
                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                  <Link href="/auth/login">
                    <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                      Prijavi se
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="w-full sm:w-auto">
                      Registriraj se
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3 text-sm text-muted-foreground leading-relaxed">
              <div className="rounded-xl border bg-white p-5">
                <h2 className="text-base font-semibold text-foreground">Kako radi</h2>
                <ol className="mt-3 list-decimal pl-4 space-y-2">
                  <li>Unesite osnovne informacije o ideji i potpori.</li>
                  <li>AI generira poslovni plan i troškovnik.</li>
                  <li>Pregledajte i doradite prije predaje.</li>
                </ol>
              </div>
              <div className="rounded-xl border bg-white p-5">
                <h2 className="text-base font-semibold text-foreground">Lokalni nacrt</h2>
                <p className="mt-2">
                  Brzi primjer radi bez registracije i sprema se samo u vaš preglednik.
                </p>
                <p className="mt-2">
                  PDF/DOCX izvoz dostupan je nakon registracije.
                </p>
              </div>
              <div className="rounded-xl border bg-white p-5">
                <h2 className="text-base font-semibold text-foreground">Uz račun</h2>
                <p className="mt-2">
                  Detaljniji AI, trajno spremanje, nadzor dokumentacije i spremni izvozi.
                </p>
              </div>
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

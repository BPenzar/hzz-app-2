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
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
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
                  size="lg"
                  className="w-full sm:w-auto px-10 py-6 text-base md:text-lg shadow-lg bg-amber-500 text-white hover:bg-amber-600"
                >
                  Kreiraj Primjer Zahtjeva
                </Button>
              </Link>
              <Link href="/auth/signup" className="text-sm text-muted-foreground hover:text-foreground">
                Kreiraj račun za trajno spremanje
              </Link>
            </div>

            <div className="mt-8 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Bez registracije • Sekcije 2–5 + troškovnik • PDF/DOCX uz račun
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Preuzimanje PDF/DOCX i trajno spremanje dostupni su samo uz registraciju, uz bolji AI model i rezultate.
            </p>
          </div>

          <div className="max-w-3xl mx-auto mt-14">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Korisne poveznice
            </h2>
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
        </section>
      </main>

      <Footer />
    </div>
  )
}

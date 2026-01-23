import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
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

      <main className="flex-1 bg-gradient-to-b from-slate-50 via-white to-white">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dodatne informacije</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
              Sažet pregled kako aplikacija pomaže
            </h1>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              Ovdje su kratke informacije o načinu rada, razlikama između lokalnog nacrta i računa,
              te službene poveznice.
            </p>

            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-foreground">Što dobivate s računom</h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                    Spremanje i povratak na sve verzije zahtjeva
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                    Detaljniji AI nacrt poslovnog plana
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                    Uređivanje svih sekcija i izvoz u PDF/DOCX
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border bg-slate-900 text-white p-6 shadow-sm">
                <h2 className="text-base font-semibold">Lokalni nacrt</h2>
                <p className="text-sm text-slate-200 mt-3 leading-relaxed">
                  Možete izraditi brzi nacrt bez registracije. Podaci ostaju samo u vašem pregledniku.
                </p>
                <p className="text-xs text-slate-300 mt-3">
                  Registracijom ga možete spremiti i dodatno urediti.
                </p>
              </div>
            </div>

            <div className="mt-10 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)] gap-6 items-start">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-foreground">Kako aplikacija radi</h2>
                <ol className="mt-4 space-y-3 text-sm text-muted-foreground list-decimal pl-4">
                  <li>Ispunite upitnik s ključnim podacima.</li>
                  <li>AI generira nacrt sekcija 2–5 prema HZZ pravilima.</li>
                  <li>Uredite i preuzmite PDF/DOCX (uz račun).</li>
                </ol>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-6 shadow-sm">
                <h2 className="text-base font-semibold text-foreground">Korisne poveznice</h2>
                <ul className="mt-4 space-y-3 text-sm">
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
                    <li className="text-muted-foreground">Trenutno nema dostupnih poveznica.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { GuestWizardForm } from '@/components/wizard/GuestWizardForm'

interface GuestLandingProps {
  helpfulLinks: string[]
}

interface IntakeData {
  ime: string
  prezime: string
  oib: string
  kontakt_email: string
  kontakt_tel: string
  cv_text?: string
  radno_iskustvo?: string
  poslovna_ideja: string
  vrsta_djelatnosti: string
  vrsta_subjekta: string
  lokacija: string
  iznos_trazene_potpore: string
  dodatne_informacije?: string
  [key: string]: string | undefined
}

const LOCAL_INTAKE_KEY = 'hzz-guest-intake-v1'
const LOCAL_DRAFT_KEY = 'hzz-guest-draft-v1'
const LOCAL_GENERATED_AT_KEY = 'hzz-guest-generated-at-v1'

const defaultIntakeData: IntakeData = {
  ime: '',
  prezime: '',
  oib: '',
  kontakt_email: '',
  kontakt_tel: '',
  poslovna_ideja: '',
  vrsta_djelatnosti: '',
  vrsta_subjekta: '',
  lokacija: '',
  iznos_trazene_potpore: '',
  radno_iskustvo: '',
  dodatne_informacije: '',
}

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function GuestLanding({ helpfulLinks }: GuestLandingProps) {
  const { toast } = useToast()
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [formData, setFormData] = useState<IntakeData>(defaultIntakeData)
  const [generatedData, setGeneratedData] = useState<Record<string, any> | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedIntake = safeParse<IntakeData>(localStorage.getItem(LOCAL_INTAKE_KEY), defaultIntakeData)
    const storedGenerated = safeParse<Record<string, any> | null>(
      localStorage.getItem(LOCAL_DRAFT_KEY),
      null
    )
    const storedGeneratedAt = localStorage.getItem(LOCAL_GENERATED_AT_KEY)

    setFormData(storedIntake)
    setGeneratedData(storedGenerated)
    setGeneratedAt(storedGeneratedAt)
    setShowEditor(Boolean(storedGenerated))
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    const timer = setTimeout(() => {
      localStorage.setItem(LOCAL_INTAKE_KEY, JSON.stringify(formData))
    }, 600)
    return () => clearTimeout(timer)
  }, [formData, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    if (generatedData) {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(generatedData))
    } else {
      localStorage.removeItem(LOCAL_DRAFT_KEY)
    }
  }, [generatedData, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    if (generatedAt) {
      localStorage.setItem(LOCAL_GENERATED_AT_KEY, generatedAt)
    } else {
      localStorage.removeItem(LOCAL_GENERATED_AT_KEY)
    }
  }, [generatedAt, isHydrated])

  const handleChange = (field: keyof IntakeData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetLocalDraft = () => {
    setGeneratedData(null)
    setGeneratedAt(null)
    setShowEditor(false)
    localStorage.removeItem(LOCAL_DRAFT_KEY)
    localStorage.removeItem(LOCAL_GENERATED_AT_KEY)
  }

  const handleSubmit = async () => {
    if (!formData.ime || !formData.prezime) {
      toast({
        title: 'Nedostaju osnovni podaci',
        description: 'Molimo unesite ime i prezime.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.poslovna_ideja) {
      toast({
        title: 'Nedostaje poslovna ideja',
        description: 'Molimo opišite vašu poslovnu ideju.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate/from-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: 'guest-local',
          intakeData: formData,
          mode: 'fast',
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        const errorMessage =
          result?.error || 'Generiranje nije uspjelo. Pokušajte ponovno.'
        const issues = Array.isArray(result?.issues) ? result.issues : []
        const fullMessage =
          issues.length > 0 ? `${errorMessage} (${issues.join(' | ')})` : errorMessage
        throw new Error(fullMessage)
      }

      setGeneratedData(result.data)
      const generatedTimestamp = new Date().toISOString()
      setGeneratedAt(generatedTimestamp)
      setShowEditor(true)

      toast({
        title: 'Nacrt je spreman!',
        description:
          'Nacrt je spremljen lokalno u vašem pregledniku. Registracijom ga možete trajno spremiti i urediti.',
      })

      requestAnimationFrame(() => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (error) {
      toast({
        title: 'Greška pri generiranju',
        description:
          error instanceof Error && error.message
            ? error.message
            : 'Došlo je do greške. Pokušajte ponovno.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      {generatedData && showEditor && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-screen bg-gray-50">
              <div className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
                <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lokalni nacrt</p>
                    <h3 className="text-lg font-semibold text-foreground">
                      Uređivanje lokalnog zahtjeva
                    </h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href="/auth/signup">
                      <Button size="sm">
                        Spremi uz račun
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => setShowEditor(false)}>
                      Natrag na landing
                    </Button>
                  </div>
                </div>
              </div>
              <div ref={editorRef} className="container mx-auto px-4 py-6">
                <GuestWizardForm
                  key={generatedAt ?? 'draft'}
                  initialData={generatedData}
                  generatedAt={generatedAt}
                  storageKey={LOCAL_DRAFT_KEY}
                  onClearDraft={resetLocalDraft}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-10 items-start">
            <div className="order-2 lg:order-1 space-y-6">
              <div className="rounded-3xl border bg-white/70 p-6 shadow-md backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">HZZ Zahtjev Creator</p>
                <h2 className="text-2xl md:text-3xl font-semibold mt-3 text-foreground leading-tight">
                  Izradite potpuni HZZ zahtjev, spremite ga i izvezite u PDF/DOCX uz napredni AI
                </h2>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  Registracijom dobivate sigurnu pohranu, detaljniji model i mogućnost uređivanja svih sekcija prije
                  predaje.
                </p>
                <div className="flex flex-col gap-3 mt-6">
                  <Link href="/auth/signup">
                    <Button size="lg" className="w-full justify-center text-base">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Kreiraj račun i izradi puni zahtjev
                    </Button>
                  </Link>
                  <Link href="/auth/login" className="text-sm font-medium text-foreground hover:underline">
                    Već imate račun? Prijavite se
                  </Link>
                </div>
                {generatedData && !showEditor && (
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowEditor(true)}>
                      Nastavi lokalni nacrt
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2 flex justify-center">
              <Card className="w-full max-w-2xl p-6 md:p-8 shadow-xl flex flex-col max-h-[85vh] md:max-h-[80vh]">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Objašnjenje: HZZ Zahtjev Creator
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-2">
                    Izradite potpuni HZZ zahtjev, spremite ga i izvezite u PDF/DOCX uz napredni AI
                  </h1>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    Ovaj nacrt se sprema samo u vašem pregledniku. Za trajno spremanje, uređivanje i jači model
                    potrebna je registracija.
                  </p>
                </div>
                <div className="inline-flex items-center rounded-full bg-foreground text-background px-3 py-1 text-xs font-semibold">
                  Lokalno
                </div>
              </div>

              <form
                className="mt-6 flex flex-col flex-1 min-h-0"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleSubmit()
                }}
              >
                <div className="space-y-6 overflow-y-auto pr-2 flex-1 min-h-0">
                  <div className="border-b pb-6">
                    <h2 className="text-base font-semibold mb-4">1. Osnovni podaci *</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ime">Ime *</Label>
                        <Input
                          id="ime"
                          value={formData.ime}
                          onChange={(e) => handleChange('ime', e.target.value)}
                          placeholder="Vaše ime"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prezime">Prezime *</Label>
                        <Input
                          id="prezime"
                          value={formData.prezime}
                          onChange={(e) => handleChange('prezime', e.target.value)}
                          placeholder="Vaše prezime"
                        />
                      </div>
                      <div>
                        <Label htmlFor="oib">OIB</Label>
                        <Input
                          id="oib"
                          value={formData.oib}
                          onChange={(e) => handleChange('oib', e.target.value)}
                          placeholder="12345678901"
                        />
                      </div>
                      <div>
                        <Label htmlFor="kontakt_email">Email</Label>
                        <Input
                          id="kontakt_email"
                          type="email"
                          value={formData.kontakt_email}
                          onChange={(e) => handleChange('kontakt_email', e.target.value)}
                          placeholder="vas@email.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="kontakt_tel">Telefon</Label>
                        <Input
                          id="kontakt_tel"
                          value={formData.kontakt_tel}
                          onChange={(e) => handleChange('kontakt_tel', e.target.value)}
                          placeholder="+385 91 234 5678"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h2 className="text-base font-semibold mb-4">2. Vaša poslovna ideja *</h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="poslovna_ideja">Opišite vašu poslovnu ideju</Label>
                        <Textarea
                          id="poslovna_ideja"
                          value={formData.poslovna_ideja}
                          onChange={(e) => handleChange('poslovna_ideja', e.target.value)}
                          placeholder="Opišite što želite raditi, koje proizvode/usluge nuditi, tko su vaši klijenti..."
                          rows={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vrsta_djelatnosti">Vrsta djelatnosti</Label>
                        <Input
                          id="vrsta_djelatnosti"
                          value={formData.vrsta_djelatnosti}
                          onChange={(e) => handleChange('vrsta_djelatnosti', e.target.value)}
                          placeholder="Npr: IT usluge, vodoinstalater, frizerski salon..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h2 className="text-base font-semibold mb-4">3. Radno iskustvo i kompetencije</h2>
                    <div>
                      <Label htmlFor="radno_iskustvo">Opišite vaše radno iskustvo i obrazovanje</Label>
                      <Textarea
                        id="radno_iskustvo"
                        value={formData.radno_iskustvo || ''}
                        onChange={(e) => handleChange('radno_iskustvo', e.target.value)}
                        placeholder="Npr: 5 godina iskustva u IT industriji, diplomirani inženjer računarstva..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h2 className="text-base font-semibold mb-4">4. Osnovni podaci o poslovanju</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vrsta_subjekta">Vrsta poslovnog subjekta</Label>
                        <select
                          id="vrsta_subjekta"
                          value={formData.vrsta_subjekta}
                          onChange={(e) => handleChange('vrsta_subjekta', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="">Odaberite...</option>
                          <option value="doo">d.o.o./j.d.o.o.</option>
                          <option value="obrt_pausalni">obrt s paušalnim oporezivanjem</option>
                          <option value="obrt_knjige">obrt – poslovne knjige</option>
                          <option value="samostalna">samostalna djelatnost</option>
                          <option value="ostalo">ostalo</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="lokacija">Lokacija poslovanja</Label>
                        <Input
                          id="lokacija"
                          value={formData.lokacija}
                          onChange={(e) => handleChange('lokacija', e.target.value)}
                          placeholder="Zagreb, Split, Rijeka..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h2 className="text-base font-semibold mb-4">5. Financijska potpora</h2>
                    <div>
                      <Label htmlFor="iznos_trazene_potpore">Iznos tražene potpore (EUR)</Label>
                      <Input
                        id="iznos_trazene_potpore"
                        type="number"
                        value={formData.iznos_trazene_potpore}
                        onChange={(e) => handleChange('iznos_trazene_potpore', e.target.value)}
                        placeholder="10000"
                      />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-semibold mb-4">6. Dodatne informacije (opcionalno)</h2>
                    <div>
                      <Label htmlFor="dodatne_informacije">
                        Sve ostale informacije koje smatrate važnima
                      </Label>
                      <Textarea
                        id="dodatne_informacije"
                        value={formData.dodatne_informacije || ''}
                        onChange={(e) => handleChange('dodatne_informacije', e.target.value)}
                        placeholder="Npr. ciljna tržišta, planirana oprema, zeleni/digitalni elementi..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t bg-white/95 backdrop-blur">
                  <Button type="submit" disabled={isGenerating} size="lg" className="w-full">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Generiram lokalni zahtjev...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generiraj lokalni Zahtjev
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    Brzi model daje kraći nacrt i sprema ga lokalno u pregledniku. Za napredni AI i spremanje koristi
                    registraciju.
                  </p>
                </div>
              </form>
            </Card>
            </div>
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <Card className="p-6 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Što dobivate s računom</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                  Spremanje svih verzija zahtjeva i povratak gdje ste stali
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                  Napredni AI za detaljniji poslovni plan i bolje usklađenje s HZZ pravilima
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                  Uređivanje svih sekcija i izvoz u PDF/DOCX
                </li>
              </ul>
            </Card>
            <Card className="p-6 shadow-sm bg-slate-900 text-white border-slate-900">
              <h3 className="text-base font-semibold">Lokalni nacrt</h3>
              <p className="text-sm text-slate-200 mt-3 leading-relaxed">
                Bez registracije možete izraditi brzi nacrt. Podaci ostaju samo u ovom pregledniku i brišu se ako
                očistite lokalnu pohranu.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                <ArrowRight className="h-4 w-4" />
                <span>Registracijom ga možete spremiti i dodatno urediti.</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)] gap-10 items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Kako aplikacija radi</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-3 text-foreground">Kako aplikacija radi</h2>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                HZZ Zahtjev Creator vodi vas kroz strukturiranu formu i koristi AI kako bi izradio nacrt poslovnog
                plana prema HZZ pravilima. Vi dopunjavate osobne podatke i finalno uređujete sve dijelove prije
                predaje.
              </p>
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Upitnik</p>
                    <p>Ispunite ključne podatke o ideji, iskustvu i potrebnoj potpori.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">AI nacrt</p>
                    <p>AI generira sekcije 2–5 uz usklađenost s HZZ pravilima i troškovnikom.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Uređivanje i izvoz</p>
                    <p>Uz račun možete uređivati sve sekcije i preuzeti PDF/DOCX verziju.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border bg-slate-50 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Korisne poveznice</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Službene HZZ stranice i uvjeti korištenja mjera:
              </p>
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
    </>
  )
}

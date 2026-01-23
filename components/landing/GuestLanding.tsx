'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Sparkles } from 'lucide-react'
import { GuestWizardForm } from '@/components/wizard/GuestWizardForm'

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

export function GuestLanding() {
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
                    <h3 className="text-lg font-semibold text-foreground">Primjer: Lokalni zahtjev</h3>
                  </div>
                </div>
              </div>
              <div ref={editorRef} className="container mx-auto px-4 py-6">
                <GuestWizardForm
                  key={generatedAt ?? 'draft'}
                  initialData={generatedData}
                  generatedAt={generatedAt}
                  storageKey={LOCAL_DRAFT_KEY}
                  onExit={() => {
                    resetLocalDraft()
                    setShowEditor(false)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">HZZ Zahtjev Creator</p>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-2">
                  Izradite HZZ zahtjev i preuzmite ga u PDF/DOCX uz AI
                </h1>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Nacrt se sprema samo u vašem pregledniku. Za trajno spremanje i napredni model potrebna je
                  registracija.
                </p>
              </div>
              <div className="inline-flex items-center rounded-full bg-foreground text-background px-3 py-1 text-xs font-semibold">
                Lokalno
              </div>
            </div>

            <form
              className="mt-8 flex flex-col min-h-[70vh] w-full"
              onSubmit={(event) => {
                event.preventDefault()
                handleSubmit()
              }}
            >
              <div className="space-y-6 flex-1">
                <div className="border-b pb-6">
                  <h2 className="text-base font-semibold mb-4">1. Vaša poslovna ideja *</h2>
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
                  <h2 className="text-base font-semibold mb-4">2. Radno iskustvo i kompetencije</h2>
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
                  <h2 className="text-base font-semibold mb-4">3. Osnovni podaci o poslovanju</h2>
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
                  <h2 className="text-base font-semibold mb-4">4. Financijska potpora</h2>
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
                  <h2 className="text-base font-semibold mb-4">5. Dodatne informacije (opcionalno)</h2>
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

              <div className="sticky bottom-0 pt-4 pb-2 bg-white">
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
          </div>
        </div>
      </section>
    </>
  )
}

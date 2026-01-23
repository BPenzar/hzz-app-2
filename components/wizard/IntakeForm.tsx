'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { Database, Json } from '@/types/supabase'

interface IntakeFormProps {
  applicationId: string
  onGenerate: (intakeData: IntakeData) => Promise<void>
}

export interface IntakeData {
  // Basic personal info
  ime: string
  prezime: string
  oib: string
  kontakt_email: string
  kontakt_tel: string

  // CV/Experience (uploaded or text)
  cv_text?: string
  radno_iskustvo?: string

  // Business idea
  poslovna_ideja: string
  vrsta_djelatnosti: string

  // Basic business info
  vrsta_subjekta: string // obrt, d.o.o., j.d.o.o.
  lokacija: string

  // Financial
  iznos_trazene_potpore: string

  // Additional context
  dodatne_informacije?: string

  [key: string]: string | undefined
}

const isIntakeData = (value: Json): value is IntakeData => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.ime === 'string' &&
    typeof record.prezime === 'string' &&
    typeof record.poslovna_ideja === 'string' &&
    typeof record.vrsta_djelatnosti === 'string' &&
    typeof record.vrsta_subjekta === 'string' &&
    typeof record.lokacija === 'string' &&
    typeof record.iznos_trazene_potpore === 'string'
  )
}

export function IntakeForm({ applicationId, onGenerate }: IntakeFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<IntakeData>({
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
  })

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      const supabase = createClient()

      // First, try to load from saved intake section
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .select('data_json')
        .eq('app_id', applicationId)
        .eq('code', 'intake')
        .single()

      // If we have saved intake data, use it (this is the priority!)
      if (sectionData?.data_json && !sectionError && isIntakeData(sectionData.data_json)) {
        console.log('Loading saved intake data:', sectionData.data_json)
        setFormData(sectionData.data_json)
      }
    }

    loadSavedData()
  }, [applicationId])

  // Autosave with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (Object.values(formData).some((val) => val !== '')) {
        console.log('Autosaving intake data:', formData)
        setIsSaving(true)
        const supabase = createClient()

        const payload: Database['public']['Tables']['sections']['Insert'] = {
          app_id: applicationId,
          code: 'intake',
          data_json: formData as unknown as Json,
          status: 'draft',
        }

        const { error } = await supabase
          .from('sections')
          .upsert(
            payload,
            {
              onConflict: 'app_id,code'
            }
          )

        if (error) {
          console.error('Autosave error:', error)
        } else {
          console.log('Autosaved successfully')
        }

        setIsSaving(false)
      }
    }, 1500) // Save after 1.5 seconds of inactivity

    return () => clearTimeout(timer)
  }, [formData, applicationId])

  const handleChange = (field: keyof IntakeData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleManualSave = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      console.log('Manual save - saving data:', formData)

      const payload: Database['public']['Tables']['sections']['Insert'] = {
        app_id: applicationId,
        code: 'intake',
        data_json: formData as unknown as Json,
        status: 'draft',
      }

      const { error } = await supabase
        .from('sections')
        .upsert(
          payload,
          {
            onConflict: 'app_id,code'
          }
        )

      if (error) {
        console.error('Manual save error:', error)
        throw error
      }

      console.log('Manual save successful')

      toast({
        title: 'Spremljeno',
        description: 'Vaši podaci su uspješno spremljeni.',
      })
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: 'Greška',
        description: 'Nije moguće spremiti podatke.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.poslovna_ideja) {
      toast({
        title: 'Nedostaje poslovna ideja',
        description: 'Molimo opišite vašu poslovnu ideju',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      // Generate the application
      await onGenerate(formData)
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
    <div className="min-h-screen bg-gray-50 py-8 flex flex-col">
      <div className="container mx-auto px-4 max-w-3xl flex-1 flex flex-col">
        {/* Header with buttons - outside card */}
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Brzi upitnik za HZZ zahtjev</h1>
              <p className="text-gray-600 mt-1">
                Odgovorite na nekoliko osnovnih pitanja, a AI će prema HZZ pravilima iz 2026. izraditi nacrt sekcija 2–5. Prije izvoza obavezno pregledajte i uredite sadržaj.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isSaving && <span className="text-sm text-gray-500">Spremanje...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Spremi
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Natrag
              </Button>
            </div>
          </div>
        </div>

        <Card className="p-8 overflow-y-auto flex-1 mb-6" style={{ maxHeight: 'calc(100vh - 380px)' }}>

          <div className="space-y-6">
            {/* Business Idea */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">1. Vaša poslovna ideja *</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="poslovna_ideja">Opišite vašu poslovnu ideju</Label>
                  <Textarea
                    id="poslovna_ideja"
                    value={formData.poslovna_ideja}
                    onChange={(e) => handleChange('poslovna_ideja', e.target.value)}
                    placeholder="Opišite što želite raditi, koje proizvode/usluge nuditi, tko su vaši klijenti..."
                    rows={6}
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

            {/* CV / Experience */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">2. Radno iskustvo i kompetencije</h2>
              <div className="space-y-4">
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
            </div>

            {/* Business Structure */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">3. Osnovni podaci o poslovanju</h2>
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

            {/* Financial */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">4. Financijska potpora</h2>
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

            {/* Additional Info */}
            <div>
              <h2 className="text-lg font-semibold mb-4">5. Dodatne informacije (opcionalno)</h2>
              <div>
                <Label htmlFor="dodatne_informacije">
                  Sve ostale informacije koje smatrate važnima
                </Label>
                  <Textarea
                    id="dodatne_informacije"
                    value={formData.dodatne_informacije || ''}
                    onChange={(e) => handleChange('dodatne_informacije', e.target.value)}
                    placeholder="Npr. ciljna tržišta, planirana oprema, zeleni/digitalni elementi, postojeći kontakti ili predračuni..."
                    rows={4}
                  />
                </div>
            </div>
          </div>

        </Card>

        {/* Generate Button - outside card, fixed at bottom */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4">
          <Button onClick={handleSubmit} disabled={isGenerating} size="lg" className="w-full md:w-auto">
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generiram zahtjev...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generiraj potpuni zahtjev s AI
              </>
            )}
          </Button>
          {isGenerating ? (
            <p className="text-sm text-gray-500 text-center animate-pulse">
              AI generira vaš zahtjev... Ovo može potrajati 1-3 minute.
            </p>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              Nakon generiranja pregledajte i uredite sve sekcije prije izvoza u PDF/DOCX
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

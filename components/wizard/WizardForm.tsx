'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WizardSection } from './WizardSection'
import { PreviewPanel } from './PreviewPanel'
import { useToast } from '@/hooks/use-toast'
import hzzStructure from '@/data/hzz-structure.json'
import { ChevronLeft, ChevronRight, FileDown, PanelRightOpen, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface WizardFormProps {
  applicationId: string
  initialData?: Record<string, any>
}

interface Section {
  id: string
  key: string
  title: string
  fields: any[]
}

interface SectionHierarchy {
  parentKey: string
  parentTitle: string
  subsections: Section[]
}

export function WizardForm({ applicationId, initialData = {} }: WizardFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentSection, setCurrentSection] = useState('1')
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const sections = hzzStructure.sections

  // Build hierarchical structure
  const sectionHierarchy: (Section | SectionHierarchy)[] = []
  const processedSections = new Set<string>()

  sections.forEach((section) => {
    const sectionId = section.id

    // Check if this is a subsection (contains a dot)
    if (sectionId.includes('.')) {
      const parentId = sectionId.split('.')[0]

      // Skip if parent already processed
      if (processedSections.has(parentId)) return

      // Find all subsections with this parent
      const subsections = sections.filter(s =>
        s.id.startsWith(parentId + '.') && s.id !== parentId
      )

      if (subsections.length > 0) {
        // Find parent section if it exists
        const parentSection = sections.find(s => s.id === parentId)

        sectionHierarchy.push({
          parentKey: parentId,
          parentTitle: parentSection ? parentSection.title : `Sekcija ${parentId}`,
          subsections: subsections
        })

        processedSections.add(parentId)
        subsections.forEach(s => processedSections.add(s.id))
      }
    } else if (!processedSections.has(sectionId)) {
      // This is a standalone section
      sectionHierarchy.push(section as Section)
      processedSections.add(sectionId)
    }
  })

  // Autosave debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        handleSave()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [formData])

  // Scroll to top when section changes
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 50)
  }, [currentSection])

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()

    // Save to sections table
    for (const section of sections) {
      const sectionData = formData[section.key] || {}

      await supabase
        .from('sections')
        .upsert({
          app_id: applicationId,
          code: section.key,
          data_json: sectionData,
          status: 'draft',
        } as any)
        .match({ app_id: applicationId, code: section.key })
    }

    setIsSaving(false)
  }

  const handleFieldChange = (sectionKey: string, fieldKey: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: value,
      },
    }))
  }

  const handleNext = () => {
    const currentIndex = sections.findIndex(s => s.key === currentSection)
    if (currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1].key)
    }
  }

  const handlePrevious = () => {
    const currentIndex = sections.findIndex(s => s.key === currentSection)
    if (currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1].key)
    }
  }

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true)

    // Get the preview element
    const previewElement = document.getElementById('pdf-preview-content')

    if (!previewElement) {
      toast({
        title: 'Greška',
        description: 'Molimo prvo otvorite pregled.',
        variant: 'destructive',
      })
      setIsGeneratingPDF(false)
      return
    }

    try {
      // Dynamically import html2pdf only on client side
      const html2pdf = (await import('html2pdf.js')).default

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `HZZ-Zahtjev-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      }

      await html2pdf().set(opt).from(previewElement).save()

      toast({
        title: 'PDF izvezen!',
        description: 'Vaš zahtjev je spremljen kao PDF dokument.',
      })
    } catch (error) {
      console.error('PDF generation error:', error)
      toast({
        title: 'Greška',
        description: 'Nije moguće generirati PDF.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const currentSectionData = sections.find(s => s.key === currentSection)
  const currentIndex = sections.findIndex(s => s.key === currentSection)

  // Determine which parent section the current section belongs to
  const getCurrentParentInfo = () => {
    if (!currentSectionData) return null

    const sectionId = currentSectionData.id
    if (sectionId.includes('.')) {
      const parentId = sectionId.split('.')[0]
      const parentSection = sections.find(s => s.id === parentId)
      return {
        parentId,
        parentTitle: parentSection ? parentSection.title : `Sekcija ${parentId}`
      }
    }
    return null
  }

  const parentInfo = getCurrentParentInfo()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {currentSectionData?.id}. {currentSectionData?.title}
              </h1>
              {parentInfo && (
                <p className="text-sm text-gray-600">
                  {parentInfo.parentTitle}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isSaving && <span className="text-sm text-gray-600">Spremanje...</span>}
              <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <SheetTrigger asChild>
                  <Button variant="default">
                    <PanelRightOpen className="h-4 w-4 mr-2" />
                    Pregled i PDF
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-full p-0 overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b z-10 px-8 py-4">
                    <div className="flex items-center justify-between">
                      <SheetHeader>
                        <SheetTitle>Pregled zahtjeva</SheetTitle>
                        <SheetDescription>
                          Pregledajte sve unesene podatke prije preuzimanja PDF-a
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleExportPDF}
                          disabled={isGeneratingPDF}
                          variant="default"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          {isGeneratingPDF ? 'Generiram PDF...' : 'Preuzmi PDF'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsPreviewOpen(false)}
                        >
                          Natrag
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <PreviewPanel data={formData} sections={sections} />
                  </div>
                </SheetContent>
              </Sheet>
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Natrag
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className="bg-white border-b sticky top-[73px] z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 py-3 overflow-x-auto">
            {sectionHierarchy.map((item, idx) => {
              if ('subsections' in item) {
                // This is a parent with subsections
                const isActive = currentSectionData?.id.startsWith(item.parentKey + '.')

                return (
                  <div key={item.parentKey} className="flex items-center gap-2">
                    {isActive ? (
                      // Show subsections when active
                      <div className="flex gap-1">
                        {item.subsections.map((subsection) => (
                          <Button
                            key={subsection.key}
                            variant={currentSection === subsection.key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentSection(subsection.key)}
                            className="min-w-[50px] h-9 font-semibold rounded-md text-sm"
                          >
                            {subsection.id}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      // Show parent button when not active
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to first subsection
                          if (item.subsections.length > 0) {
                            setCurrentSection(item.subsections[0].key)
                          }
                        }}
                        className="min-w-[50px] h-9 font-semibold rounded-md text-sm"
                      >
                        {item.parentKey}
                      </Button>
                    )}
                    {idx < sectionHierarchy.length - 1 && (
                      <div className="h-9 w-px bg-gray-300" />
                    )}
                  </div>
                )
              } else {
                // This is a standalone section
                const section = item as Section
                return (
                  <div key={section.key} className="flex items-center gap-2">
                    <Button
                      variant={currentSection === section.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentSection(section.key)}
                      className="min-w-[50px] h-9 font-semibold rounded-md text-sm"
                    >
                      {section.id}
                    </Button>
                    {idx < sectionHierarchy.length - 1 && (
                      <div className="h-9 w-px bg-gray-300" />
                    )}
                  </div>
                )
              }
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6">
            {currentSectionData && (
              <WizardSection
                section={currentSectionData}
                data={formData[currentSectionData.key] || {}}
                onChange={(fieldKey, value) => handleFieldChange(currentSectionData.key, fieldKey, value)}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t">
              <Button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Prethodno
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentIndex === sections.length - 1}
              >
                Sljedeće
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

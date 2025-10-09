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
import { jsPDF } from 'jspdf'
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

  const handleExportPDF = () => {
    const doc = new jsPDF()
    let yPosition = 20

    // Add title
    doc.setFontSize(18)
    doc.text('HZZ Zahtjev za samozapošljavanje', 105, yPosition, { align: 'center' })
    yPosition += 15

    // Add date
    doc.setFontSize(10)
    doc.text(`Datum: ${new Date().toLocaleDateString('hr-HR')}`, 20, yPosition)
    yPosition += 15

    // Add sections
    sections.forEach((section) => {
      const sectionData = formData[section.key] || {}

      // Section title
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')

      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      doc.text(`${section.id}. ${section.title}`, 20, yPosition)
      yPosition += 10

      // Section fields
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')

      section.fields.forEach((field) => {
        const value = sectionData[field.key] || ''

        if (value) {
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }

          // Field label
          doc.setFont(undefined, 'bold')
          doc.text(`${field.label}:`, 20, yPosition)
          yPosition += 6

          // Field value (handle long text)
          doc.setFont(undefined, 'normal')
          const splitText = doc.splitTextToSize(String(value), 170)
          doc.text(splitText, 20, yPosition)
          yPosition += (splitText.length * 5) + 5
        }
      })

      yPosition += 5 // Space between sections
    })

    // Save the PDF
    doc.save(`HZZ-Zahtjev-${new Date().toISOString().split('T')[0]}.pdf`)

    toast({
      title: 'PDF izvezen!',
      description: 'Vaš zahtjev je spremljen kao PDF dokument.',
    })
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
              <Button onClick={handleExportPDF} variant="default">
                <FileDown className="h-4 w-4 mr-2" />
                Izvezi PDF
              </Button>
              <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <PanelRightOpen className="h-4 w-4 mr-2" />
                    Pregled
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[600px] sm:w-[600px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Pregled zahtjeva</SheetTitle>
                    <SheetDescription>
                      Pregledajte sve unesene podatke
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <PreviewPanel data={formData} />
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
      <div className="bg-white border-b sticky top-[73px] z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto">
            {sectionHierarchy.map((item) => {
              if ('subsections' in item) {
                // This is a parent with subsections
                const isActive = currentSectionData?.id.startsWith(item.parentKey + '.')
                const subsectionKeys = item.subsections.map(s => s.key)

                return (
                  <div key={item.parentKey} className="flex items-center gap-2">
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-gray-500 mb-1">
                        Sekcija {item.parentKey}
                      </span>
                      <div className="flex gap-1">
                        {item.subsections.map((subsection) => (
                          <Button
                            key={subsection.key}
                            variant={currentSection === subsection.key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentSection(subsection.key)}
                            className="h-8 min-w-[40px]"
                          >
                            {subsection.id}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-gray-200 mx-2" />
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
                      className="h-10 min-w-[60px]"
                    >
                      {section.id}
                    </Button>
                    <div className="h-8 w-px bg-gray-200 mx-2" />
                  </div>
                )
              }
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
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

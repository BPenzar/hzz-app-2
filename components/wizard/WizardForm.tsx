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
import type { Database, Json } from '@/types/supabase'
import { ChevronLeft, ChevronRight, FileDown, FileText, PanelRightOpen } from 'lucide-react'
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
  applicationTitle?: string
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

export function WizardForm({ applicationId, applicationTitle, initialData = {} }: WizardFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentSection, setCurrentSection] = useState('1')
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false)

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
        handleAutoSave()
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

  // Silent autosave without toast
  const handleAutoSave = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      // Save to sections table
      for (const section of sections) {
        const sectionData = (formData[section.key] ?? {}) as Json
        const payload: Database['public']['Tables']['sections']['Insert'] = {
          app_id: applicationId,
          code: section.key,
          data_json: sectionData,
          status: 'draft',
        }

        const { error } = await supabase
          .from('sections')
          .upsert(payload, {
            onConflict: 'app_id,code'
          })

        if (error) {
          console.error('Auto-save error for section', section.key, error)
          throw error
        }
      }
    } catch (error) {
      console.error('Auto-save error:', error)
      // No toast for autosave errors to avoid spam
    } finally {
      setIsSaving(false)
    }
  }

  // Manual save with toast feedback
  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      // Save to sections table
      for (const section of sections) {
        const sectionData = (formData[section.key] ?? {}) as Json
        const payload: Database['public']['Tables']['sections']['Insert'] = {
          app_id: applicationId,
          code: section.key,
          data_json: sectionData,
          status: 'draft',
        }

        const { error } = await supabase
          .from('sections')
          .upsert(payload, {
            onConflict: 'app_id,code'
          })

        if (error) {
          console.error('Manual save error for section', section.key, error)
          throw error
        }
      }

      toast({
        title: 'Spremljeno!',
        description: 'Vaše izmjene su uspješno spremljene.',
      })
    } catch (error) {
      console.error('Manual save error:', error)
      toast({
        title: 'Greška',
        description: 'Nije moguće spremiti izmjene.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
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

  const sanitizeFileName = (value: string) => {
    let normalized = value
    try {
      normalized = value.normalize('NFKD')
    } catch {
      normalized = value
    }

    return normalized
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s_-]+/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
  }

  const getFileBaseName = () => {
    const fallback = 'hzz-zahtjev'
    if (!applicationTitle) return fallback

    const cleaned = sanitizeFileName(applicationTitle)
    if (!cleaned) return fallback

    return cleaned
  }

  const ensurePreviewContent = () => {
    const previewElement = document.getElementById('pdf-preview-content')

    if (!previewElement) {
      toast({
        title: 'Greška',
        description: 'Molimo prvo otvorite pregled.',
        variant: 'destructive',
      })
      return null
    }

    return previewElement
  }

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true)

    const previewElement = ensurePreviewContent()
    if (!previewElement) {
      setIsGeneratingPDF(false)
      return
    }

    try {
      const [{ default: html2pdf }] = await Promise.all([
        import('html2pdf.js'),
      ])

      const options = {
        margin: 0.5,
        filename: `${getFileBaseName()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
        },
        jsPDF: {
          unit: 'in' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const,
        },
      }

      await html2pdf().set(options).from(previewElement).save()
    } catch (error) {
      console.error('PDF generation error:', error)
      toast({
        title: 'Greška',
        description:
          error instanceof Error ? error.message : 'Nije moguće kreirati PDF.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleExportDocx = async () => {
    setIsGeneratingDocx(true)

    try {
      // Import the docx library
      const [{ Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell }] = await Promise.all([
        import('docx'),
      ])

      // Create document sections
      const docSections: any[] = []

      // Document title
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: applicationTitle || 'HZZ Zahtjev za dodjelu poticaja',
              bold: true,
              size: 32, // 16pt in half-points
              font: 'Arial'
            })
          ],
          spacing: { after: 300 }
        })
      )

      // Process each section with data
      sections.forEach(section => {
        const sectionData = formData[section.key]
        if (!sectionData || Object.keys(sectionData).length === 0) return

        // Section header
        docSections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${section.id}. ${section.title}`,
                bold: true,
                size: 24, // 12pt
                font: 'Arial'
              })
            ],
            spacing: { before: 240, after: 120 }
          })
        )

        // Process fields in this section
        section.fields?.forEach((field: any) => {
          const fieldValue = sectionData[field.key]
          if (!fieldValue && fieldValue !== 0 && fieldValue !== false) return

          // Skip helper text and section labels
          if (field.type === 'helper_text' || field.type === 'section_label') return

          // Handle different field types
          if (field.type === 'table') {
            // Create table
            const tableData = Array.isArray(fieldValue) ? fieldValue : []
            if (tableData.length > 0) {
              // Add table title
              docSections.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: field.label || field.key,
                      bold: true,
                      size: 22
                    })
                  ],
                  spacing: { before: 120, after: 60 }
                })
              )

              // Create table headers
              const headers = Object.keys(tableData[0] || {})
              const tableRows = [
                new TableRow({
                  children: headers.map(header =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: header.replace(/_/g, ' ').toUpperCase(),
                              bold: true,
                              size: 18
                            })
                          ]
                        })
                      ]
                    })
                  )
                })
              ]

              // Add data rows
              tableData.forEach((row: any) => {
                tableRows.push(
                  new TableRow({
                    children: headers.map(header =>
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: String(row[header] || ''),
                                size: 18
                              })
                            ]
                          })
                        ]
                      })
                    )
                  })
                )
              })

              docSections.push(
                new Table({
                  rows: tableRows,
                  width: { size: 100, type: 'pct' }
                })
              )
            }
          } else {
            // Regular field
            let displayValue = fieldValue
            if (field.type === 'radio' || field.type === 'select') {
              // Get friendly label for radio/select
              const option = field.options?.find((opt: any) => opt.value === fieldValue)
              displayValue = option?.label || fieldValue
            } else if (Array.isArray(fieldValue)) {
              displayValue = fieldValue.join(', ')
            }

            docSections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${field.label} `,
                    bold: true,
                    size: 20
                  }),
                  new TextRun({
                    text: String(displayValue),
                    size: 20
                  })
                ],
                spacing: { after: 60 }
              })
            )
          }
        })
      })

      // Create the document
      const doc = new Document({
        sections: [{
          children: docSections,
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch in twips
                right: 1440,
                bottom: 1440,
                left: 1440
              }
            }
          }
        }]
      })

      // Generate and download
      const blob = await Packer.toBlob(doc)

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${getFileBaseName()}.docx`
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 200)

      toast({
        title: 'Uspješno',
        description: 'DOCX dokument je uspješno stvoren s LibreOffice kompatibilnošću.',
        variant: 'default',
      })
    } catch (error) {
      console.error('DOCX generation error:', error)
      toast({
        title: 'Greška',
        description:
          error instanceof Error ? error.message : 'Nije moguće kreirati DOCX.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingDocx(false)
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

  // Calculate totals for HZZ compliance validation
  const calculateTroskovnikTotal = (): number => {
    const troskovnikData = formData['4']?.troskovnik
    if (!Array.isArray(troskovnikData)) return 0

    return troskovnikData.reduce((sum, row) => {
      const iznos = parseFloat(row.iznos) || 0
      return sum + iznos
    }, 0)
  }

  const getIznosTrazenePotrope = (): number => {
    const section2Data = formData['2']?.iznos_trazene_potpore
    return parseFloat(section2Data) || 0
  }

  const troskovnikTotal = calculateTroskovnikTotal()
  const iznosTrazene = getIznosTrazenePotrope()
  const totalsMatch = Math.abs(troskovnikTotal - iznosTrazene) < 0.01 // Allow for small rounding differences
  const bothAmountsExist = troskovnikTotal > 0 && iznosTrazene > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold truncate">
                {currentSectionData?.id}. {currentSectionData?.title}
              </h1>
              {parentInfo && (
                <p className="text-sm text-gray-600">
                  {parentInfo.parentTitle}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              {isSaving && <span className="text-sm text-gray-600 order-first">Spremanje...</span>}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-sm"
              >
                {isSaving ? 'Spremanje...' : 'Spremi izmjene'}
              </Button>
              <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <SheetTrigger asChild>
                  <Button variant="default" size="sm" className="w-full sm:w-auto text-sm">
                    <PanelRightOpen className="h-4 w-4 mr-2" />
                    Pregled i preuzimanje
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-full p-0 overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b z-10 px-8 py-4">
                    <div className="flex items-center justify-between">
                      <SheetHeader>
                        <SheetTitle>Pregled zahtjeva</SheetTitle>
                        <SheetDescription>
                          Pregledajte sve unesene podatke prije preuzimanja PDF-a ili DOCX-a
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <Button
                            onClick={handleExportPDF}
                            disabled={isGeneratingPDF || isGeneratingDocx}
                            variant="default"
                            className="w-full sm:w-auto"
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            {isGeneratingPDF ? 'Generiram PDF...' : 'Preuzmi PDF'}
                          </Button>
                          <Button
                            onClick={handleExportDocx}
                            disabled={isGeneratingPDF || isGeneratingDocx}
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {isGeneratingDocx ? 'Generiram DOCX...' : 'Preuzmi DOCX'}
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setIsPreviewOpen(false)}
                          className="w-full sm:w-auto mt-2 sm:mt-0"
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
              <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm" className="w-full sm:w-auto text-sm">
                Natrag
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className="bg-white border-b sticky top-[73px] z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 py-3 overflow-x-auto px-2 sm:px-0">
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
                            className="min-w-[50px] h-9 sm:h-9 font-semibold rounded-md text-sm touch-manipulation"
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
                        className="min-w-[50px] h-9 sm:h-9 font-semibold rounded-md text-sm touch-manipulation"
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
                      className="min-w-[50px] h-9 sm:h-9 font-semibold rounded-md text-sm touch-manipulation"
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
                allData={formData}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 pt-6 border-t">
              <Button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                variant="outline"
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Prethodno
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentIndex === sections.length - 1}
                className="w-full sm:w-auto order-1 sm:order-2"
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

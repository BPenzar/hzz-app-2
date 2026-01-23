'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WizardSection } from './WizardSection'
import { PreviewPanel } from './PreviewPanel'
import { useToast } from '@/hooks/use-toast'
import hzzStructure from '@/data/hzz-structure.json'
import { ChevronLeft, ChevronRight, FileDown, FileText, PanelRightOpen, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface GuestWizardFormProps {
  initialData?: Record<string, any>
  generatedAt?: string | null
  storageKey?: string
  onClearDraft?: () => void
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

const DEFAULT_STORAGE_KEY = 'hzz-guest-draft-v1'

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function GuestWizardForm({
  initialData = {},
  generatedAt,
  storageKey = DEFAULT_STORAGE_KEY,
  onClearDraft,
}: GuestWizardFormProps) {
  const { toast } = useToast()
  const [currentSection, setCurrentSection] = useState('2')
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const allSections = hzzStructure.sections
  const sections = allSections.filter((section) => section.key !== '1')

  const formattedGeneratedAt = useMemo(() => {
    if (!generatedAt) return null
    try {
      return new Date(generatedAt).toLocaleString('hr-HR')
    } catch {
      return null
    }
  }, [generatedAt])

  // Build hierarchical structure
  const sectionHierarchy: (Section | SectionHierarchy)[] = []
  const processedSections = new Set<string>()

  sections.forEach((section) => {
    const sectionId = section.id

    if (sectionId.includes('.')) {
      const parentId = sectionId.split('.')[0]

      if (processedSections.has(parentId)) return

      const subsections = sections.filter(s =>
        s.id.startsWith(parentId + '.') && s.id !== parentId
      )

      if (subsections.length > 0) {
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
      sectionHierarchy.push(section as Section)
      processedSections.add(sectionId)
    }
  })

  // Hydrate from localStorage when available
  useEffect(() => {
    const storedDraft = safeParse<Record<string, any> | null>(
      localStorage.getItem(storageKey),
      null
    )

    if (storedDraft && Object.keys(storedDraft).length > 0) {
      setFormData(storedDraft)
    } else {
      setFormData(initialData)
    }
    setIsHydrated(true)
  }, [storageKey, initialData])

  // Autosave to localStorage
  useEffect(() => {
    if (!isHydrated) return

    setIsSaving(true)
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(formData))
      setIsSaving(false)
    }, 900)

    return () => clearTimeout(timer)
  }, [formData, storageKey, isHydrated])

  // Scroll to top when section changes
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 50)
  }, [currentSection])

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData))
      toast({
        title: 'Spremljeno lokalno',
        description: 'Vaše izmjene su spremljene u pregledniku.',
      })
    } catch {
      toast({
        title: 'Greška',
        description: 'Nije moguće spremiti nacrt lokalno.',
        variant: 'destructive',
      })
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
    const fallback = 'hzz-zahtjev-lokalno'
    const section1 = formData['1'] || {}
    const parts = [section1.ime, section1.prezime].filter(Boolean)
    const base = parts.length > 0 ? `hzz-zahtjev-${parts.join('-')}` : fallback
    const cleaned = sanitizeFileName(base)
    return cleaned || fallback
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
      const [{ default: html2pdf }, { saveAs }] = await Promise.all([
        import('html2pdf.js'),
        import('file-saver'),
      ])

      const options = {
        margin: 0.5,
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

      const worker = html2pdf().set(options).from(previewElement)
      const pdfBlob = await worker.outputPdf('blob')
      saveAs(pdfBlob, `${getFileBaseName()}.pdf`)
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
      const [{ Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell }, { saveAs }] =
        await Promise.all([import('docx'), import('file-saver')])

      const docSections: any[] = []

      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'HZZ Zahtjev za dodjelu poticaja',
              bold: true,
              size: 32,
              font: 'Arial'
            })
          ],
          spacing: { after: 300 }
        })
      )

      sections.forEach(section => {
        const sectionData = formData[section.key]
        if (!sectionData || Object.keys(sectionData).length === 0) return

        docSections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${section.id}. ${section.title}`,
                bold: true,
                size: 24,
                font: 'Arial'
              })
            ],
            spacing: { before: 240, after: 120 }
          })
        )

        section.fields?.forEach((field: any) => {
          const fieldValue = sectionData[field.key]
          if (!fieldValue && fieldValue !== 0 && fieldValue !== false) return

          if (field.type === 'helper_text' || field.type === 'section_label') return

          if (field.type === 'table') {
            const tableData = Array.isArray(fieldValue) ? fieldValue : []
            if (tableData.length > 0) {
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
            let displayValue = fieldValue
            if (field.type === 'radio' || field.type === 'select') {
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

      const doc = new Document({
        sections: [{
          children: docSections,
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440
              }
            }
          }
        }]
      })

      const blob = await Packer.toBlob(doc)
      saveAs(blob, `${getFileBaseName()}.docx`)

      toast({
        title: 'Uspješno',
        description: 'DOCX dokument je uspješno stvoren.',
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
    <div className="bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold truncate">
                {currentSectionData?.id}. {currentSectionData?.title}
              </h2>
              {parentInfo && (
                <p className="text-sm text-gray-600">
                  {parentInfo.parentTitle}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Lokalni nacrt {formattedGeneratedAt ? `· Generirano: ${formattedGeneratedAt}` : ''}
              </p>
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
                Spremi lokalno
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
                        <SheetTitle>Pregled lokalnog zahtjeva</SheetTitle>
                        <SheetDescription>
                          Preuzmite PDF ili DOCX. Podaci se ne spremaju na server.
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
              {onClearDraft && (
                <Button
                  onClick={onClearDraft}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-sm text-red-600 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Obriši nacrt
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b sticky top-[73px] z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 py-3 overflow-x-auto px-2 sm:px-0">
            {sectionHierarchy.map((item, idx) => {
              if ('subsections' in item) {
                const isActive = currentSectionData?.id.startsWith(item.parentKey + '.')

                return (
                  <div key={item.parentKey} className="flex items-center gap-2">
                    {isActive ? (
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
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

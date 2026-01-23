'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WizardSection } from './WizardSection'
import { useToast } from '@/hooks/use-toast'
import hzzStructure from '@/data/hzz-structure.json'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

interface GuestWizardFormProps {
  initialData?: Record<string, any>
  generatedAt?: string | null
  storageKey?: string
  onExit?: () => void
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
  onExit,
}: GuestWizardFormProps) {
  const { toast } = useToast()
  const [currentSection, setCurrentSection] = useState('2')
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
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

    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(formData))
    }, 900)

    return () => clearTimeout(timer)
  }, [formData, storageKey, isHydrated])

  // Scroll to top when section changes
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 50)
  }, [currentSection])

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

  const showExportNotice = () => {
    toast({
      title: 'Dostupno uz račun',
      description: 'Preuzimanje PDF/DOCX omogućeno je samo registriranim korisnicima.',
    })
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
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-sm"
                onClick={showExportNotice}
              >
                Pregled
              </Button>
              {onExit && (
                <Button
                  onClick={onExit}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Natrag
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

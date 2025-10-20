'use client'

import hzzStructure from '@/data/hzz-structure.json'

interface PreviewPanelProps {
  data: Record<string, any>
  sections: any[]
}

// Helper function to get friendly label for radio/select options
function getFriendlyLabel(field: any, value: string): string {
  // Find the field definition in hzz-structure to get options
  for (const section of hzzStructure.sections) {
    const fieldDef = section.fields.find(f => f.key === field.key)
    if (fieldDef && 'options' in fieldDef && fieldDef.options) {
      const option = fieldDef.options.find((opt: any) => opt.value === value)
      if (option) return option.label
    }
  }
  return value
}

// Helper function to format field value based on type
function formatFieldValue(field: any, value: any): string | JSX.Element {
  // Skip helper text and section labels (these are not data fields)
  if (field.type === 'helper_text' || field.type === 'section_label') {
    return ''
  }

  // Handle empty values
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return ''
  }

  // Handle arrays (tables)
  if (Array.isArray(value)) {
    // Empty array
    if (value.length === 0) return ''

    // Format as a table
    return (
      <div className="mt-1">
        {value.map((row, idx) => {
          // Get all non-empty values from the row
          const entries = Object.entries(row).filter(([key, val]) => val && String(val).trim() !== '')

          if (entries.length === 0) return null

          return (
            <div key={idx} className="mb-1 pl-3 text-sm">
              {entries.map(([key, val], entryIdx) => (
                <span key={key}>
                  {String(val)}
                  {entryIdx < entries.length - 1 ? ' - ' : ''}
                </span>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  // Handle radio buttons and selects - convert internal value to friendly label
  if (field.type === 'radio' || field.type === 'select') {
    return getFriendlyLabel(field, String(value))
  }

  // Handle regular text/textarea/date
  return String(value)
}

export function PreviewPanel({ data, sections }: PreviewPanelProps) {
  const hasData = Object.keys(data).length > 0

  if (!hasData) {
    return (
      <div className="text-center text-gray-500 py-16">
        <p className="text-lg">Popunite formu da vidite pregled</p>
      </div>
    )
  }

  return (
    <div id="pdf-preview-content" className="max-w-4xl mx-auto bg-white shadow-2xl min-h-screen">
      <style>{`
        @media print {
          .break-inside-avoid-page {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
      {/* PDF-style document */}
      <div className="p-10 space-y-6">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            HZZ Zahtjev za samozapošljavanje
          </h1>
          <p className="text-xs text-gray-600">
            Datum: {new Date().toLocaleDateString('hr-HR')}
          </p>
        </div>

        {/* Sections */}
        {sections.map((section) => {
          const sectionData = data[section.key]

          // Skip if no data
          if (!sectionData || Object.keys(sectionData).length === 0) return null

          return (
            <div key={section.key} className="mb-6 break-inside-avoid-page">
              {/* Section Title */}
              <h2 className="text-base font-bold text-gray-900 mb-3 pb-1 border-b border-gray-400">
                {section.id}. {section.title}
              </h2>

              {/* Section Fields */}
              <div className="space-y-3 pl-3">
                {section.fields.map((field: any) => {
                  // Skip helper text and section labels
                  if (field.type === 'helper_text' || field.type === 'section_label') {
                    return null
                  }

                  const value = sectionData[field.key]
                  const formattedValue = formatFieldValue(field, value)

                  // Skip empty fields
                  if (!formattedValue || (typeof formattedValue === 'string' && formattedValue.trim() === '')) {
                    return null
                  }

                  return (
                    <div key={field.key} className="space-y-0.5 break-inside-avoid">
                      {/* Field Label */}
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {field.label}:
                      </p>
                      {/* Field Value */}
                      {typeof formattedValue === 'string' ? (
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-snug pl-3">
                          {formattedValue}
                        </p>
                      ) : (
                        <div className="text-sm text-gray-900 leading-snug">
                          {formattedValue}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

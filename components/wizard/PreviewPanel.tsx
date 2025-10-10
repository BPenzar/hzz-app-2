'use client'

interface PreviewPanelProps {
  data: Record<string, any>
  sections: any[]
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
                  const value = sectionData[field.key]

                  // Skip empty fields
                  if (!value || String(value).trim() === '') return null

                  return (
                    <div key={field.key} className="space-y-0.5 break-inside-avoid">
                      {/* Field Label */}
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {field.label}:
                      </p>
                      {/* Field Value */}
                      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-snug pl-3">
                        {String(value)}
                      </p>
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

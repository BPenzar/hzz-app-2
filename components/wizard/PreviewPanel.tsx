'use client'

import hzzStructure from '@/data/hzz-structure.json'
import { TABLE_COLUMN_LABELS, resolveTableColumns } from '@/lib/hzz/tableSchema'
import type { Json } from '@/types/supabase'

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
function formatFieldValue(field: any, value: any, allData?: Record<string, any>): string | JSX.Element {
  // Skip helper text and section labels (these are not data fields)
  if (field.type === 'helper_text' || field.type === 'section_label') {
    return ''
  }

  // Handle profit_summary field (Section 3.7)
  if (field.type === 'profit_summary') {
    if (!allData) return ''

    // Calculate totals from income tables (3.5)
    const calculateIncomeTotal = (year: 1 | 2) => {
      const tableKey = year === 1 ? 'tablica_prihodi_god1_T2_1' : 'tablica_prihodi_god2_T2_2'
      const rows = allData['3.5']?.[tableKey] || []

      return rows.reduce((total: number, row: any) => {
        const godisnji = parseFloat(row.godisnji_prihod) || 0
        return total + godisnji
      }, 0)
    }

    // Calculate labor costs from tables (3.6)
    const calculateLaborCosts = (year: 1 | 2) => {
      const tableKey = year === 1 ? 'trosak_rada_god1_T3_1' : 'trosak_rada_god2_T3_2'
      const rows = allData['3.6']?.[tableKey] || []

      return rows.reduce((total: number, row: any) => {
        const godisnji = parseFloat(row.godisnji_iznos) || 0
        return total + godisnji
      }, 0)
    }

    // Calculate other costs from tables (3.6)
    const calculateOtherCosts = (year: 1 | 2) => {
      const tableKey = year === 1 ? 'ostali_troskovi_god1_T4_1' : 'ostali_troskovi_god2_T4_2'
      const rows = allData['3.6']?.[tableKey] || []

      return rows.reduce((total: number, row: any) => {
        const godisnji = parseFloat(row.godisnji_iznos) || 0
        return total + godisnji
      }, 0)
    }

    const income1 = calculateIncomeTotal(1)
    const income2 = calculateIncomeTotal(2)

    const laborCosts1 = calculateLaborCosts(1)
    const laborCosts2 = calculateLaborCosts(2)

    const otherCosts1 = calculateOtherCosts(1)
    const otherCosts2 = calculateOtherCosts(2)

    const totalCosts1 = laborCosts1 + otherCosts1
    const totalCosts2 = laborCosts2 + otherCosts2

    const profitBeforeTax1 = income1 - totalCosts1
    const profitBeforeTax2 = income2 - totalCosts2

    // Calculate tax (20%) - "Porez na dobit"
    const tax1 = profitBeforeTax1 * 0.20
    const tax2 = profitBeforeTax2 * 0.20

    // Net profit after tax
    const netProfit1 = profitBeforeTax1 - tax1
    const netProfit2 = profitBeforeTax2 - tax2

    const formatNumber = (num: number) => {
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    return (
      <div className="mt-2">
        <table className="pdf-table pdf-profit-table">
          <thead>
            <tr>
              <th></th>
              <th className="text-center">Prva godina</th>
              <th className="text-center">Druga godina</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-medium">
                Godišnji prihodi od prodaje (tablica 2.1. i 2.2.)
              </td>
              <td className="text-right">
                {formatNumber(income1)} €
              </td>
              <td className="text-right">
                {formatNumber(income2)} €
              </td>
            </tr>
            <tr>
              <td className="font-medium">
                Ukupni godišnji troškovi (tablica 3.1. i 3.2. + 4.1. i 4.2.)
              </td>
              <td className="text-right">
                {formatNumber(totalCosts1)} €
              </td>
              <td className="text-right">
                {formatNumber(totalCosts2)} €
              </td>
            </tr>
            <tr style={{ backgroundColor: '#fff3cd' }}>
              <td className="font-bold">
                Očekivana dobit prije oporezivanja (redak 1. umanjiti za redak 2.)
              </td>
              <td className="text-right font-bold">
                {formatNumber(profitBeforeTax1)} €
              </td>
              <td className="text-right font-bold">
                {formatNumber(profitBeforeTax2)} €
              </td>
            </tr>
            <tr>
              <td className="font-medium">
                Porez na dobit (redak 3. pomnožiti s 0,20)
              </td>
              <td className="text-right">
                {formatNumber(tax1)} €
              </td>
              <td className="text-right">
                {formatNumber(tax2)} €
              </td>
            </tr>
            <tr style={{ backgroundColor: '#d4edda' }}>
              <td className="font-bold">
                Očekivana neto dobit (redak 3. umanjiti za redak 4.)
              </td>
              <td className="text-right font-bold text-green-700">
                {formatNumber(netProfit1)} €
              </td>
              <td className="text-right font-bold text-green-700">
                {formatNumber(netProfit2)} €
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  // Handle empty values
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return ''
  }

  // Handle checkbox arrays (simple array of values)
  if (Array.isArray(value) && field.type === 'checkbox') {
    // Empty array
    if (value.length === 0) return ''

    // Convert checkbox values to friendly labels
    const labels = value.map(val => getFriendlyLabel(field, String(val))).filter(label => label)
    return labels.join(', ')
  }

  // Handle arrays (tables)
  if (Array.isArray(value)) {
    // Empty array
    if (value.length === 0) return ''

    // Get column headers from first row
    const firstRow = value[0]
    if (!firstRow || typeof firstRow !== 'object') return ''

    const tableType = (field as any).tableType || 'default'
    const columns = resolveTableColumns(tableType, value as Json[])

    if (columns.length === 0) return ''

    // Format as a proper table
    return (
      <div className="mt-2">
        <table className="pdf-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>
                  {TABLE_COLUMN_LABELS[col] || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((row, idx) => {
              // Check if row has any non-empty values
              const hasData = columns.some(col => row[col] && String(row[col]).trim() !== '')
              if (!hasData) return null

              return (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col}>
                      {row[col] ? (
                        typeof row[col] === 'number' ?
                          row[col].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') :
                          String(row[col])
                      ) : ''}
                    </td>
                  ))}
                </tr>
              )
            })}
            {/* Add total row if field has showTotal */}
            {field.showTotal && (
              <tr className="total-row">
                <td className="font-bold">
                  Ukupno
                </td>
                {columns.slice(1).map(col => {
                  // Calculate total for numeric columns
                  const isNumeric = value.some(row => {
                    const raw = row[col]
                    if (raw === null || raw === undefined) return false
                    if (typeof raw === 'number') return true
                    if (typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(parseFloat(raw))) {
                      return true
                    }
                    return false
                  })
                  if (isNumeric) {
                    const total = value.reduce((sum, row) => {
                      const val = parseFloat(row[col]) || 0
                      return sum + val
                    }, 0)
                    return (
                      <td key={col} className="font-bold">
                        {total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>
                    )
                  }
                  return <td key={col}></td>
                })}
              </tr>
            )}
          </tbody>
        </table>
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
          table {
            break-inside: avoid;
          }
          th, td {
            break-inside: avoid;
          }
        }
        /* Enhanced PDF styling */
        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 10px;
          line-height: 1.3;
        }
        .pdf-table th {
          background-color: #f5f5f5 !important;
          font-weight: bold;
          padding: 6px;
          border: 1px solid #666;
          text-align: left;
        }
        .pdf-table td {
          padding: 5px 6px;
          border: 1px solid #666;
          vertical-align: top;
        }
        .pdf-table tr:nth-child(even) td {
          background-color: #fafafa !important;
        }
        .pdf-table .total-row {
          background-color: #e5e5e5 !important;
          font-weight: bold;
        }
        .pdf-profit-table {
          border: 2px solid #333 !important;
        }
        .pdf-profit-table th {
          background-color: #ddd !important;
          border: 1px solid #333;
        }
        .pdf-profit-table td {
          border: 1px solid #333;
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
          // Skip section 5 (Prilozi) - these are attachments, not content for PDF
          if (section.key === '5') return null

          const sectionData = data[section.key]

          // Skip if no data
          if (!sectionData || (typeof sectionData === 'object' && !Array.isArray(sectionData) && Object.keys(sectionData).length === 0)) {
            return null
          }

          const isObjectSection = sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)

          return (
            <div key={section.key} className="mb-6 break-inside-avoid-page">
              {/* Section Title */}
              <h2 className="text-base font-bold text-gray-900 mb-3 pb-1 border-b border-gray-400">
                {section.id}. {section.title}
              </h2>

              {/* Section Fields */}
              <div className="space-y-3 pl-3">
                {!isObjectSection ? (
                  (() => {
                    const rawValue =
                      typeof sectionData === 'string'
                        ? sectionData
                        : JSON.stringify(sectionData, null, 2)

                    if (!rawValue || rawValue.trim() === '') {
                      return null
                    }

                    return (
                      <div className="space-y-0.5 break-inside-avoid">
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Sadržaj
                        </p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-snug pl-3">
                          {rawValue}
                        </p>
                      </div>
                    )
                  })()
                ) : (
                  section.fields.map((field: any) => {
                    // Skip helper text and section labels
                    if (field.type === 'helper_text' || field.type === 'section_label') {
                      return null
                    }

                  const value = sectionData[field.key]
                  const formattedValue = formatFieldValue(field, value, data)

                  // Skip empty fields
                  if (!formattedValue || (typeof formattedValue === 'string' && formattedValue.trim() === '')) {
                    return null
                  }

                  return (
                    <div key={field.key} className="space-y-0.5 break-inside-avoid">
                      {/* Field Label */}
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {field.label}
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
                })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

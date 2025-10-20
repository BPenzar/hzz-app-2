import hzzStructure from '@/data/hzz-structure.json'
import type { Json } from '@/types/supabase'

type SectionKey = string

interface FieldDefinition {
  key: string
  label: string
  type: string
}

interface SanitizedSection {
  [fieldKey: string]: Json
}

interface ValidationSuccess {
  success: true
  data: Record<SectionKey, SanitizedSection>
}

interface ValidationFailure {
  success: false
  data: Record<SectionKey, SanitizedSection>
  issues: string[]
}

type ValidationResult = ValidationSuccess | ValidationFailure

const businessSections = hzzStructure.sections.filter((section) => section.key !== '1')

const stringConvertible = (value: unknown): { value: string; issue?: string } => {
  if (value === undefined || value === null) {
    return { value: '' }
  }

  if (typeof value === 'string') {
    return { value }
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return { value: String(value) }
  }

  return {
    value: '',
    issue: 'Vrijednost nije moguće pretvoriti u tekst.',
  }
}

const sanitizeCheckbox = (value: unknown): { value: string[]; issue?: string } => {
  if (value === undefined || value === null) {
    return { value: [] }
  }

  const normalizeSingleValue = (input: unknown): string | null => {
    const converted = stringConvertible(input)
    if (converted.issue) {
      return null
    }
    const trimmed = converted.value.trim()
    return trimmed === '' ? null : trimmed
  }

  const collect = (items: unknown[]): { values: string[]; hadInvalid: boolean } => {
    const values: string[] = []
    let hadInvalid = false

    items.forEach((item) => {
      const normalized = normalizeSingleValue(item)
      if (normalized === null) {
        hadInvalid = true
        return
      }
      values.push(normalized)
    })

    return { values, hadInvalid }
  }

  if (Array.isArray(value)) {
    const result = collect(value)
    return {
      value: result.values,
      issue: result.hadInvalid ? 'Neke vrijednosti u listi nisu valjane.' : undefined,
    }
  }

  if (typeof value === 'string') {
    const parts = value
      .split(/[,;\n]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)

    if (parts.length === 0) {
      return { value: [] }
    }

    const result = collect(parts)
    return {
      value: result.values,
      issue: result.hadInvalid ? 'Neke vrijednosti u listi nisu valjane.' : undefined,
    }
  }

  const normalized = normalizeSingleValue(value)
  if (normalized === null) {
    return {
      value: [],
      issue: 'Očekivana je lista opcija.',
    }
  }

  return { value: [normalized] }
}

const sanitizeTable = (value: unknown): { value: Json[]; issue?: string } => {
  if (value === undefined || value === null) {
    return { value: [] }
  }

  if (!Array.isArray(value)) {
    return {
      value: [],
      issue: 'Očekivana je tablica (lista redaka).',
    }
  }

  const sanitizedRows: Json[] = []
  let hadInvalidRow = false

  value.forEach((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      hadInvalidRow = true
      return
    }

    const record: Record<string, Json> = {}
    Object.entries(row as Record<string, unknown>).forEach(([key, cellValue]) => {
      if (
        cellValue === null ||
        typeof cellValue === 'string' ||
        typeof cellValue === 'number' ||
        typeof cellValue === 'boolean'
      ) {
        record[key] = cellValue as Json
      } else if (Array.isArray(cellValue)) {
        const arraySanitized = sanitizeCheckbox(cellValue)
        record[key] = arraySanitized.value
      } else if (typeof cellValue === 'object') {
        // Nested structures are not expected but retain as JSON object
        record[key] = cellValue as Json
      }
    })

    sanitizedRows.push(record)
  })

  return {
    value: sanitizedRows,
    issue: hadInvalidRow ? 'Neki redovi u tablici nisu imali valjanu strukturu.' : undefined,
  }
}

const sanitizeProfitSummary = (value: unknown): { value: Json; issue?: string } => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      value: {},
    }
  }

  return { value: value as Json }
}

const sanitizeFieldValue = (
  sectionKey: string,
  field: FieldDefinition,
  rawValue: unknown
): { value: Json; issue?: string } => {
  switch (field.type) {
    case 'checkbox':
      return sanitizeCheckbox(rawValue)
    case 'table':
      return sanitizeTable(rawValue)
    case 'profit_summary':
      return sanitizeProfitSummary(rawValue)
    case 'helper_text':
    case 'section_label':
      // These are UI helpers, ignore during validation
      return { value: '' }
    default:
      return stringConvertible(rawValue)
  }
}

export function validateGeneratedSections(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      success: false,
      data: {},
      issues: ['Generirani podaci nisu valjan JSON objekt.'],
    }
  }

  const issues: string[] = []
  const sanitized: Record<SectionKey, SanitizedSection> = {}
  const payload = input as Record<string, unknown>

  businessSections.forEach((section) => {
    const rawSection = payload[section.key]

    if (!rawSection || typeof rawSection !== 'object' || Array.isArray(rawSection)) {
      issues.push(`Sekcija ${section.id} (${section.key}) nema valjanu strukturu.`)
    }

    const sectionInput =
      !rawSection || typeof rawSection !== 'object' || Array.isArray(rawSection)
        ? {}
        : (rawSection as Record<string, unknown>)

    const sanitizedSection: SanitizedSection = {}

    section.fields.forEach((field) => {
      const result = sanitizeFieldValue(section.key, field as FieldDefinition, sectionInput[field.key])
      if (result.issue) {
        issues.push(`Sekcija ${section.id} - polje "${field.label}" (${field.key}): ${result.issue}`)
      }
      sanitizedSection[field.key] = result.value
    })

    sanitized[section.key] = sanitizedSection
  })

  if (issues.length > 0) {
    return {
      success: false,
      data: sanitized,
      issues,
    }
  }

  return {
    success: true,
    data: sanitized,
  }
}

import { describe, expect, it } from 'vitest'
import { validateGeneratedSections } from '@/lib/validation/hzz'
import hzzStructure from '../../../data/hzz-structure.json'

type Section = {
  key: string
  id: string
  fields: Array<{ key: string; label: string; type: string }>
}

const sections = (hzzStructure.sections as Section[]).filter((section) => section.key !== '1')

const buildBaseInput = () =>
  Object.fromEntries(sections.map((section) => [section.key, {}])) as Record<
    string,
    Record<string, unknown>
  >

const findFieldByType = (type: string) => {
  for (const section of sections) {
    for (const field of section.fields ?? []) {
      if (field.type === type) {
        return { sectionKey: section.key, field }
      }
    }
  }
  return null
}

describe('validateGeneratedSections', () => {
  it('fails when input is not an object', () => {
    const result = validateGeneratedSections('invalid')
    expect(result.success).toBe(false)
    expect(result.issues?.length).toBeGreaterThan(0)
  })

  it('passes with empty section objects', () => {
    const result = validateGeneratedSections(buildBaseInput())
    expect(result.success).toBe(true)
  })

  it('sanitizes checkbox values from a delimited string', () => {
    const checkboxField = findFieldByType('checkbox')
    expect(checkboxField).not.toBeNull()

    if (!checkboxField) return

    const input = buildBaseInput()
    input[checkboxField.sectionKey][checkboxField.field.key] = 'opcija1, opcija2; opcija3'

    const result = validateGeneratedSections(input)
    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data[checkboxField.sectionKey][checkboxField.field.key]).toEqual([
        'opcija1',
        'opcija2',
        'opcija3',
      ])
    }
  })

  it('flags invalid table values', () => {
    const tableField = findFieldByType('table')
    expect(tableField).not.toBeNull()

    if (!tableField) return

    const input = buildBaseInput()
    input[tableField.sectionKey][tableField.field.key] = 'not-a-table'

    const result = validateGeneratedSections(input)
    expect(result.success).toBe(false)
    expect(result.issues?.some((issue) => issue.includes(tableField.field.key))).toBe(true)
  })
})

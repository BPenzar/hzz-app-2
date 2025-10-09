'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import hzzQuestions from '@/data/hzz-questions.json'

interface Field {
  key: string
  label: string
  type: string
  required: boolean
}

interface Section {
  id: string
  key: string
  title: string
  fields: Field[]
}

interface WizardSectionProps {
  section: Section
  data: Record<string, any>
  onChange: (fieldKey: string, value: any) => void
}

export function WizardSection({ section, data, onChange }: WizardSectionProps) {
  const getQuestionText = (sectionKey: string, fieldKey: string): string => {
    const questions = hzzQuestions as Record<string, Record<string, string>>
    return questions[sectionKey]?.[fieldKey] || ''
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">{section.title}</h2>

      {section.fields.map((field) => {
        const helpText = getQuestionText(section.key, field.key)

        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {helpText && (
              <p className="text-sm text-gray-500">{helpText}</p>
            )}

            {field.type === 'textarea' ? (
              <Textarea
                id={field.key}
                value={data[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.label}
                rows={4}
                required={field.required}
              />
            ) : (
              <Input
                id={field.key}
                type={field.type}
                value={data[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.label}
                required={field.required}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

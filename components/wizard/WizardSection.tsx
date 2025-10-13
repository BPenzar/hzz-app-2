'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioField } from './fields/RadioField'
import { SelectField } from './fields/SelectField'
import { CheckboxField } from './fields/CheckboxField'
import { TableField } from './fields/TableField'
import { ProfitSummaryField } from './fields/ProfitSummaryField'
import hzzQuestions from '@/data/hzz-questions.json'

interface FieldOption {
  value: string
  label: string
}

interface Field {
  key: string
  label: string
  type: string
  required: boolean
  options?: FieldOption[]
  comment?: string
  tableType?: string
  showTotal?: boolean
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
  allData?: Record<string, any>
}

export function WizardSection({ section, data, onChange, allData = {} }: WizardSectionProps) {
  const getQuestionText = (sectionKey: string, fieldKey: string): string => {
    const questions = hzzQuestions as Record<string, Record<string, string>>
    return questions[sectionKey]?.[fieldKey] || ''
  }

  const renderField = (field: Field) => {
    const helpText = getQuestionText(section.key, field.key)

    switch (field.type) {
      case 'radio':
        return (
          <div className="space-y-2">
            {field.comment && (
              <div className="bg-gray-50 border border-gray-300 rounded-md p-3 text-sm text-gray-700 mb-2">
                {field.comment}
              </div>
            )}
            <RadioField
              id={field.key}
              label={field.label}
              value={data[field.key] || ''}
              onChange={(value) => onChange(field.key, value)}
              options={field.options || []}
              required={field.required}
              helpText={helpText}
            />
          </div>
        )

      case 'select':
        return (
          <SelectField
            id={field.key}
            label={field.label}
            value={data[field.key] || ''}
            onChange={(value) => onChange(field.key, value)}
            options={field.options || []}
            required={field.required}
            helpText={helpText}
            placeholder={field.label}
          />
        )

      case 'checkbox':
        return (
          <CheckboxField
            id={field.key}
            label={field.label}
            value={data[field.key] || []}
            onChange={(value) => onChange(field.key, value)}
            options={field.options || []}
            required={field.required}
            helpText={helpText}
          />
        )

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
            <Textarea
              id={field.key}
              value={data[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.label}
              rows={4}
              required={field.required}
            />
          </div>
        )

      case 'comment':
        return (
          <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-md p-4">
            <Label className="text-blue-900 font-semibold">{field.label}</Label>
            {field.comment && (
              <p className="text-sm text-blue-700 italic">{field.comment}</p>
            )}
          </div>
        )

      case 'table':
        return (
          <TableField
            id={field.key}
            label={field.label}
            value={data[field.key] || []}
            onChange={(value) => onChange(field.key, value)}
            tableType={field.tableType || 'default'}
            required={field.required}
            helpText={helpText}
            showTotal={field.showTotal}
          />
        )

      case 'profit_summary':
        return (
          <ProfitSummaryField
            id={field.key}
            label={field.label}
            data={allData}
            required={field.required}
            helpText={helpText}
          />
        )

      default:
        // text, email, tel, date, number, etc.
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
            {field.comment && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-md p-3 text-sm text-yellow-800">
                {field.comment}
              </div>
            )}
            <Input
              id={field.key}
              type={field.type}
              value={data[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.label}
              required={field.required}
            />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">{section.title}</h2>

      {section.fields.map((field) => (
        <div key={field.key}>
          {renderField(field)}
        </div>
      ))}
    </div>
  )
}

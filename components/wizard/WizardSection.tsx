'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
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

  // Helper function to determine if helpText is useful (not just a duplicate of the label)
  const isHelpTextUseful = (label: string, helpText: string): boolean => {
    if (!helpText || helpText.trim() === '') return false

    const normalizedLabel = label.toLowerCase().trim().replace(/[*:]/g, '').replace(/\(.*?\)/g, '')
    const normalizedHelp = helpText.toLowerCase().trim()

    // Consider useful if helpText is longer or different from label
    return (
      normalizedHelp.length > normalizedLabel.length + 5 &&
      normalizedHelp !== normalizedLabel
    )
  }

  // Helper component to render label with optional tooltip
  const LabelWithTooltip = ({
    htmlFor,
    label,
    required,
    helpText
  }: {
    htmlFor: string
    label: string
    required?: boolean
    helpText?: string
  }) => {
    const showTooltip = helpText && isHelpTextUseful(label, helpText)

    return (
      <Label htmlFor={htmlFor} className="flex items-center gap-1">
        {label}
        {showTooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help inline-block" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: helpText }} />
            </TooltipContent>
          </Tooltip>
        )}
      </Label>
    )
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
            <LabelWithTooltip
              htmlFor={field.key}
              label={field.label}
              required={field.required}
              helpText={helpText}
            />
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

      case 'helper_text':
        return (
          <div
            className="text-sm text-gray-600 mt-1 mb-1"
            dangerouslySetInnerHTML={{ __html: field.label.replace(/\n/g, '<br>') }}
          />
        )

      case 'section_label':
        return (
          <div className="space-y-2 mt-6 mb-4">
            <Label className="text-lg font-semibold flex items-center gap-2">
              {field.label}
              {helpText && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-blue-500 cursor-help inline-block" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: helpText }} />
                  </TooltipContent>
                </Tooltip>
              )}
            </Label>
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
            <LabelWithTooltip
              htmlFor={field.key}
              label={field.label}
              required={field.required}
              helpText={helpText}
            />
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
    <TooltipProvider>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-6">{section.title}</h2>

        {section.fields.map((field) => (
          <div key={field.key}>
            {renderField(field)}
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}

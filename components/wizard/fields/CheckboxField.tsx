'use client'

import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface CheckboxFieldProps {
  id: string
  label: string
  value: string[]
  onChange: (value: string[]) => void
  options: Array<{ value: string; label: string }>
  required?: boolean
  helpText?: string
}

// Helper function to determine if helpText is useful
const isHelpTextUseful = (label: string, helpText: string): boolean => {
  if (!helpText || helpText.trim() === '') return false

  const normalizedLabel = label.toLowerCase().trim().replace(/[*:]/g, '')
  const normalizedHelp = helpText.toLowerCase().trim()

  return (
    normalizedHelp.length > normalizedLabel.length + 20 &&
    normalizedHelp !== normalizedLabel
  )
}

export function CheckboxField({
  id,
  label,
  value = [],
  onChange,
  options,
  required = false,
  helpText,
}: CheckboxFieldProps) {
  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue])
    } else {
      onChange(value.filter((v) => v !== optionValue))
    }
  }

  const showTooltip = helpText && isHelpTextUseful(label, helpText)

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {showTooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help inline-block" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm">{helpText}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </Label>

      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${id}-${option.value}`}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) =>
                handleCheckboxChange(option.value, checked as boolean)
              }
            />
            <Label
              htmlFor={`${id}-${option.value}`}
              className="font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

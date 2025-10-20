'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface RadioFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  required?: boolean
  helpText?: string
}

// Helper function to determine if helpText is useful
const isHelpTextUseful = (label: string, helpText: string): boolean => {
  if (!helpText || helpText.trim() === '') return false

  const normalizedLabel = label.toLowerCase().trim().replace(/[*:]/g, '').replace(/\(.*?\)/g, '')
  const normalizedHelp = helpText.toLowerCase().trim()

  return (
    normalizedHelp.length > normalizedLabel.length + 5 &&
    normalizedHelp !== normalizedLabel
  )
}

export function RadioField({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  helpText,
}: RadioFieldProps) {
  const showTooltip = helpText && isHelpTextUseful(label, helpText)

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {showTooltip && (
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

      <RadioGroup value={value} onValueChange={onChange}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
            <Label htmlFor={`${id}-${option.value}`} className="font-normal cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

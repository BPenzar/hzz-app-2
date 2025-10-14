'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface SelectFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  required?: boolean
  helpText?: string
  placeholder?: string
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

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  helpText,
  placeholder,
}: SelectFieldProps) {
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

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder || label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

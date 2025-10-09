import { Badge } from '@/components/ui/badge'

type Status = 'draft' | 'valid' | 'submitted' | 'archived'

interface StatusBadgeProps {
  status: Status
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    draft: { variant: 'secondary' as const, label: 'Nacrt' },
    valid: { variant: 'default' as const, label: 'Validan' },
    submitted: { variant: 'default' as const, label: 'Poslan' },
    archived: { variant: 'outline' as const, label: 'Arhiviran' },
  }

  const { variant, label } = variants[status] || variants.draft

  return <Badge variant={variant}>{label}</Badge>
}

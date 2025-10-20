import { Badge } from '@/components/ui/badge'

type Status = 'draft' | 'valid' | 'submitted' | 'archived'

interface StatusBadgeProps {
  status: Status
}

export function StatusBadge({ status }: StatusBadgeProps) {
  // "Upitnik" (narančasto) - dok je u izradi prije AI generiranja
  // "Zahtjev" (zeleno) - nakon što je AI ispunio zahtjev
  const variants = {
    draft: {
      className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
      label: 'Upitnik'
    },
    valid: {
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
      label: 'Zahtjev'
    },
    submitted: {
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
      label: 'Zahtjev'
    },
    archived: {
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
      label: 'Zahtjev'
    },
  }

  const config = variants[status] || variants.draft

  return <Badge className={config.className}>{config.label}</Badge>
}

'use client'

import { ApplicationCard } from './ApplicationCard'
import type { Database } from '@/types/supabase'

type Application = Database['public']['Tables']['applications']['Row']

interface ApplicationListProps {
  applications: Application[]
}

export function ApplicationList({ applications }: ApplicationListProps) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Nemate još nijednu prijavu.</p>
        <p className="text-sm text-gray-500 mt-2">Kliknite "Nova prijava" za početak.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  )
}

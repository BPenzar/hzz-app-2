'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { FileText, MoreVertical, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { hr } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ApplicationCardProps {
  application: {
    id: string
    title: string | null
    status: string
    subject_type?: string | null
    total_costs?: number | null
    created_at: string
    updated_at: string
  }
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const timeAgo = formatDistanceToNow(new Date(application.updated_at), {
    addSuffix: true,
    locale: hr,
  })

  const handleDelete = async () => {
    if (!confirm('Jeste li sigurni da želite izbrisati ovu prijavu?')) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', application.id)

      if (error) throw error

      toast({
        title: 'Prijava izbrisana',
        description: 'Prijava je uspješno izbrisana.',
      })

      router.refresh()
    } catch (error) {
      console.error('Error deleting application:', error)
      toast({
        title: 'Greška',
        description: 'Nije moguće izbrisati prijavu.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{application.title || 'Novi zahtjev'}</CardTitle>
              <CardDescription className="text-sm">{timeAgo}</CardDescription>
            </div>
          </div>
          <StatusBadge status={application.status as any} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {application.subject_type && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tip subjekta:</span>
              <span className="font-medium">{application.subject_type}</span>
            </div>
          )}
          {application.total_costs !== null && (
            <div className="flex justify-between">
              <span className="text-gray-600">Ukupni troškovi:</span>
              <span className="font-medium">{application.total_costs?.toFixed(2)} €</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href={`/applications/${application.id}`}>
          <Button variant="default">Uredi</Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isDeleting}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Brisanje...' : 'Izbriši'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}

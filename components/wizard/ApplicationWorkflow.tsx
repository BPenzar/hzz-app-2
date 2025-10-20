'use client'

import { useState, useEffect } from 'react'
import { IntakeForm, IntakeData } from './IntakeForm'
import { WizardForm } from './WizardForm'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { Database, Json } from '@/types/supabase'

interface ApplicationWorkflowProps {
  applicationId: string
  initialData?: Record<string, any>
  hasExistingData?: boolean
}

export function ApplicationWorkflow({
  applicationId,
  initialData = {},
  hasExistingData = false,
}: ApplicationWorkflowProps) {
  const { toast } = useToast()
  const [mode, setMode] = useState<'intake' | 'edit'>(
    hasExistingData ? 'edit' : 'intake'
  )
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [user, setUser] = useState<any>(null)

  // Get user for header
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleGenerate = async (intakeData: IntakeData) => {
    try {
      // Call the new intake-based generation API
      const response = await fetch('/api/generate/from-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: applicationId,
          intakeData: intakeData,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        const errorMessage =
          result?.error || 'Generiranje nije uspjelo. Pokušajte ponovno.'
        const issues = Array.isArray(result?.issues) ? result.issues : []
        const fullMessage =
          issues.length > 0 ? `${errorMessage} (${issues.join(' | ')})` : errorMessage

        const error = new Error(fullMessage)
        ;(error as any).issues = issues
        throw error
      }

      if (result.success) {
        // Save generated data to Supabase
        const supabase = createClient()

        // Update sections with generated data
        for (const [sectionKey, sectionData] of Object.entries(result.data)) {
          const payload: Database['public']['Tables']['sections']['Insert'] = {
            app_id: applicationId,
            code: sectionKey,
            data_json: sectionData as unknown as Json,
            status: 'draft',
          }

          await supabase
            .from('sections')
            .upsert(payload, {
              onConflict: 'app_id,code',
            })
        }

        // Update application status to 'valid' after AI generation
        await supabase
          .from('applications')
          .update({ status: 'valid' })
          .eq('id', applicationId)

        setFormData(result.data)
        setMode('edit')

        toast({
          title: 'Uspješno generirano!',
          description:
            'AI je generirao potpuni zahtjev. Sada možete pregledati i urediti sve sekcije.',
        })
      }
    } catch (error) {
      console.error('Generation error:', error)
      throw error // Re-throw so IntakeForm can handle it
    }
  }

  return (
    <>
      <Header user={user} />
      {mode === 'intake' ? (
        <IntakeForm applicationId={applicationId} onGenerate={handleGenerate} />
      ) : (
        <WizardForm applicationId={applicationId} initialData={formData} />
      )}
      <Footer />
    </>
  )
}

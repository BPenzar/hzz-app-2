import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ApplicationWorkflow } from '@/components/wizard/ApplicationWorkflow'

export default async function ApplicationPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch application
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (appError || !application) {
    redirect('/dashboard')
  }

  // Fetch sections data
  const { data: sections, error: sectionsError } = await supabase
    .from('sections')
    .select('*')
    .eq('app_id', params.id)

  // Transform sections into formData object
  const initialData: Record<string, any> = {}
  let hasExistingData = false

  if (sections && sections.length > 0) {
    sections.forEach((section: any) => {
      initialData[section.code] = section.data_json
      // Check if we have generated data (sections other than 'intake')
      // Only consider it as "existing data" if we have actual generated sections
      if (
        section.code !== 'intake' &&
        section.data_json &&
        Object.keys(section.data_json).length > 0
      ) {
        hasExistingData = true
      }
    })
  }

  return (
    <ApplicationWorkflow
      applicationId={params.id}
      initialData={initialData}
      hasExistingData={hasExistingData}
    />
  )
}

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function NewApplicationPage() {
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Ensure user profile exists (fallback if trigger failed)
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      role: 'applicant',
    } as any)
    .select()
    .single()

  if (profileError) {
    console.error('Profile creation error:', profileError)
  }

  // Create new application
  const { data: newApp, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      title: 'Novi zahtjev',
      status: 'draft',
    } as any)
    .select()
    .single()

  if (error) {
    console.error('Error creating application:', error)
    redirect('/dashboard')
  }

  // Redirect to the new application wizard
  redirect(`/applications/${(newApp as any)?.id}`)
}

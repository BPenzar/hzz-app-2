import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const migrationSQL = `
      ALTER TABLE user_profiles
      ADD COLUMN IF NOT EXISTS ime TEXT,
      ADD COLUMN IF NOT EXISTS prezime TEXT,
      ADD COLUMN IF NOT EXISTS oib TEXT,
      ADD COLUMN IF NOT EXISTS kontakt_email TEXT,
      ADD COLUMN IF NOT EXISTS kontakt_tel TEXT;

      CREATE INDEX IF NOT EXISTS idx_user_profiles_oib ON user_profiles(oib);

      -- Update sections table to allow 'intake' as a valid code
      ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_code_check;
      ALTER TABLE sections ADD CONSTRAINT sections_code_check
        CHECK (code IN ('basic_info', 'business_idea', 'costs', 'revenue_plan', 'final', 'intake'));
    `

    // Try to run migration (this may not work depending on Supabase setup)
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // Return instructions for manual migration
      return NextResponse.json({
        success: false,
        message: 'Automatic migration not supported. Please run the SQL manually in Supabase dashboard.',
        instructions: 'Go to Supabase Dashboard > SQL Editor > New Query, paste and run the SQL below',
        sql: migrationSQL,
        error: error.message
      }, { status: 200 }) // Return 200 so user sees the SQL
    }

    return NextResponse.json({
      success: true,
      message: 'User profiles table updated successfully!'
    })
  } catch (error: any) {
    const migrationSQL = `
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS ime TEXT,
ADD COLUMN IF NOT EXISTS prezime TEXT,
ADD COLUMN IF NOT EXISTS oib TEXT,
ADD COLUMN IF NOT EXISTS kontakt_email TEXT,
ADD COLUMN IF NOT EXISTS kontakt_tel TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_oib ON user_profiles(oib);

-- Update sections table to allow 'intake' as a valid code
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_code_check;
ALTER TABLE sections ADD CONSTRAINT sections_code_check
  CHECK (code IN ('basic_info', 'business_idea', 'costs', 'revenue_plan', 'final', 'intake'));
    `

    return NextResponse.json({
      success: false,
      message: 'Migration failed. Please run the SQL manually in Supabase dashboard.',
      instructions: 'Go to Supabase Dashboard > SQL Editor > New Query, paste and run the SQL below',
      sql: migrationSQL,
      error: error.message
    }, { status: 200 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    service: 'User Profiles Migration',
    status: 'ready',
    instructions: 'POST to this endpoint to run migration, or run SQL manually in Supabase dashboard'
  })
}

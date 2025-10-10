import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import hzzStructure from '@/data/hzz-structure.json'

// Types
interface IntakeData {
  // Basic personal info
  ime: string
  prezime: string
  oib: string
  kontakt_email: string
  kontakt_tel: string

  // CV/Experience
  cv_text?: string
  radno_iskustvo?: string

  // Business idea
  poslovna_ideja: string
  vrsta_djelatnosti: string

  // Basic business info
  vrsta_subjekta: string
  lokacija: string

  // Financial
  iznos_trazene_potpore: string

  // Additional context
  dodatne_informacije?: string
}

interface GenerateFromIntakeRequest {
  app_id: string
  intakeData: IntakeData
}

interface GenerateResponse {
  success: boolean
  data?: Record<string, any>
  error?: string
}

// Enhanced system prompt for intake-based generation
const SYSTEM_PROMPT = `You are an expert Croatian business consultant specializing in HZZ (Hrvatski zavod za zapošljavanje) self-employment applications.

Your task:
1. You will receive basic information from an intake questionnaire (personal info, business idea, experience)
2. You must generate a COMPLETE, DETAILED HZZ application based on this limited information
3. Be creative but realistic - infer reasonable details that align with the business idea
4. Return data in the EXACT JSON structure format provided
5. Write everything in Croatian language
6. Be professional, specific, and thorough

Guidelines:
- For missing details, make reasonable assumptions based on the business type
- Use realistic Croatian market data (costs, salaries, prices)
- Follow Croatian business regulations and practices
- Create detailed financial projections (2 years)
- Generate realistic cost breakdowns
- Infer required permits/licenses based on the business type
- Create competitive analysis based on the industry
- Generate realistic revenue projections
- Fill ALL fields with relevant, specific content

JSON Structure:
- Each section is a key (e.g., "1", "2", "3.1", "3.2", etc.)
- Each section contains an object with field keys and values
- Return ONLY valid JSON, no markdown, no explanations
- Ensure all required fields from the template are populated`

export async function POST(request: NextRequest) {
  try {
    const body: GenerateFromIntakeRequest = await request.json()

    // Validation
    if (!body.app_id || !body.intakeData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { intakeData } = body

    console.log(`[AI Generate Intake] Starting generation for app_id: ${body.app_id}`)

    // Get API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error('[AI Generate Intake] OPENAI_API_KEY not found in environment')
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log(`[AI Generate Intake] Using API key, length: ${apiKey.length}`)

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Build comprehensive prompt from intake data
    const intakePrompt = `
INTAKE QUESTIONNAIRE DATA:

Personal Information:
- Name: ${intakeData.ime} ${intakeData.prezime}
- OIB: ${intakeData.oib}
- Email: ${intakeData.kontakt_email || 'Not provided'}
- Phone: ${intakeData.kontakt_tel || 'Not provided'}

Work Experience & Competencies:
${intakeData.radno_iskustvo || 'Not provided'}

Business Idea:
${intakeData.poslovna_ideja}

Type of Activity:
${intakeData.vrsta_djelatnosti || 'Not specified'}

Business Structure:
- Legal form: ${intakeData.vrsta_subjekta || 'obrt'}
- Location: ${intakeData.lokacija || 'Not specified'}

Financial Support:
- Requested amount: ${intakeData.iznos_trazene_potpore} EUR

Additional Information:
${intakeData.dodatne_informacije || 'None provided'}

---

Based on this intake information, generate a COMPLETE HZZ application. Infer and expand on all details that would be necessary for a comprehensive business plan. Be creative but realistic.
`

    // Create the section template structure
    const sectionTemplate: Record<string, any> = {}
    hzzStructure.sections.forEach((section) => {
      const sectionFields: Record<string, string> = {}
      section.fields.forEach((field) => {
        sectionFields[field.key] = '' // Empty string as placeholder
      })
      sectionTemplate[section.key] = sectionFields
    })

    // Generate with OpenAI
    try {
      const startTime = Date.now()

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `${intakePrompt}

Expected JSON structure template (fill ALL fields):
${JSON.stringify(sectionTemplate, null, 2)}

Generate the complete application now.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 8000,
      })

      const latency = Date.now() - startTime
      console.log(`[AI Generate Intake] OpenAI completion in ${latency}ms`)

      // Parse generated content
      const generatedContent = JSON.parse(
        completion.choices[0].message.content || '{}'
      )

      // Validate structure
      const templateKeys = Object.keys(sectionTemplate)
      const generatedKeys = Object.keys(generatedContent)

      const missingKeys = templateKeys.filter((k) => !generatedKeys.includes(k))
      if (missingKeys.length > 0) {
        console.warn(
          `[AI Generate Intake] Missing keys: ${missingKeys.join(', ')}`
        )
        // Fill missing keys with empty objects
        missingKeys.forEach((key) => {
          generatedContent[key] = sectionTemplate[key]
        })
      }

      console.log(`[AI Generate Intake] Successfully generated application`)

      // Return successful response
      return NextResponse.json({
        success: true,
        data: generatedContent,
      } as GenerateResponse)
    } catch (openaiError) {
      console.error('[AI Generate Intake] OpenAI API error:', openaiError)
      throw openaiError
    }
  } catch (error) {
    console.error('[AI Generate Intake] Unhandled error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      } as GenerateResponse,
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    service: 'HZZ-App AI Generation (Intake)',
    status: 'operational',
    model: 'gpt-4o',
  })
}

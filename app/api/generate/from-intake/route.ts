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
1. You will receive basic information from an intake questionnaire (business idea, experience, location)
2. You must generate ONLY THE BUSINESS PLAN SECTIONS (sections 3, 4, 5) based on this information
3. For SECTION 2: Only suggest appropriate NKD code(s) and activity names - DO NOT fill other fields (legal form, ownership, location, amount)
4. DO NOT generate Section 1 (personal data) - this will be filled separately by the user
5. Be creative but realistic - infer reasonable details that align with the business idea
6. Return data in the EXACT JSON structure format provided
7. Write everything in Croatian language
8. Be professional, specific, and thorough

Guidelines for Section 2:
- ONLY fill the 'nkd' field with appropriate NKD codes and activity names
- Format: Array of objects like [{"nkd_djelatnost": "73.11 - Reklamne agencije"}]
- Use official Croatian NKD 2024 classification
- Include both NKD code AND full activity name in the nkd_djelatnost field
- Leave other Section 2 fields EMPTY (vrsta_subjekta, struktura_vlasnistva_radio, sjediste, iznos_trazene_potpore)
- The user will fill these fields manually as only they know this information

Guidelines for Sections 3-5:
- For missing details, make reasonable assumptions based on the business type
- Use realistic Croatian market data (costs, salaries, prices)
- Follow Croatian business regulations and practices
- Create detailed financial projections (2 years)
- Generate realistic cost breakdowns
- Infer required permits/licenses based on the business type
- Create competitive analysis based on the industry
- Generate realistic revenue projections
- Fill ALL business fields with relevant, specific content

JSON Structure:
- Each section is a key (e.g., "2", "3.1", "3.2", etc.)
- Each section contains an object with field keys and values
- Return ONLY valid JSON, no markdown, no explanations
- DO NOT include section "1" in the output`

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

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey.trim(),
    })

    // Build comprehensive prompt from intake data (NO personal info for AI)
    const intakePrompt = `
INTAKE QUESTIONNAIRE DATA:

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

Based on this intake information, generate ONLY sections 2-5 of the HZZ application (business plan sections).
DO NOT generate Section 1 (personal data) as it will be filled separately by the user.
Infer and expand on all business details that would be necessary for a comprehensive business plan. Be creative but realistic.
`

    // Create the section template structure (EXCLUDE Section 1)
    const sectionTemplate: Record<string, any> = {}
    hzzStructure.sections.forEach((section) => {
      // Skip section 1 (personal data)
      if (section.key === '1') return

      const sectionFields: Record<string, string> = {}
      section.fields.forEach((field) => {
        sectionFields[field.key] = '' // Empty string as placeholder
      })
      sectionTemplate[section.key] = sectionFields
    })

    // Pre-populate Section 1 with intake data (only what user provided)
    // All other personal fields remain empty for user to fill manually
    const section1Data: Record<string, any> = {
      podrucni_ured: '',
      ime: intakeData.ime || '',
      prezime: intakeData.prezime || '',
      oib: intakeData.oib || '',
      zanimanje: '',
      datum_rodjenja: '',
      adresa: '',
      grad: '',
      kontakt_tel: intakeData.kontakt_tel || '',
      kontakt_email: intakeData.kontakt_email || '',
      osnovna_skola: '',
      srednja_skola: '',
      fakultet: '',
      usavrsavanje: '',
      edukacije_za_vodenje: '',
      hobiji: '',
      radionica: '',
      preth_poduzet_iskustvo_naslov: '',
      preth_poduzet_iskustvo: '',
      oib_poslovnog_subjekta: '',
      djelatnost: '',
      status: '',
      datum_osnivanja: '',
      datum_prestanka: '',
      razlog_prestanka: '',
      radno_iskustvo_ugovor: [],
      radno_iskustvo_ostalo: [],
      umirovljenik: '',
    }

    // Pre-populate Section 2 with intake data (except NKD which AI will suggest)
    const section2Data: Record<string, any> = {
      vrsta_subjekta: intakeData.vrsta_subjekta || '',
      struktura_vlasnistva_radio: '',
      struktura_vlasnistva_helper: '',
      struktura_vlasnistva_tablica: [],
      sjediste: intakeData.lokacija || '',
      nkd: [], // AI will fill this
      iznos_trazene_potpore: intakeData.iznos_trazene_potpore || '',
    }

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

      // Parse generated content (sections 2-5 only)
      const generatedContent = JSON.parse(
        completion.choices[0].message.content || '{}'
      )

      // Validate structure (check only business sections, not section 1)
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

      // Normalize NKD data from AI - could be string, object, or array
      let nkdData = generatedContent['2']?.nkd || []

      // If AI returned a string (e.g., "73.11 - Djelatnost"), convert to array format
      if (typeof nkdData === 'string') {
        nkdData = nkdData.split('\n').filter(line => line.trim()).map(line => ({
          nkd_djelatnost: line.trim()
        }))
      }
      // If AI returned an object (e.g., { "kod": "73.11", "naziv": "..." }), convert to array
      else if (nkdData && typeof nkdData === 'object' && !Array.isArray(nkdData)) {
        const kod = nkdData.kod || nkdData.nkd_kod || ''
        const naziv = nkdData.naziv || nkdData.naziv_djelatnosti || ''
        nkdData = [{
          nkd_djelatnost: `${kod}${naziv ? ' - ' + naziv : ''}`
        }]
      }
      // If already array, ensure proper format
      else if (Array.isArray(nkdData)) {
        nkdData = nkdData.map(item => {
          if (typeof item === 'string') {
            return { nkd_djelatnost: item }
          }
          // If item has separate kod/naziv fields, combine them
          if (item.nkd_kod || item.kod) {
            const kod = item.nkd_kod || item.kod || ''
            const naziv = item.naziv_djelatnosti || item.naziv || ''
            return { nkd_djelatnost: `${kod}${naziv ? ' - ' + naziv : ''}` }
          }
          // Already in correct format
          return item
        })
      }

      // Merge Section 2: Use pre-populated data + AI-generated NKD
      const mergedSection2 = {
        ...section2Data,
        nkd: nkdData,
      }

      // Add Section 1 and 2 with pre-populated data, plus AI-generated sections 3-5
      const completeData = {
        '1': section1Data,
        '2': mergedSection2,
        ...Object.fromEntries(
          Object.entries(generatedContent).filter(([key]) => key !== '2')
        ),
      }

      console.log(`[AI Generate Intake] Successfully generated application (sections 3-5) + pre-populated Sections 1-2`)

      // Return successful response with Section 1 + generated sections
      return NextResponse.json({
        success: true,
        data: completeData,
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

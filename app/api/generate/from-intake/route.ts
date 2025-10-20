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

IMPORTANT - Radio/Select/Checkbox Values:
- For radio buttons and select fields, use the EXACT lowercase value keys (e.g., "da" not "Da", "ne" not "Ne")
- For checkbox arrays, use lowercase value keys (e.g., ["posjetnice", "drustvene_mreze"])
- NEVER use label text as values - always use the value keys from the options

CRITICAL - Table Field Structure:
- For table fields, return arrays of objects with correct column keys:
- prihodi tables: [{"naziv": "...", "cijena": 0, "broj_prodaja": 0, "mjesecni_prihod": 0, "godisnji_prihod": 0}]
- trosak_rada tables: [{"vrsta": "...", "mjesecni_iznos": 0, "godisnji_iznos": 0}]
- ostali_troskovi tables: [{"naziv": "...", "mjesecni_iznos": 0, "godisnji_iznos": 0}]
- troskovnik tables: [{"vrsta_troska": "...", "iznos": 0}]
- radno_iskustvo tables: [{"razdoblje": "...", "poslodavac": "...", "zanimanje": "..."}]
- postojeca_oprema tables: [{"naziv": "..."}]
- ulaganja_drugi_izvori tables: [{"vrsta_ulaganja": "...", "iznos": 0}]
- NEVER return string values for table fields - always use array of objects with these exact keys

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

    // Debug: Check API key length and content (don't log the full key for security)
    console.log(`[AI Generate Intake] API key length: ${apiKey.length} characters`)
    console.log(`[AI Generate Intake] API key starts with: ${apiKey.substring(0, 20)}...`)
    console.log(`[AI Generate Intake] API key ends with: ...${apiKey.substring(apiKey.length - 20)}`)
    console.log(`[AI Generate Intake] First 50 chars hex:`, Buffer.from(apiKey.substring(0, 50)).toString('hex'))

    // Check for invisible characters or encoding issues
    const hasWeirdChars = /[\x00-\x1F\x7F-\x9F]/.test(apiKey)
    console.log(`[AI Generate Intake] Has control characters: ${hasWeirdChars}`)

    // Initialize OpenAI client - DO NOT TRIM, use as-is
    const openai = new OpenAI({
      apiKey: apiKey,
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

      const sectionFields: Record<string, any> = {}
      section.fields.forEach((field) => {
        // Use empty array for table fields, empty string for others
        sectionFields[field.key] = field.type === 'table' ? [] : ''
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

      console.log('[AI Parser] Raw generated content:', JSON.stringify(generatedContent, null, 2))

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

      // Normalize ALL table fields in generated content to ensure they are arrays with proper structure
      hzzStructure.sections.forEach((section) => {
        if (section.key === '1' || section.key === '2') return // Skip sections 1 and 2 (handled separately)

        const sectionData = generatedContent[section.key]
        if (!sectionData) return

        section.fields.forEach((field) => {
          if (field.type === 'table') {
            const value = sectionData[field.key]
            const tableType = field.tableType || 'default'

            console.log(`[AI Parser] Processing table field "${field.key}" (type: ${tableType}), value:`, value)

            // Ensure table fields are arrays with correct object structure
            if (!Array.isArray(value)) {
              if (value && typeof value === 'object') {
                // Convert single object to array
                sectionData[field.key] = [value]
              } else if (typeof value === 'string' && value.trim()) {
                // Parse string data into proper table format based on tableType
                sectionData[field.key] = parseTableData(value, tableType)
              } else {
                // Empty or invalid value, use empty array
                sectionData[field.key] = []
              }
            } else {
              // Already array, ensure objects have correct structure
              sectionData[field.key] = value.map(item =>
                typeof item === 'string' ? parseTableRowData(item, tableType) : item
              ).filter(item => item) // Remove null/undefined items
            }
          }
        })
      })

      // Helper function to parse table data based on type
      function parseTableData(text: string, tableType: string): any[] {
        const lines = text.split('\n').filter(line => line.trim())

        return lines.map(line => parseTableRowData(line, tableType)).filter(item => item)
      }

      // Helper function to parse individual table row based on type
      function parseTableRowData(text: string, tableType: string): any | null {
        const cleanText = text.trim()
        if (!cleanText) return null

        console.log(`[AI Parser] Parsing table row for type "${tableType}": "${cleanText}"`)

        let result = null

        switch (tableType) {
          case 'radno_iskustvo_ugovor':
          case 'radno_iskustvo_ostalo':
            // Parse "Igrač košarke u lokalnom klubu - 5 godina"
            if (cleanText.includes(' - ')) {
              const parts = cleanText.split(' - ')
              result = {
                razdoblje: parts[1] || '',
                poslodavac: '',
                zanimanje: parts[0] || cleanText
              }
            } else {
              result = {
                razdoblje: '',
                poslodavac: '',
                zanimanje: cleanText
              }
            }
            break

          case 'ulaganja_drugi_izvori':
            // Parse "Osobni kapital - 5000" or "vlasnita_sredstva"
            if (cleanText.includes(' - ')) {
              const parts = cleanText.split(' - ')
              return {
                vrsta_ulaganja: parts[0] || cleanText,
                iznos: parseFloat(parts[1]) || 0
              }
            }
            return {
              vrsta_ulaganja: cleanText,
              iznos: 0
            }

          case 'postojeca_oprema':
            // Parse "Košarkaške lopte - 10" or "goli"
            if (cleanText.includes(' - ')) {
              const parts = cleanText.split(' - ')
              return { naziv: parts[0] }
            }
            return { naziv: cleanText }

          case 'prihodi':
            // Parse "Prihodi od tura - 20000 - 100 - 200" (naziv - godisnji - broj_prodaja - cijena)
            if (cleanText.includes(' - ')) {
              const parts = cleanText.split(' - ')
              if (parts.length >= 4) {
                // Format: "Prihodi od tura - 20000 - 100 - 200"
                const naziv = parts[0]
                const godisnji = parseFloat(parts[1]) || 0
                const broj_prodaja = parseFloat(parts[2]) || 0
                const cijena = parseFloat(parts[3]) || 0
                return {
                  naziv: naziv,
                  cijena: cijena,
                  broj_prodaja: broj_prodaja,
                  mjesecni_prihod: Math.round(godisnji / 12),
                  godisnji_prihod: godisnji
                }
              } else if (parts.length >= 3) {
                // Format: "HRK - Najam terena - 150000"
                const godisnji = parseFloat(parts[2]) || 0
                return {
                  naziv: parts[1] || cleanText,
                  cijena: Math.round(godisnji / 12 / 10), // Estimate monthly price per unit
                  broj_prodaja: 10, // Default estimate
                  mjesecni_prihod: Math.round(godisnji / 12),
                  godisnji_prihod: godisnji
                }
              } else {
                // Format: "Članarine - 30000"
                const godisnji = parseFloat(parts[1]) || 0
                return {
                  naziv: parts[0] || cleanText,
                  cijena: Math.round(godisnji / 12 / 10),
                  broj_prodaja: 10,
                  mjesecni_prihod: Math.round(godisnji / 12),
                  godisnji_prihod: godisnji
                }
              }
            }
            return {
              naziv: cleanText,
              cijena: 0,
              broj_prodaja: 0,
              mjesecni_prihod: 0,
              godisnji_prihod: 0
            }

          case 'trosak_rada':
            // Parse "Osobni dohodak - 60000 - 12 - 5000" (vrsta - godisnji - mjeseci - mjesecni)
            if (cleanText.includes(' - ')) {
              const parts = cleanText.split(' - ')
              if (parts.length >= 4) {
                // New format: "Osobni dohodak - 60000 - 12 - 5000"
                const vrsta = parts[0]
                const godisnji = parseFloat(parts[1]) || 0
                const mjesecni = parseFloat(parts[3]) || 0
                return {
                  vrsta: vrsta,
                  mjesecni_iznos: mjesecni,
                  godisnji_iznos: godisnji
                }
              } else {
                // Old format: "HRK - Plaće osoblja - 180000"
                const godisnji = parseFloat(parts[parts.length - 1]) || 0
                const naziv = parts.length > 2 ? parts[1] : parts[0]
                return {
                  vrsta: naziv || 'Bruto plaća za zaposlenike',
                  mjesecni_iznos: Math.round(godisnji / 12),
                  godisnji_iznos: godisnji
                }
              }
            }
            return {
              vrsta: cleanText,
              mjesecni_iznos: 0,
              godisnji_iznos: 0
            }

          case 'ostali_troskovi':
            // Parse "Marketing - 3000 - 1 - 3000" (naziv - godisnji - period - iznos)
            if (cleanText.includes(' - ')) {
              const parts = cleanText.split(' - ')
              if (parts.length >= 4) {
                // New format: "Marketing - 3000 - 1 - 3000"
                const naziv = parts[0]
                const godisnji = parseFloat(parts[1]) || 0
                const mjesecni = Math.round(godisnji / 12)
                return {
                  naziv: naziv,
                  mjesecni_iznos: mjesecni,
                  godisnji_iznos: godisnji
                }
              } else {
                // Old format: "HRK - Najam sportskog objekta - 36000"
                const godisnji = parseFloat(parts[parts.length - 1]) || 0
                const naziv = parts.length > 2 ? parts[1] : parts[0]
                return {
                  naziv: naziv || cleanText,
                  mjesecni_iznos: Math.round(godisnji / 12),
                  godisnji_iznos: godisnji
                }
              }
            }
            return {
              naziv: cleanText,
              mjesecni_iznos: 0,
              godisnji_iznos: 0
            }

          case 'troskovnik':
            // Parse "Kupnja opreme za vođenje tura - 5000 - 1 - 5000" (naziv - iznos - period - amount)
            if (cleanText.includes(' - ')) {
              const parts = cleanText.split(' - ')
              if (parts.length >= 4) {
                // New format: "Kupnja opreme za vođenje tura - 5000 - 1 - 5000"
                const naziv = parts[0]
                const iznos = parseFloat(parts[1]) || 0
                return {
                  vrsta_troska: naziv,
                  iznos: iznos
                }
              }
            }

            // Fallback to regex for old format
            const matches = cleanText.match(/(\d+)\s*-\s*(.+?)\s*-\s*(HRK|EUR)?\s*-?\s*(mjesečno|godisnje|jednokratno)?/)
            if (matches) {
              let iznos = parseFloat(matches[1]) || 0
              const naziv = matches[2] || cleanText
              const period = matches[4]

              // Convert to annual amount
              if (period === 'mjesečno') {
                iznos = iznos * 12
              }

              return {
                vrsta_troska: naziv,
                iznos: iznos
              }
            }
            return {
              vrsta_troska: cleanText,
              iznos: 0
            }

          default:
            // Generic fallback
            result = { naziv: cleanText }
        }

        console.log(`[AI Parser] Result for "${tableType}":`, result)
        return result
      }

      // Normalize radio/select/checkbox fields: Convert label text to value keys
      // AI often returns "Da" or "Ne" instead of "da"/"ne", causing form fields to appear empty
      hzzStructure.sections.forEach((section) => {
        if (section.key === '1') return // Skip section 1 (handled separately)

        const sectionData = generatedContent[section.key]
        if (!sectionData) return

        section.fields.forEach((field) => {
          const currentValue = sectionData[field.key]
          if (!currentValue) return

          // Handle text/textarea fields that got invalid simple responses
          if ((field.type === 'text' || field.type === 'textarea') && typeof currentValue === 'string') {
            const lowerValue = currentValue.toLowerCase().trim()

            // If text field contains only simple yes/no responses, clear it
            if (['da', 'ne', 'yes', 'no', 'y', 'n', '1', '0', 'true', 'false'].includes(lowerValue)) {
              console.warn(`[AI Generate] Text field ${field.key} got simple response "${currentValue}", clearing for user to fill`)
              sectionData[field.key] = ''
              return
            }
          }

          // Only process fields with options (radio, select, checkbox)
          if (!field.options || field.options.length === 0) return

          // Handle checkbox (array of values)
          if (field.type === 'checkbox') {
            if (Array.isArray(currentValue)) {
              sectionData[field.key] = currentValue.map((val: string) => {
                // Check if val matches a label instead of a value
                const matchingOption = field.options?.find((opt: any) =>
                  opt.label.toLowerCase() === val.toLowerCase()
                )
                return matchingOption ? matchingOption.value : val
              })
            }
          }
          // Handle radio and select (single value)
          else if (field.type === 'radio' || field.type === 'select') {
            if (typeof currentValue === 'string') {
              // First check if currentValue is already a valid option value
              const validValue = field.options?.find((opt: any) => opt.value === currentValue)
              if (validValue) {
                // Already correct, do nothing
                return
              }

              // Check if currentValue matches a label instead of a value
              const matchingOption = field.options?.find((opt: any) =>
                opt.label.toLowerCase() === currentValue.toLowerCase()
              )
              if (matchingOption) {
                sectionData[field.key] = matchingOption.value
                return
              }

              // Handle common AI mistakes - map invalid values to reasonable defaults
              const lowerValue = currentValue.toLowerCase().trim()

              // For yes/no questions, map various responses to "da" or "ne"
              if (field.options?.some((opt: any) => opt.value === 'da' || opt.value === 'ne')) {
                if (['da', 'yes', 'y', '1', 'true', 'potvrdan'].includes(lowerValue)) {
                  sectionData[field.key] = 'da'
                } else if (['ne', 'no', 'n', '0', 'false', 'negativan'].includes(lowerValue)) {
                  sectionData[field.key] = 'ne'
                } else if (['ne_mogu_procijeniti', 'ne mogu procijeniti', 'unclear', 'unknown'].includes(lowerValue)) {
                  // Check if this is a valid option for this field
                  const cannotEstimate = field.options?.find((opt: any) => opt.value === 'ne_mogu_procijeniti')
                  if (cannotEstimate) {
                    sectionData[field.key] = 'ne_mogu_procijeniti'
                  }
                }
              }

              // If still no match found, clear the field (better than invalid value)
              if (!field.options?.find((opt: any) => opt.value === sectionData[field.key])) {
                console.warn(`[AI Generate] Invalid value "${currentValue}" for field ${field.key}, clearing field`)
                sectionData[field.key] = ''
              }
            }
          }
        })
      })

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

      console.log('[AI Parser] Final complete data:', JSON.stringify(completeData, null, 2))
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

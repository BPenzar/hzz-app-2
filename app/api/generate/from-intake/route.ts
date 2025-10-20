import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import hzzStructure from '@/data/hzz-structure.json'
import { validateGeneratedSections } from '@/lib/validation/hzz'

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
  issues?: string[]
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

DETAILED SECTION-BY-SECTION GUIDELINES:

Section 3.1 - Personal Data:
- Generate realistic work experience entries with specific companies, positions, and timeframes
- Include both employment and freelance experience relevant to the business idea
- Use Croatian company names and industries where appropriate
- Show career progression and relevant skills

Section 3.2 - Business Subject:
- Write VERY detailed business motivation (400-500 words) with:
  * Personal journey and specific experiences that led to this business idea
  * Concrete examples from previous work with measurable results (percentages, savings, improvements)
  * Connection between past experience and future business opportunity
  * Professional qualifications and certifications relevant to the business
  * Specific market gaps identified through real interactions or research
- Provide extremely detailed product/service descriptions (300-400 words) including:
  * Specific features and benefits with examples
  * Step-by-step process descriptions
  * Concrete deliverables and outcomes for clients
  * Implementation methodology and tools used
  * Geographic scope and delivery methods

Section 3.3 - Investment Structure:
- Write VERY detailed explanations (200-300 words) for HZZ fund usage with:
  * Specific equipment names, models, and exact prices
  * Clear justification for why each item is essential for the business
  * Technical specifications relevant to the business operations
  * Expected ROI or productivity gains from each investment
- Include realistic investment sources (personal savings, loans, family support)
- Consider business location needs realistically - for digital businesses use "nije_potreban", for retail/services use "zakup" or "vlasnistvo"
- Provide detailed city/region operational descriptions (200+ words) including:
  * Specific areas of operation and target markets
  * Physical space requirements and solutions
  * Online vs offline service delivery methods
  * Scalability plans for geographic expansion
- Detail existing equipment with realistic brands and specifications

Section 3.4 - Market Analysis:
- Write detailed target customer analysis (250-300 words) including:
  * Specific customer segments with company sizes, industries, and demographics
  * Geographic distribution and market size estimates
  * Customer pain points and purchasing behavior
  * Seasonal factors and business cycles affecting demand
- Provide thorough market demand validation (200-250 words) with:
  * Evidence of market research conducted (conversations, surveys, observations)
  * Specific examples of customer interest or demand
  * Market trends and growth projections with sources
  * Quantified market opportunity assessments
- Write comprehensive competitor analysis (300-400 words) covering:
  * 3-4 specific competitor categories with named examples where possible
  * Detailed analysis of each competitor's strengths and weaknesses
  * Market share estimates and positioning
  * Pricing comparisons and service gaps
  * Clear differentiation strategy with concrete competitive advantages
- Describe detailed differentiation strategy (200-300 words) with:
  * Specific activities and approaches that set the business apart
  * Concrete examples of how services/products differ
  * Unique value propositions with measurable benefits
  * Implementation steps for competitive advantage

Section 3.5 & 3.6 - Financial Projections - BE CONSERVATIVE AND REALISTIC:
CRITICAL: New businesses rarely achieve high profits in year 1. Target net profit of 10,000-25,000€ maximum for first year.

Revenue Guidelines (be conservative):
- Price services at Croatian market rates (not premium pricing)
- Assume slow customer acquisition: 1-3 clients per month in year 1
- Average project values: 300-1,500€ for small businesses
- Total year 1 revenue should be 15,000-35,000€ maximum
- Year 2 can grow 30-50% if year 1 is successful

Cost Guidelines (be comprehensive):
- Include ALL real costs: insurance (300-500€/month), utilities, software subscriptions
- Marketing budget: 200-500€/month for new business
- Professional services (accounting, legal): 150-300€/month
- Equipment depreciation and maintenance costs
- Personal living costs if this is primary income source
- Realistic salary levels: 800-1000€ monthly for employees if hired

Target Financial Outcomes:
- Year 1 net profit: 8,000-20,000€ (this is realistic for a successful new business)
- Year 2 net profit: 15,000-35,000€ (with established client base)
- Profit margins: 25-40% are realistic for service businesses
- Never exceed 50% profit margin unless heavily justified

⚠️ CRITICAL FINANCIAL REALITY CHECK:
- If calculated net profit exceeds 30,000€ in year 1, REDUCE revenue or INCREASE costs
- New businesses in Croatia typically struggle to break even in year 1
- Be pessimistic rather than optimistic - underestimate revenue, overestimate costs
- Better to exceed conservative projections than fail to meet optimistic ones

CRITICAL PROFESSIONAL STANDARDS:
- Write as if you are an experienced Croatian business consultant with 15+ years of experience
- Use specific numbers, percentages, and market data relevant to Croatian economy
- Reference actual Croatian business conditions (startup costs, market sizes, growth rates)
- Demonstrate understanding of local competition and market dynamics
- Provide actionable implementation steps with realistic timelines
- Show awareness of seasonal factors, economic conditions, and industry trends
- Use professional business language throughout
- Support all claims with logical reasoning

CROATIAN MARKET CONTEXT (use these realistic parameters):
- Average gross salary in Croatia: €1,100-1,300 monthly (varies by sector)
- Minimum wage: €633 monthly gross
- Corporate tax rate: 20% (10% for small businesses under certain conditions)
- VAT rate: 25% (13% for certain services)
- Typical business insurance costs: €200-500 monthly
- Office rent in Zagreb: €8-15/sqm, other cities: €4-10/sqm
- Marketing budgets: typically 3-8% of revenue
- Croatian market size references: Zagreb (800k population), Split (170k), Rijeka (130k), Osijek (100k)
- Seasonal considerations: summer tourism boost, winter retail peak, agricultural cycles
- Digital adoption rates: 75% internet penetration, growing e-commerce sector
- EU market access advantages for export-oriented businesses

CONTENT EXAMPLES FOR QUALITY REFERENCE:
- Competitor analysis: "Glavni konkurenti uključuju XY d.o.o. (tržišni udjel 25%, fokus na korporativne klijente) i ABC obrt (lokalni lider s 15 godina iskustva). Naša konkurentska prednost leži u..."
- Market sizing: "Procjenjujemo da lokalno tržište u Zagrebu vrijedi €2.1M godišnje, s godišnjom stopom rasta od 8%. Naš cilj je osvajanje 3% tržišnog udjela u prvoj godini..."
- Implementation timeline: "Mjesec 1-2: Registracija i nabava opreme, Mjesec 3-4: Pilot program s 5 klijenata, Mjesec 5-6: Puno lansiranje i marketing kampanja..."
- Customer segments: "Primarni segment: mikro poduzeća 5-20 zaposlenika u IT sektoru (procjenjeno 350 tvrtki u Zagrebu), sekundarni segment: freelanceri i konsultanti..."

IMPORTANT - Radio/Select/Checkbox Values:
- For radio buttons and select fields, use the EXACT lowercase value keys (e.g., "da" not "Da", "ne" not "Ne")
- For checkbox arrays, use lowercase value keys (e.g., ["posjetnice", "drustvene_mreze"])
- NEVER use label text as values - always use the value keys from the options

CRITICAL - ALWAYS FILL THESE RADIO BUTTON FIELDS:
- "prostor_i_dozvole": "vlasnistvo", "zakup", or "nije_potreban" (based on business type)
- "dogovorena_suradnja": "da" or "ne_zasad" (most new businesses: "ne_zasad")
- "dogovorena_suradnja_pisani_dokaz": "da" or "ne_zasad" (follow dogovorena_suradnja)
- "znate_gdje_nabaviti_opremu": "da" (most businesses should know suppliers)
- "moguce_nabaviti_opremu_u_hrvatskoj": "rh" or "inozemstvo" (prefer "rh" unless specific reason)

CRITICAL - Table Field Structure (use exact column keys):
- prihodi tables: [{"naziv": "Naziv proizvoda/usluge", "cijena": 100, "broj_prodaja": 50, "mjesecni_prihod": 5000, "godisnji_prihod": 60000}]
  (mjesecni_prihod = cijena * broj_prodaja, godisnji_prihod = mjesecni_prihod * 12)
- trosak_rada tables: MUST include BOTH rows:
  [{"vrsta": "Bruto plaća ili doprinosi za obrtnike / RPO", "mjesecni_iznos": AMOUNT, "godisnji_iznos": AMOUNT*12},
   {"vrsta": "Bruto plaća za zaposlenike", "mjesecni_iznos": AMOUNT, "godisnji_iznos": AMOUNT*12}]
- ostali_troskovi tables: [{"naziv": "Marketing", "mjesecni_iznos": 500, "godisnji_iznos": 6000}]
  (godisnji_iznos = mjesecni_iznos * 12)
- radno_iskustvo_ugovor tables: [{"razdoblje": "2020-2023", "poslodavac": "Tvrtka d.o.o.", "zanimanje": "Opis poslova"}]
- radno_iskustvo_ostalo tables: [{"razdoblje": "2018-2020", "poslodavac": "Freelance", "zanimanje": "Opis poslova"}]
- ulaganja_drugi_izvori tables: [{"vrsta_ulaganja": "Osobni kapital", "iznos": 10000}]
- postojeca_oprema tables: [{"naziv": "Osobni automobil"}]
- troskovnik tables: MUST include ALL 6 categories exactly as shown:
  [{"vrsta_troska": "Fiksni iznos potpore", "iznos": 5000},
   {"vrsta_troska": "Kupnja nove opreme neophodne za obavljanje djelatnosti - alati/strojevi/tehnika", "iznos": AMOUNT},
   {"vrsta_troska": "Kupnja nove opreme neophodne za obavljanje djelatnosti - informatička oprema", "iznos": AMOUNT},
   {"vrsta_troska": "Kupnja nove opreme neophodne za obavljanje djelatnosti - ostala oprema", "iznos": AMOUNT},
   {"vrsta_troska": "Kupnja ili zakup licenciranih IT programa", "iznos": AMOUNT},
   {"vrsta_troska": "Kupnja franšiza", "iznos": AMOUNT}]
- NEVER return string values for table fields - always use array of objects with these exact keys

CRITICAL - HZZ COMPLIANCE REQUIREMENT:
- Section 4 "Troškovnik" total must match the requested amount from intake data
- The sum of all "iznos" values in the troskovnik table MUST EQUAL the "iznos_trazene_potpore" amount
- Use the fixed troskovnik categories and distribute the total amount across them logically
- Ensure "Fiksni iznos potpore" is always 5000€, distribute remaining amount across other categories
- Example: If requested amount is 25000€, troskovnik should total exactly 25000€ (5000€ fixed + 20000€ distributed)

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
        temperature: 0.5,
        max_tokens: 16000,
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
            const tableType = (field as any).tableType || 'default'

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
          const fieldOptions = (field as any).options
          if (!fieldOptions || fieldOptions.length === 0) return

          // Handle checkbox (array of values)
          if (field.type === 'checkbox') {
            if (Array.isArray(currentValue)) {
              sectionData[field.key] = currentValue.map((val: string) => {
                // Check if val matches a label instead of a value
                const matchingOption = fieldOptions?.find((opt: any) =>
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
              const validValue = fieldOptions?.find((opt: any) => opt.value === currentValue)
              if (validValue) {
                // Already correct, do nothing
                return
              }

              // Check if currentValue matches a label instead of a value
              const matchingOption = fieldOptions?.find((opt: any) =>
                opt.label.toLowerCase() === currentValue.toLowerCase()
              )
              if (matchingOption) {
                sectionData[field.key] = matchingOption.value
                return
              }

              // Handle common AI mistakes - map invalid values to reasonable defaults
              const lowerValue = currentValue.toLowerCase().trim()

              // For yes/no questions, map various responses to "da" or "ne"
              if (fieldOptions?.some((opt: any) => opt.value === 'da' || opt.value === 'ne')) {
                if (['da', 'yes', 'y', '1', 'true', 'potvrdan'].includes(lowerValue)) {
                  sectionData[field.key] = 'da'
                } else if (['ne', 'no', 'n', '0', 'false', 'negativan'].includes(lowerValue)) {
                  sectionData[field.key] = 'ne'
                } else if (['ne_mogu_procijeniti', 'ne mogu procijeniti', 'unclear', 'unknown'].includes(lowerValue)) {
                  // Check if this is a valid option for this field
                  const cannotEstimate = fieldOptions?.find((opt: any) => opt.value === 'ne_mogu_procijeniti')
                  if (cannotEstimate) {
                    sectionData[field.key] = 'ne_mogu_procijeniti'
                  }
                }
              }

              // If still no match found, clear the field (better than invalid value)
              if (!fieldOptions?.find((opt: any) => opt.value === sectionData[field.key])) {
                console.warn(`[AI Generate] Invalid value "${currentValue}" for field ${field.key}, clearing field`)
                sectionData[field.key] = ''
              }
            }
          }
        })
      })

      const validationResult = validateGeneratedSections(generatedContent)

      if (!validationResult.success) {
        console.warn(
          '[AI Validation] Generated data failed schema validation:',
          validationResult.issues
        )
        return NextResponse.json(
          {
            success: false,
            error: 'AI generirani podaci nisu prošli validaciju. Pokušajte ponovno.',
            issues: validationResult.issues,
          } as GenerateResponse,
          { status: 422 }
        )
      }

      const sanitizedSections = validationResult.data

      // Merge Section 2: Use pre-populated data + AI-generated NKD
      const sanitizedSection2 = sanitizedSections['2'] || {}
      const nkdFromAI =
        Array.isArray((sanitizedSection2 as Record<string, unknown>).nkd) &&
        (sanitizedSection2 as Record<string, any>).nkd
          ? (sanitizedSection2 as Record<string, any>).nkd
          : nkdData
      const mergedSection2 = {
        ...section2Data,
        nkd: nkdFromAI,
      }

      // Add Section 1 and 2 with pre-populated data, plus AI-generated sections 3-5
      const completeData = {
        '1': section1Data,
        '2': mergedSection2,
        ...Object.fromEntries(
          Object.entries(sanitizedSections).filter(([key]) => key !== '2')
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

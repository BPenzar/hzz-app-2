import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import hzzExamples from '@/data/hzz-examples.json';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Feature flags
const USE_N8N_FALLBACK = process.env.USE_N8N_GENERATE === 'true';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Types
interface GenerateRequest {
  app_id: string;
  idea: string;
  section?: string; // Optional: generate single section or full app
}

interface GenerateResponse {
  success: boolean;
  data?: any;
  source?: 'openai' | 'n8n';
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

// System prompt for HZZ application generation
const SYSTEM_PROMPT = `You are an expert at generating Croatian HZZ (Hrvatski zavod za zapošljavanje) business applications for self-employment support.

Your task:
1. You will receive a JSON template with example fields and a business idea description
2. Rewrite ALL string values to match the business idea while keeping the EXACT same JSON structure
3. Keep all keys identical - do not add, remove, or rename any keys
4. Preserve formatting (newlines, tables, bullet points)
5. Write in Croatian language
6. Be specific and professional
7. Return ONLY valid JSON, no markdown, no explanations

Important:
- If a field is about costs/budget, use realistic numbers for Croatia
- If a field is about timeline, use realistic Croatian business registration timelines
- If a field is about legal structure, use Croatian business entity types (obrt, j.d.o.o., etc.)
- Keep the tone professional but approachable
- Preserve table formatting (use | separators for tables)
- Keep numerical data realistic for Croatian market`;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GenerateRequest = await request.json();
    
    // Validation
    if (!body.app_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: app_id' },
        { status: 400 }
      );
    }

    if (!body.idea) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: idea' },
        { status: 400 }
      );
    }

    console.log(`[AI Generate] Starting generation for app_id: ${body.app_id}`);

    // Use hzz-examples.json as the base template
    const template = body.section 
      ? (hzzExamples as any)[body.section]  // Generate single section
      : hzzExamples;                        // Generate full application

    if (!template) {
      return NextResponse.json(
        { success: false, error: `Invalid section: ${body.section}` },
        { status: 400 }
      );
    }

    // PRIMARY: Direct OpenAI API call
    try {
      const startTime = Date.now();

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Business Idea: ${body.idea}\n\nBase Template (DO NOT change keys, only values):\n${JSON.stringify(template, null, 2)}\n\nGenerate a complete HZZ application for this business idea. Rewrite all string values to match the business concept while keeping the exact JSON structure.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const latency = Date.now() - startTime;
      console.log(`[AI Generate] OpenAI completion in ${latency}ms`);

      // Parse generated content
      const generatedContent = JSON.parse(
        completion.choices[0].message.content || '{}'
      );

      // Validate structure (ensure all keys from template exist)
      const templateKeys = Object.keys(template);
      const generatedKeys = Object.keys(generatedContent);
      
      const missingKeys = templateKeys.filter(k => !generatedKeys.includes(k));
      if (missingKeys.length > 0) {
        console.warn(`[AI Generate] Missing keys in generated content: ${missingKeys.join(', ')}`);
        
        // Fill missing keys with empty strings
        missingKeys.forEach(key => {
          generatedContent[key] = '';
        });
      }

      // Return successful response
      return NextResponse.json({
        success: true,
        data: generatedContent,
        source: 'openai',
        usage: {
          prompt_tokens: completion.usage?.prompt_tokens || 0,
          completion_tokens: completion.usage?.completion_tokens || 0,
          total_tokens: completion.usage?.total_tokens || 0,
        },
      } as GenerateResponse);

    } catch (openaiError) {
      console.error('[AI Generate] OpenAI API error:', openaiError);

      // FALLBACK: n8n webhook (if enabled)
      if (USE_N8N_FALLBACK && N8N_WEBHOOK_URL) {
        console.log('[AI Generate] Falling back to n8n webhook...');
        
        try {
          const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idea: body.idea,
              template: template,
            }),
          });

          if (!n8nResponse.ok) {
            throw new Error(`n8n webhook failed with status ${n8nResponse.status}`);
          }

          const n8nData = await n8nResponse.json();
          
          console.log('[AI Generate] n8n fallback successful');

          return NextResponse.json({
            success: true,
            data: n8nData,
            source: 'n8n',
          } as GenerateResponse);

        } catch (n8nError) {
          console.error('[AI Generate] n8n fallback error:', n8nError);
          throw new Error('Both OpenAI and n8n fallback failed');
        }
      }

      // No fallback available, throw original error
      throw openaiError;
    }

  } catch (error) {
    console.error('[AI Generate] Unhandled error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      } as GenerateResponse,
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    service: 'HZZ-App AI Generation',
    status: 'operational',
    primary: 'OpenAI API',
    fallback: USE_N8N_FALLBACK ? 'n8n enabled' : 'n8n disabled',
    template_source: 'data/hzz-examples.json',
  });
}
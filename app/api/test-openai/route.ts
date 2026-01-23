import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')

    // Extract OPENAI_API_KEY
    const match = envContent.match(/OPENAI_API_KEY=(.+)/)
    const apiKey = match ? match[1].trim() : null

    console.log('=== OpenAI API Test (Direct File Read) ===')
    console.log('API Key exists:', !!apiKey)
    console.log('API Key first 30 chars:', apiKey?.substring(0, 30))
    console.log('API Key last 30 chars:', apiKey?.substring(apiKey.length - 30))
    console.log('API Key length:', apiKey?.length)

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY not found in environment',
      })
    }

    // Initialize client
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Simple test call
    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, API key works!"',
        },
      ],
      max_completion_tokens: 20,
    })

    return NextResponse.json({
      success: true,
      message: 'API key is valid!',
      response: response.choices[0].message.content,
      apiKeyPrefix: apiKey.substring(0, 20),
    })
  } catch (error) {
    const err = error as {
      message?: string
      status?: number
      type?: string
      code?: string
    }
    console.error('OpenAI Test Error:', error)

    return NextResponse.json({
      success: false,
      error: err.message,
      status: err.status,
      type: err.type,
      code: err.code,
    }, { status: 500 })
  }
}

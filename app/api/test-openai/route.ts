import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

export async function GET() {
  try {
    // BYPASS shell environment - read directly from .env.local
    const fs = require('fs')
    const path = require('path')

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
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, API key works!"',
        },
      ],
      max_tokens: 20,
    })

    return NextResponse.json({
      success: true,
      message: 'API key is valid!',
      response: response.choices[0].message.content,
      apiKeyPrefix: apiKey.substring(0, 20),
    })
  } catch (error: any) {
    console.error('OpenAI Test Error:', error)

    return NextResponse.json({
      success: false,
      error: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
    }, { status: 500 })
  }
}

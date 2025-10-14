import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY

  return NextResponse.json({
    hasKey: !!apiKey,
    length: apiKey?.length || 0,
    first20: apiKey?.substring(0, 20) || '',
    last20: apiKey?.substring(apiKey.length - 20) || '',
  })
}

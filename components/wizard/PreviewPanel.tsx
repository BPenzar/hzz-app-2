'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText } from 'lucide-react'

interface PreviewPanelProps {
  data: Record<string, any>
}

export function PreviewPanel({ data }: PreviewPanelProps) {
  const hasData = Object.keys(data).length > 0

  return (
    <Card className="sticky top-24 h-[calc(100vh-8rem)]">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Pregled
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          {!hasData ? (
            <div className="text-center text-gray-500 py-8">
              <p>Popunite formu da vidite pregled</p>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              {Object.entries(data).map(([sectionKey, sectionData]) => (
                <div key={sectionKey} className="border-b pb-4">
                  <h3 className="font-semibold mb-2 text-primary">Sekcija {sectionKey}</h3>
                  {typeof sectionData === 'object' && sectionData !== null ? (
                    <div className="space-y-2">
                      {Object.entries(sectionData as Record<string, any>).map(([key, value]) => {
                        if (value && String(value).trim()) {
                          return (
                            <div key={key} className="pl-4">
                              <span className="text-gray-600 text-xs uppercase">{key}:</span>
                              <p className="text-gray-900 whitespace-pre-wrap">{String(value)}</p>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

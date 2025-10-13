'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Column {
  key: string
  label: string
  type?: 'text' | 'number'
  editable?: boolean
  calculate?: (row: Record<string, any>) => number
}

interface DynamicTableProps {
  id: string
  label: string
  columns: Column[]
  value: any[]
  onChange: (value: any[]) => void
  required?: boolean
  helpText?: string
  showTotal?: boolean
  addButtonText?: string
}

export function DynamicTable({
  id,
  label,
  columns,
  value = [],
  onChange,
  required = false,
  helpText,
  showTotal = false,
  addButtonText = 'Dodaj novi red',
}: DynamicTableProps) {
  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : []
  const addRow = () => {
    const newRow: Record<string, any> = {}
    columns.forEach((col) => {
      newRow[col.key] = col.type === 'number' ? 0 : ''
    })
    onChange([...safeValue, newRow])
  }

  const removeRow = (index: number) => {
    const newValue = safeValue.filter((_, i) => i !== index)
    onChange(newValue)
  }

  const updateCell = (rowIndex: number, columnKey: string, cellValue: any) => {
    const newValue = [...safeValue]
    newValue[rowIndex] = {
      ...newValue[rowIndex],
      [columnKey]: cellValue,
    }

    // Recalculate calculated fields
    columns.forEach((col) => {
      if (col.calculate) {
        newValue[rowIndex][col.key] = col.calculate(newValue[rowIndex])
      }
    })

    onChange(newValue)
  }

  const calculateTotal = (columnKey: string): number => {
    return safeValue.reduce((sum, row) => {
      const val = parseFloat(row[columnKey]) || 0
      return sum + val
    }, 0)
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {helpText && <p className="text-sm text-gray-500">{helpText}</p>}

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeValue.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center text-gray-500 py-8"
                >
                  Nema unesenih redova. Kliknite "Dodaj novi red" za početak.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {safeValue.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.editable === false || col.calculate ? (
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                            {col.calculate
                              ? col.calculate(row).toFixed(2)
                              : row[col.key]}
                          </div>
                        ) : (
                          <Input
                            type={col.type || 'text'}
                            value={row[col.key] || ''}
                            onChange={(e) =>
                              updateCell(rowIndex, col.key, e.target.value)
                            }
                            className="h-9"
                          />
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {showTotal && (
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell>Ukupno</TableCell>
                    {columns.slice(1).map((col) => (
                      <TableCell key={col.key}>
                        {col.type === 'number'
                          ? calculateTotal(col.key).toFixed(2)
                          : ''}
                      </TableCell>
                    ))}
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <Button
        type="button"
        onClick={addRow}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        {addButtonText}
      </Button>
    </div>
  )
}

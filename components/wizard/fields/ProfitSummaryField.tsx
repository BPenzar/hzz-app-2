'use client'

import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProfitSummaryFieldProps {
  id: string
  label: string
  data: Record<string, any>
  required?: boolean
  helpText?: string
}

export function ProfitSummaryField({
  id,
  label,
  data,
  required = false,
  helpText,
}: ProfitSummaryFieldProps) {
  // Calculate totals from income tables (3.5)
  const calculateIncomeTotal = (year: 1 | 2) => {
    const tableKey = year === 1 ? 'tablica_prihodi_god1_T2_1' : 'tablica_prihodi_god2_T2_2'
    const rows = data['3.5']?.[tableKey] || []

    return rows.reduce((total: number, row: any) => {
      const godisnji = parseFloat(row.godisnji_prihod) || 0
      return total + godisnji
    }, 0)
  }

  // Calculate labor costs from tables (3.6)
  const calculateLaborCosts = (year: 1 | 2) => {
    const tableKey = year === 1 ? 'trosak_rada_god1_T3_1' : 'trosak_rada_god2_T3_2'
    const rows = data['3.6']?.[tableKey] || []

    return rows.reduce((total: number, row: any) => {
      const godisnji = parseFloat(row.godisnji_iznos) || 0
      return total + godisnji
    }, 0)
  }

  // Calculate other costs from tables (3.6)
  const calculateOtherCosts = (year: 1 | 2) => {
    const tableKey = year === 1 ? 'ostali_troskovi_god1_T4_1' : 'ostali_troskovi_god2_T4_2'
    const rows = data['3.6']?.[tableKey] || []

    return rows.reduce((total: number, row: any) => {
      const godisnji = parseFloat(row.godisnji_iznos) || 0
      return total + godisnji
    }, 0)
  }

  const income1 = calculateIncomeTotal(1)
  const income2 = calculateIncomeTotal(2)

  const laborCosts1 = calculateLaborCosts(1)
  const laborCosts2 = calculateLaborCosts(2)

  const otherCosts1 = calculateOtherCosts(1)
  const otherCosts2 = calculateOtherCosts(2)

  const totalCosts1 = laborCosts1 + otherCosts1
  const totalCosts2 = laborCosts2 + otherCosts2

  const profitBeforeTax1 = income1 - totalCosts1
  const profitBeforeTax2 = income2 - totalCosts2

  // Calculate tax (20%) - "Porez na dobit"
  const tax1 = profitBeforeTax1 * 0.20
  const tax2 = profitBeforeTax2 * 0.20

  // Net profit after tax
  const netProfit1 = profitBeforeTax1 - tax1
  const netProfit2 = profitBeforeTax2 - tax2

  const formatNumber = (num: number) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={id}>
        {label}
      </Label>

      {helpText && <p className="text-sm text-gray-500">{helpText}</p>}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        <p className="text-sm text-blue-900">
          <strong>Napomena:</strong> Podaci u ovoj tablici se automatski izračunavaju na temelju
          podataka iz tablica 2.1, 2.2, 3.1, 3.2, 4.1 i 4.2. koji prikazuju očekivane
          godišnje prihode te tablica 3.1, 3.2, 4.1 i 4.2 u okviru kojih ste naznačili
          ukupne godišnje troškove poslovanja. Neto dobit je Vaša zarada nakon što odbijete sve troškove
          poslovanja i nakon što je odbijena svi porezni i zakonski porezni oblici registracije
          (obrti, trgovačka društva, samostalne djelatnosti i sl.).
        </p>
        <p className="text-sm text-blue-900 mt-2 italic">
          U svrhu izračuna koristi se okvirna porezna stopa od 20% i ne predstavlja nužno jednu od trenutno važećih zakonskih poreznih stopa. Redak 4. popunjavaju svi podnositelji zahtjeva bez
          obzira na planiranu pravni oblik registracije (obrti, trgovačka društva, samostalne djelatnosti i sl.)
        </p>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]"></TableHead>
              <TableHead className="text-center">Prva godina poslovanja</TableHead>
              <TableHead className="text-center">Druga godina poslovanja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                Godišnji prihodi od prodaje (tablica 2.1. i 2.2.)
              </TableCell>
              <TableCell className="text-center bg-gray-50">
                {formatNumber(income1)}
              </TableCell>
              <TableCell className="text-center bg-gray-50">
                {formatNumber(income2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Ukupni godišnji troškovi (tablica 3.1. i 3.2. + 4.1. i 4.2.)
              </TableCell>
              <TableCell className="text-center bg-gray-50">
                {formatNumber(totalCosts1)}
              </TableCell>
              <TableCell className="text-center bg-gray-50">
                {formatNumber(totalCosts2)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-yellow-50">
              <TableCell className="font-semibold">
                Očekivana dobit prije oporezivanja (redak 1. umanjiti za redak 2.)
              </TableCell>
              <TableCell className="text-center font-semibold">
                {formatNumber(profitBeforeTax1)}
              </TableCell>
              <TableCell className="text-center font-semibold">
                {formatNumber(profitBeforeTax2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Porez na dobit (redak 3. pomnožiti s 0,20)
              </TableCell>
              <TableCell className="text-center bg-gray-50">
                {formatNumber(tax1)}
              </TableCell>
              <TableCell className="text-center bg-gray-50">
                {formatNumber(tax2)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-green-50 font-bold">
              <TableCell className="font-bold">
                Očekivana neto dobit (redak 3. umanjiti za redak 4.)
              </TableCell>
              <TableCell className="text-center font-bold text-green-700">
                {formatNumber(netProfit1)}
              </TableCell>
              <TableCell className="text-center font-bold text-green-700">
                {formatNumber(netProfit2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold">
            Moja očekivana neto dobit (zarada) u prvoj godini poslovanja iznosi
          </Label>
          <div className="flex-1 border-b border-gray-300 mx-2"></div>
          <span className="font-bold text-lg">{formatNumber(netProfit1)} €</span>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold">
            Moja očekivana neto dobit (zarada) u drugoj godini poslovanja iznosi
          </Label>
          <div className="flex-1 border-b border-gray-300 mx-2"></div>
          <span className="font-bold text-lg">{formatNumber(netProfit2)} €</span>
        </div>
      </div>
    </div>
  )
}

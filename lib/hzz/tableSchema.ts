import type { Json } from '@/types/supabase'

export const TABLE_COLUMN_ORDER: Record<string, string[]> = {
  prihodi: ['naziv', 'cijena', 'broj_prodaja', 'mjesecni_prihod', 'godisnji_prihod'],
  trosak_rada: ['vrsta', 'mjesecni_iznos', 'godisnji_iznos'],
  ostali_troskovi: ['naziv', 'mjesecni_iznos', 'godisnji_iznos'],
  struktura_vlasnistva: ['ime_prezime', 'udio'],
  nkd_lista: ['nkd_kod', 'naziv_djelatnosti'],
  nkd_lista_simple: ['nkd_djelatnost'],
  radno_iskustvo_ugovor: ['razdoblje', 'poslodavac', 'zanimanje'],
  radno_iskustvo_ostalo: ['razdoblje', 'poslodavac', 'zanimanje'],
  ulaganja_drugi_izvori: ['vrsta_ulaganja', 'iznos'],
  postojeca_oprema: ['naziv'],
  troskovnik: ['vrsta_troska', 'iznos'],
  izracun_dobiti: ['godina', 'prihodi', 'troskovi', 'dobit'],
}

export const TABLE_COLUMN_LABELS: Record<string, string> = {
  naziv: 'Naziv',
  godina: 'Godina',
  cijena: 'Cijena',
  broj_prodaja: 'Broj prodaja',
  mjesecni_prihod: 'Mjesečni prihod',
  godisnji_prihod: 'Godišnji prihod',
  vrsta: 'Vrsta',
  mjesecni_iznos: 'Mjesečni iznos',
  godisnji_iznos: 'Godišnji iznos',
  vrsta_troska: 'Vrsta troška',
  iznos: 'Iznos',
  prihodi: 'Ukupni prihodi (€)',
  troskovi: 'Ukupni troškovi (€)',
  dobit: 'Očekivana dobit (€)',
  razdoblje: 'Razdoblje',
  poslodavac: 'Poslodavac',
  zanimanje: 'Zanimanje',
  vrsta_ulaganja: 'Vrsta ulaganja',
  ime_prezime: 'Ime i prezime',
  udio: 'Udio (%)',
  nkd_kod: 'NKD kod',
  naziv_djelatnosti: 'Naziv djelatnosti',
  nkd_djelatnost: 'NKD kod i naziv djelatnosti',
}

export const resolveTableColumns = (tableType: string, rows: Json[]): string[] => {
  if (!Array.isArray(rows) || rows.length === 0) return []

  const firstRow = rows.find((row) => row && typeof row === 'object' && !Array.isArray(row))
  if (!firstRow) return []

  const rawColumns = Object.keys(firstRow as Record<string, unknown>)
  const columnsWithData = rawColumns.filter((key) =>
    rows.some((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return false
      const value = (row as Record<string, unknown>)[key]
      return value !== null && value !== undefined && String(value).trim() !== ''
    })
  )

  const orderedColumns = TABLE_COLUMN_ORDER[tableType]
  if (!orderedColumns || orderedColumns.length === 0) {
    return columnsWithData
  }

  const existingSet = new Set(columnsWithData)
  return [
    ...orderedColumns.filter((col) => existingSet.has(col)),
    ...columnsWithData.filter((col) => !orderedColumns.includes(col)),
  ]
}

'use client'

import { DynamicTable } from './DynamicTable'

interface TableFieldProps {
  id: string
  label: string
  value: any
  onChange: (value: any) => void
  tableType: string
  required?: boolean
  helpText?: string
  showTotal?: boolean
}

// Define table configurations based on tableType
const getTableConfig = (tableType: string) => {
  switch (tableType) {
    case 'prihodi':
      return {
        columns: [
          { key: 'naziv', label: 'Naziv proizvoda/usluge', type: 'text' as const },
          {
            key: 'cijena',
            label: 'Cijena pojedinog proizvoda/usluge',
            type: 'number' as const,
          },
          {
            key: 'broj_prodaja',
            label: 'Broj očekivanih prodaja u jednom mjesecu',
            type: 'number' as const,
          },
          {
            key: 'mjesecni_prihod',
            label: 'Očekivani mjesečni prihod od prodaje',
            type: 'number' as const,
            editable: false,
            calculate: (row: any) =>
              (parseFloat(row.cijena) || 0) * (parseFloat(row.broj_prodaja) || 0),
          },
          {
            key: 'godisnji_prihod',
            label: 'Očekivani godišnji prihod od prodaje',
            type: 'number' as const,
            editable: false,
            calculate: (row: any) => {
              const mjesecni =
                (parseFloat(row.cijena) || 0) * (parseFloat(row.broj_prodaja) || 0)
              return mjesecni * 12
            },
          },
        ],
      }

    case 'trosak_rada':
      return {
        columns: [
          {
            key: 'vrsta',
            label: 'Trošak rada',
            type: 'text' as const,
            editable: false,
          },
          { key: 'mjesecni_iznos', label: 'Mjesečni iznos', type: 'number' as const },
          {
            key: 'godisnji_iznos',
            label: 'Godišnji iznos',
            type: 'number' as const,
            editable: false,
            calculate: (row: any) => (parseFloat(row.mjesecni_iznos) || 0) * 12,
          },
        ],
        initialRows: [
          { vrsta: 'Bruto plaća ili doprinosi za obrtnike / RPO', mjesecni_iznos: 0 },
          { vrsta: 'Bruto plaća za zaposlenike', mjesecni_iznos: 0 },
        ],
      }

    case 'ostali_troskovi':
      return {
        columns: [
          { key: 'naziv', label: 'Ostali troškovi', type: 'text' as const },
          { key: 'mjesecni_iznos', label: 'Iznos mjesečni', type: 'number' as const },
          {
            key: 'godisnji_iznos',
            label: 'Iznos godišnji',
            type: 'number' as const,
            editable: false,
            calculate: (row: any) => (parseFloat(row.mjesecni_iznos) || 0) * 12,
          },
        ],
      }

    case 'struktura_vlasnistva':
      return {
        columns: [
          { key: 'ime_prezime', label: 'Ime i prezime', type: 'text' as const },
          { key: 'udio', label: 'Postotak', type: 'number' as const },
        ],
      }

    case 'nkd_lista':
      return {
        columns: [
          { key: 'nkd_kod', label: 'NKD kod', type: 'text' as const },
          { key: 'naziv_djelatnosti', label: 'Naziv djelatnosti', type: 'text' as const },
        ],
      }

    case 'nkd_lista_simple':
      return {
        columns: [
          { key: 'nkd_djelatnost', label: 'NKD kod i naziv djelatnosti', type: 'text' as const },
        ],
      }

    case 'radno_iskustvo_ugovor':
      return {
        columns: [
          { key: 'razdoblje', label: 'Razdoblje zaposlenja', type: 'text' as const },
          { key: 'poslodavac', label: 'Poslodavac', type: 'text' as const },
          { key: 'zanimanje', label: 'Zanimanje - opis poslova', type: 'text' as const },
        ],
      }

    case 'radno_iskustvo_ostalo':
      return {
        columns: [
          { key: 'razdoblje', label: 'Razdoblje zaposlenja', type: 'text' as const },
          { key: 'poslodavac', label: 'Poslodavac', type: 'text' as const },
          { key: 'zanimanje', label: 'Zanimanje - opis poslova', type: 'text' as const },
        ],
      }

    case 'ulaganja_drugi_izvori':
      return {
        columns: [
          { key: 'vrsta_ulaganja', label: 'Vrsta ulaganja', type: 'text' as const },
          { key: 'iznos', label: 'Iznos', type: 'number' as const },
        ],
      }

    case 'postojeca_oprema':
      return {
        columns: [
          { key: 'naziv', label: 'Postojeća oprema/prijevozna sredstva', type: 'text' as const },
        ],
      }

    case 'troskovnik':
      return {
        columns: [
          { key: 'vrsta_troska', label: 'Vrsta troška', type: 'text' as const, editable: false },
          { key: 'iznos', label: 'Iznos bez PDV-a', type: 'number' as const },
        ],
        initialRows: [
          { vrsta_troska: 'Fiksni iznos potpore', iznos: 5000 },
          {
            vrsta_troska:
              'Kupnja nove opreme neophodne za obavljanje djelatnosti - alati/strojevi/tehnika',
            iznos: 0,
          },
          {
            vrsta_troska:
              'Kupnja nove opreme neophodne za obavljanje djelatnosti - informatička oprema',
            iznos: 0,
          },
          {
            vrsta_troska:
              'Kupnja nove opreme neophodne za obavljanje djelatnosti - ostala oprema',
            iznos: 0,
          },
          { vrsta_troska: 'Kupnja ili zakup licenciranih IT programa', iznos: 0 },
          { vrsta_troska: 'Kupnja franšiza', iznos: 0 },
        ],
      }

    case 'izracun_dobiti':
      return {
        columns: [
          { key: 'godina', label: 'Godina', type: 'text' as const, editable: false },
          { key: 'prihodi', label: 'Ukupni prihodi (€)', type: 'number' as const },
          { key: 'troskovi', label: 'Ukupni troškovi (€)', type: 'number' as const },
          {
            key: 'dobit',
            label: 'Očekivana dobit/dohodak (€)',
            type: 'number' as const,
            editable: false,
            calculate: (row: any) =>
              (parseFloat(row.prihodi) || 0) - (parseFloat(row.troskovi) || 0),
          },
        ],
        initialRows: [
          { godina: 'Prva godina poslovanja', prihodi: 0, troskovi: 0 },
          { godina: 'Druga godina poslovanja', prihodi: 0, troskovi: 0 },
        ],
      }

    default:
      return {
        columns: [
          { key: 'col1', label: 'Kolona 1', type: 'text' as const },
          { key: 'col2', label: 'Kolona 2', type: 'text' as const },
        ],
      }
  }
}

export function TableField({
  id,
  label,
  value,
  onChange,
  tableType,
  required = false,
  helpText,
  showTotal = false,
}: TableFieldProps) {
  const config = getTableConfig(tableType)

  // Migrate string data to array format (for NKD field)
  let migratedValue = value
  if (typeof value === 'string' && value.trim() !== '') {
    // Split by newlines and create array of objects
    const lines = value.split('\n').filter(line => line.trim() !== '')
    migratedValue = lines.map(line => ({
      nkd_djelatnost: line.trim()
    }))
    // Trigger onChange to save migrated data
    setTimeout(() => onChange(migratedValue), 0)
  }

  // Initialize with default rows if provided and value is empty
  const initialValue =
    !migratedValue || (Array.isArray(migratedValue) && migratedValue.length === 0)
      ? config.initialRows || []
      : migratedValue

  return (
    <DynamicTable
      id={id}
      label={label}
      columns={config.columns}
      value={initialValue}
      onChange={onChange}
      required={required}
      helpText={helpText}
      showTotal={showTotal}
    />
  )
}

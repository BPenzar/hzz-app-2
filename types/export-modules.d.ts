declare module 'html2pdf.js' {
  const html2pdf: any
  export default html2pdf
}

declare module 'html-docx-js/dist/html-docx' {
  const htmlDocx: {
    asBlob(html: string, options?: any): Blob
  }
  export default htmlDocx
}

declare module 'docx' {
  export interface ParagraphChild {
    text?: string
  }

  export class TextRun {
    constructor(options: {
      text: string
      bold?: boolean
      size?: number
      font?: string
    })
  }

  export class Paragraph {
    constructor(options: {
      children: ParagraphChild[]
      heading?: string
      spacing?: {
        before?: number
        after?: number
      }
    })
  }

  export class Table {
    constructor(options: {
      rows: TableRow[]
      width?: {
        size: number
        type: string
      }
    })
  }

  export class TableRow {
    constructor(options: {
      children: TableCell[]
    })
  }

  export class TableCell {
    constructor(options: {
      children: Paragraph[]
      width?: {
        size: number
        type: string
      }
    })
  }

  export class Document {
    constructor(options: {
      sections: Section[]
    })
  }

  export class Section {
    constructor(options: {
      children: (Paragraph | Table)[]
      properties?: {
        page?: {
          margin?: {
            top?: number
            right?: number
            bottom?: number
            left?: number
          }
        }
      }
    })
  }

  export class Packer {
    static toBlob(doc: Document): Promise<Blob>
  }
}

declare module 'file-saver' {
  export function saveAs(blob: Blob, filename: string): void
}

# HZZ-App

Automatska priprema HZZ zahtjeva za samozapošljavanje uz AI podršku.

## 🚀 Značajke

- **AI generiranje iz intake upitnika** - `/api/generate/from-intake` generira sekcije 3–5 i validira izlaz
- **Full-template AI generiranje** - `/api/generate/proposal` koristi `data/hzz-examples.json`
- **Multi-step wizard** - Dinamički generirane forme iz `data/hzz-structure.json`
- **Real-time validacija** - Normalizacija opcija i tipova preko `lib/validation/hzz.ts`
- **Autosave** - Automatsko spremanje promjena (intake 1.5s, wizard 2s)
- **Preview panel** - Pregled unosa + izračun dobiti u sekciji 3.7
- **PDF i DOCX export** - Klijentski generirani dokumenti + spremanje u Supabase Storage (`generated_documents`)
- **Dashboard** - Upravljanje i praćenje više prijava

## 📋 Tech Stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript
- **UI:** Shadcn UI, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** OpenAI API (gpt-4o-mini)
- **PDF/DOCX:** `html2pdf.js`, `docx`

## 🛠️ Setup

### 1. Instalacija dependencies

```bash
npm install
```

### 2. Supabase Setup

```bash
# Pokreni Supabase lokalno
npm run supabase:start

# Primijeni migracije
npm run supabase:push
```

### 3. Environment Variables

Kopiraj `.env.example` u `.env.local` i popuni:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Pokreni Development Server

```bash
npm run dev
```

Otvori `http://localhost:3000`

## 📁 Struktura Projekta

```
hzz-app-2/
├── app/
│   ├── api/generate/from-intake/ # Intake → AI generiranje sekcija 3–5
│   ├── api/generate/proposal/    # Full-template AI generiranje
│   ├── auth/                     # Autentifikacija
│   ├── dashboard/                # Dashboard stranica
│   ├── applications/[id]/        # Wizard forma
│   └── page.tsx                  # Landing page
├── components/
│   ├── auth/                     # Auth komponente
│   ├── dashboard/                # Dashboard komponente
│   ├── wizard/                   # Intake + wizard + preview
│   └── ui/                       # Shadcn UI komponente
├── data/                         # 🔴 KRITIČNO - HZZ data files
│   ├── hzz-structure.json        # Definicija forme
│   ├── hzz-questions.json        # Help text i labele
│   └── hzz-examples.json         # AI template (NE MIJENJAJ!)
├── lib/
│   ├── supabase/                 # Supabase klijent
│   ├── validation/hzz.ts         # Validacija + sanitizacija AI outputa
│   └── hzz/tableSchema.ts        # Kolone i labeli za tablice
├── types/
│   └── supabase.ts               # TypeScript tipovi
└── supabase/
    ├── config.toml
    └── migrations/               # Database schema
```

## 🔴 Važno - Data Files

### 1. `data/hzz-structure.json`
- Definira strukturu wizard forme
- **Formu generiraj dinamički iz ovog filea**
- NE hardcodiraj form fields!

### 2. `data/hzz-questions.json`
- Help text i tooltipovi za svako polje
- Keys matchaju `hzz-structure.json`

### 3. `data/hzz-examples.json` (NAJVAŽNIJE!)
- **Base template za AI generiranje**
- Proslijedi OpenAI-u kao template
- AI prepisuje vrijednosti za novu business ideju
- **NIKAD ne mijenjaj ovaj file**

## 🤖 AI Generiranje

### `/api/generate/from-intake`
- Prima `intakeData` + `app_id`
- Generira **sekcije 3–5**, validira i sanitizira output
- Uvijek pre-popunjava sekcije **1** i **2** (osnovni podaci + NKD)
- Koristi `lib/validation/hzz.ts` za tipove/tablice/checkboxe

### `/api/generate/proposal`
- Prima `idea` + `app_id` (+ opcionalni `section`)
- Koristi `data/hzz-examples.json` kao base template

## 🗄️ Database Schema

Glavni tablice:
- `user_profiles` - Korisnici
- `applications` - HZZ prijave
- `sections` - Sekcije forme (JSONB data, uključuje `intake`)
- `costs` - Troškovi
- `generated_documents` - PDF/DOCX izvozi

RLS policies omogućene - korisnici vide samo svoje podatke.

## 📝 Development Workflow

1. **Registracija/Login** → `/auth/signup` ili `/auth/login`
2. **Dashboard** → `/dashboard` (lista prijava)
3. **Nova prijava** → `/applications/new` (kreira i redirecta)
4. **Intake** → kratki upitnik (autosave u `sections` s `code='intake'`)
5. **AI Generate** → `/api/generate/from-intake`
6. **Wizard edit** → multi-step forma + autosave
7. **Preview** → pregled + profit summary
8. **Export** → PDF ili DOCX



## 🚢 Deployment

### Vercel

```bash
vercel --prod
```

### Supabase Production

```bash
# Linkaj production projekt
supabase link --project-ref your-project-ref

# Primijeni migracije
supabase db push
```

## ✅ Status (MVP)

- [x] Korisnik može se registrirati i prijaviti
- [x] Korisnik može kreirati novu prijavu
- [x] Korisnik može popuniti multi-step formu
- [x] Forma se dinamički generira iz `hzz-structure.json`
- [x] Autosave funkcionira
- [x] AI generiranje koristi `/api/generate/from-intake`
- [x] Preview panel prikazuje unesene podatke
- [x] PDF export
- [x] DOCX export
- [ ] CV upload i parsing
- [ ] Validacija financijskih limita

## 📚 Dokumentacija

- **PRD:** `PRD.md` - Potpuna specifikacija
- **Implementation Guide:** `IMPLEMENTATION_GUIDE.md`
- **Quickstart:** `QUICKSTART.md`
- **Setup:** `SETUP.md`

## 🔗 Referentni Prototype

https://github.com/BPenzar/hzz-app/tree/test

Koristi za UI patterns, ali ova implementacija je fresh build.

## 📄 License

MIT

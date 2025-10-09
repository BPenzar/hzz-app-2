# HZZ-App

Automatska priprema HZZ zahtjeva za samozapošljavanje uz AI podršku.

## 🚀 Značajke

- **AI asistent** - Automatsko generiranje poslovnog prijedloga korištenjem OpenAI GPT-4o-mini
- **Multi-step wizard** - Dinamički generirane forme iz `data/hzz-structure.json`
- **Real-time validacija** - Provjere financijskih limita i dopuštenih troškova
- **Autosave** - Automatsko spremanje promjena svakih 2 sekunde
- **PDF izvoz** - Profesionalno formatiran dokument spreman za HZZ portal
- **Dashboard** - Upravljanje i praćenje više prijava

## 📋 Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **UI:** Shadcn UI, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** OpenAI API (GPT-4o-mini)
- **PDF:** @react-pdf/renderer

## 🛠️ Setup

### 1. Instalacija dependencies

```bash
npm install
```

### 2. Supabase Setup

```bash
# Pokreni Supabase lokalno
npx supabase start

# Primijeni migracije
npx supabase db push
```

### 3. Environment Variables

Kopiraj `.env.example` u `.env.local` i popuni:

```bash
# Supabase (dobićeš nakon `supabase start`)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Feature Flags
USE_N8N_GENERATE=false
USE_N8N_RULES=false
```

### 4. Pokreni Development Server

```bash
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000)

## 📁 Struktura Projekta

```
hzz-app-2/
├── app/
│   ├── api/generate/proposal/   # AI generiranje (route.ts JE VEĆ IMPLEMENTIRAN)
│   ├── auth/                    # Autentifikacija
│   ├── dashboard/               # Dashboard stranica
│   ├── applications/[id]/       # Wizard forma
│   └── page.tsx                 # Landing page
├── components/
│   ├── auth/                    # Auth komponente
│   ├── dashboard/               # Dashboard komponente
│   ├── wizard/                  # Wizard komponente (dinamički generirane)
│   └── ui/                      # Shadcn UI komponente
├── data/                        # 🔴 KRITIČNO - HZZ data files
│   ├── hzz-structure.json       # Definicija forme
│   ├── hzz-questions.json       # Help text i labele
│   └── hzz-examples.json        # AI template (NE MIJENJAJ!)
├── lib/
│   └── supabase/                # Supabase klijent
├── types/
│   └── supabase.ts              # TypeScript tipovi
└── supabase/
    ├── config.toml
    └── migrations/              # Database schema
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

API route već postoji: `/app/api/generate/proposal/route.ts`

```typescript
// Kako funkcionira:
1. Učita hzz-examples.json kao base template
2. Proslijedi OpenAI-u uz business ideju
3. AI rewrita SVE vrijednosti za novu ideju
4. Vraća JSON s istom strukturom
```

## 🗄️ Database Schema

Glavni tablice:
- `user_profiles` - Korisnici
- `applications` - HZZ prijave
- `sections` - Sekcije forme (JSONB data)
- `costs` - Troškovi
- `generated_documents` - PDF izvozi

RLS policies omogućene - korisnici vide samo svoje podatke.

## 📝 Development Workflow

1. **Registracija/Login** → `/auth/signup` ili `/auth/login`
2. **Dashboard** → `/dashboard` (lista prijava)
3. **Nova prijava** → `/applications/new` (kreira i redirecta)
4. **Wizard** → `/applications/[id]` (multi-step forma)
5. **AI Generate** → Klik na "Generiraj AI" button
6. **Autosave** → Automatski sprema svake 2s
7. **PDF Export** → (TODO - implementiraj endpoint)

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

## ✅ Success Criteria (MVP)

- [x] Korisnik može se registrirati i prijaviti
- [x] Korisnik može kreirati novu prijavu
- [x] Korisnik može popuniti multi-step formu
- [x] Forma se dinamički generira iz `hzz-structure.json`
- [x] Autosave funkcionira (2s debounce)
- [x] AI generiranje poziva `/api/generate/proposal`
- [x] Preview panel prikazuje unesene podatke
- [ ] PDF export
- [ ] CV upload i parsing
- [ ] Validacija financijskih limita

## 📚 Dokumentacija

- **PRD:** `PRD.md` - Potpuna specifikacija
- **Implementation Guide:** `CLAUDE_CODE_PROMPT.md` - Detaljne upute
- **Quickstart:** `QUICKSTART.md` - Brzi start

## 🔗 Referentni Prototype

https://github.com/BPenzar/hzz-app/tree/test

Koristi za UI patterns, ali ova implementacija je fresh build.

## 📄 License

MIT

---

**Generirano uz pomoć Claude Code** 🤖

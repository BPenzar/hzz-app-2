# HZZ-App Setup Guide

## 🚀 Brzi Start

### 1. Instalacija

```bash
npm install
```

### 2. Supabase Setup

#### Opcija A: Lokalni Development (Preporučeno)

```bash
# Pokreni Supabase lokalno
npx supabase start

# Kopiraj ANON_KEY i SERVICE_ROLE_KEY iz outputa
# Primijeni migracije
npx supabase db push
```

Nakon `supabase start`, dobit ćeš output:

```
API URL: http://localhost:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Opcija B: Supabase Cloud (Production)

1. Kreiraj projekt na [supabase.com](https://supabase.com)
2. Kopiraj keys iz Settings → API
3. Primijeni migracije:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 3. Environment Variables

Kopiraj `.env.example` u `.env.local`:

```bash
cp .env.example .env.local
```

Popuni vrijednosti:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  # ili cloud URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

```

### 4. OpenAI API Key

1. Kreiraj account na [platform.openai.com](https://platform.openai.com)
2. Generiraj API key: API Keys → Create new secret key
3. Dodaj u `.env.local`

**Napomena:** Trebaš credits za API calls. Model `gpt-4o-mini` je najjeftiniji.

### 5. Pokreni Development Server

```bash
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000)

## ✅ Checklist

- [ ] `npm install` izvršeno
- [ ] Supabase pokrenut (`npx supabase start`)
- [ ] Migracije primijenjene (`npx supabase db push`)
- [ ] `.env.local` kreiran i popunjen
- [ ] OpenAI API key postavljen
- [ ] `npm run dev` radi bez grešaka
- [ ] Otvara se [http://localhost:3000](http://localhost:3000)

## 🧪 Test Flow

1. **Registracija:** http://localhost:3000/auth/signup
   - Email: test@example.com
   - Password: test123

2. **Login:** http://localhost:3000/auth/login

3. **Dashboard:** http://localhost:3000/dashboard
   - Klikni "Nova prijava"

4. **Wizard:** http://localhost:3000/applications/[id]
   - Popuni osnovne podatke u sekciji 1
   - Unesi poslovnu ideju u sekciji 3.2
   - Klikni "Generiraj AI" button
   - Provjeri da li AI generira sadržaj

## 🐛 Troubleshooting

### Problem: Supabase ne pokreće se

```bash
# Zaustavi sve Docker containere
docker stop $(docker ps -aq)

# Pokušaj ponovno
npx supabase start
```

### Problem: TypeScript greške

```bash
npm run type-check
```

### Problem: AI generiranje ne radi

1. Provjeri da li je `OPENAI_API_KEY` postavljen
2. Provjeri credits na OpenAI accountu
3. Otvori Dev Tools (F12) → Network tab → provjeri `/api/generate/proposal` request

### Problem: Autentifikacija ne radi

1. Provjeri Supabase keys u `.env.local`
2. Provjeri da li Supabase radi: http://localhost:54321

## 📊 Database Management

### Supabase Studio

Otvori: http://localhost:54323

- Table Editor: vidi sve tablice
- SQL Editor: izvrši custom queries
- Auth: upravljaj korisnicima

### Generate TypeScript Types

```bash
npm run supabase:types
```

Ovo regenerira `types/supabase.ts` iz Supabase schema.

## 🚢 Production Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Postavi environment variables u Vercel Dashboard → Settings → Environment Variables.

### Supabase Cloud

```bash
# Link production projekt
npx supabase link --project-ref your-prod-ref

# Push migracije
npx supabase db push
```

## 📝 Napomene

- **data/*.json files** - NE mijenjaj! To su core files za AI generiranje
- **Autosave** - Forma automatski sprema svake 2 sekunde
- **OpenAI costs** - GPT-4o-mini je ~$0.15 per 1M tokens (vrlo jeftino)

---

**Potrebna pomoć?** Pogledaj `README.md` ili `IMPLEMENTATION_GUIDE.md`

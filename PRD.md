# HZZ-App - Product Requirements Document (PRD)

## Executive Summary

**Product Name:** HZZ-App  
**Purpose:** Automated preparation of HZZ self-employment applications for Croatian users  
**Tech Stack:** Next.js 14+ (App Router), Supabase (PostgreSQL + Auth + Storage), n8n (automation fallback), OpenAI API  
**Target Users:** Self-employed individuals, micro-businesses, startup consultants in Croatia  
**Launch Goal:** MVP in 4-6 weeks

---

## Problem Statement

The official HZZ self-employment application process is complex, changes annually, and requires significant time investment (3-5 hours). Candidates struggle with:
- Structuring business ideas properly
- Creating revenue/expense projections
- Ensuring compliance with HZZ guidelines
- Understanding allowed vs disallowed costs
- Meeting tight deadlines

**Solution:** HZZ-App automates application preparation through AI-assisted generation, real-time validation, and guided workflows.

---

## Product Overview

### Core Value Proposition
"Fast and error-free HZZ application preparation with clear guidance, automatic checks, and export-ready documents."

### Key Features (MVP)
1. **Authentication** - Supabase Auth (email/password + OAuth)
2. **Eligibility Check** - Pre-qualification questionnaire
3. **CV Parsing** - Optional CV upload with auto-extraction
4. **Multi-step Wizard** - Guided form with 5 sections
5. **AI Generation** - OpenAI-powered proposal generation
6. **PDF Export** - Ready-to-submit documents
7. **Dashboard** - Application history and management

---

## Technical Architecture

### Stack Overview
```
Frontend: Next.js 14+ (App Router) + Shadcn UI + Tailwind CSS
Backend: Supabase (PostgreSQL + Auth + Storage)
AI: OpenAI API (GPT-4o-mini) with n8n fallback
Hosting: Vercel (frontend) + Supabase Cloud (EU)
```

### Feature Flags
```bash
USE_N8N_GENERATE=false  # Primary: Next.js direct, Fallback: n8n
USE_N8N_RULES=false     # Manual HZZ rules updates in MVP
```

---

## Database Schema

See `supabase/migrations/initial_schema.sql` for complete SQL.

### Core Tables
- `user_profiles` - User data, CV parsed, eligibility status
- `applications` - Main HZZ applications
- `sections` - Form sections with JSON data
- `costs` - Individual cost items
- `generated_documents` - PDF exports
- `hzz_rules` - HZZ guidelines (admin-managed)
- `deadlines` - Submission deadlines
- `audits` - Audit trail

### Key Relationships
- `user_profiles` 1:N `applications`
- `applications` 1:N `sections`, `costs`, `generated_documents`
- Row Level Security (RLS) enabled on all tables

---

## API Endpoints

### Next.js API Routes

#### `/api/auth/*`
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

#### `/api/cv/parse`
```typescript
POST /api/cv/parse
Body: FormData with 'file' (PDF/DOCX, max 5MB)
Response: { name, email, phone, education[], experience[], skills[] }
```

#### `/api/applications/*`
- `POST /api/applications` - Create new application
- `GET /api/applications` - List user's applications
- `GET /api/applications/:id` - Get single application
- `PATCH /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Archive application
- `POST /api/applications/:id/duplicate` - Copy as template

#### `/api/generate/proposal`
```typescript
POST /api/generate/proposal
Body: {
  app_id: string,
  idea: string,
  template: Record<string, any>
}
Response: {
  success: boolean,
  data: GeneratedContent,
  source: 'openai' | 'n8n',
  usage?: TokenUsage
}
```

#### `/api/generate/pdf`
```typescript
POST /api/generate/pdf
Body: { app_id: string }
Response: {
  download_url: string,
  file_size_kb: number,
  validation_status: 'complete' | 'incomplete'
}
```

#### `/api/hzz-rules/*`
- `GET /api/hzz-rules` - Get current rules
- `GET /api/hzz-rules/deadlines` - Get submission deadlines

---

## AI Generation Flow

### Primary: Next.js Direct (Recommended)

```typescript
// /app/api/generate/proposal/route.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const { idea, template } = await request.json();
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at generating Croatian HZZ applications...'
      },
      {
        role: 'user',
        content: `Business Idea: ${idea}\n\nTemplate:\n${JSON.stringify(template)}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4000,
  });

  return NextResponse.json({
    success: true,
    data: JSON.parse(completion.choices[0].message.content),
    source: 'openai'
  });
}
```

### Fallback: n8n Webhook

```typescript
// Fallback if OpenAI fails
if (USE_N8N_FALLBACK) {
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ idea, template })
  });
  return response.json();
}
```

---

## User Journey

### 1. Registration & Onboarding
- Landing page → "Započni" CTA
- Registration (email or Google OAuth)
- Email verification
- Eligibility questionnaire (5 yes/no questions)

### 2. Creating Application
- Dashboard → "Nova prijava"
- Optional CV upload → auto-parsing
- Multi-step wizard (5 sections):
  1. Basic Info
  2. Business Idea
  3. Costs
  4. Revenue/Expense Plan
  5. Final Review

### 3. AI Generation
- User clicks "Generiraj prijedlog"
- Loading state (2-3s)
- Split-screen: form (left) + preview (right)
- Inline editing enabled

### 4. Export & Submit
- Validation warnings (if any)
- "Izvezi PDF" → download
- Link to official HZZ portal (mjere.hr)
- Mark as "submitted"

---

## Validation Rules

### Financial Limits
```typescript
const LIMITS = {
  samozaposleni: 5000,      // €
  pausalni_obrt: 7000,      // €
  obrt_sa_zaposlenima: 10000, // €
  jdoo: 15000               // €
};

function validateAmount(type: string, amount: number) {
  if (amount > LIMITS[type]) {
    return { valid: false, message: `Exceeds limit (${LIMITS[type]}€)` };
  }
  return { valid: true };
}
```

### Eligibility Criteria
- Unemployed and registered with HZZ
- Age 18-65
- No business entity in last 2 years
- No tax debt
- Has not used this measure before

### Allowed Cost Categories
- Equipment (oprema)
- Marketing
- Office rent (prostor_najam)
- Accounting/legal services
- Software licenses
- Education
- Materials

**Disallowed:**
- Vehicles (vozila)
- Salaries (place)
- Dividends
- Real estate

---

## UI/UX Specifications

### Design System
**Style:** Modern, minimalist, productivity-focused  
**Inspiration:** Linear, Notion, Supabase Dashboard  
**Components:** Shadcn UI + Tailwind CSS

### Color Palette
```css
--primary: #0066CC (HZZ blue)
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--background: #FFFFFF
--surface: #F8F9FA
--text-primary: #111827
```

### Typography
```css
font-family: 'Inter', sans-serif;
h1: 32px/700
h2: 24px/600
body: 16px/400
```

### Layout Structure

**Landing Page:**
- Hero: "Brzo izradi svoj HZZ zahtjev"
- How it works (4 steps)
- Features grid
- CTA: "Započni besplatno"

**Dashboard:**
- Sidebar navigation (fixed 240px)
- Card grid (3 columns, responsive)
- Status badges: Draft / Valid / Archived

**Wizard:**
- Split-screen: 60% form / 40% preview
- Sticky header with progress (1/5)
- Autosave indicator
- Inline validations

---

## Security & Compliance

### Authentication
- Supabase Auth (JWT tokens)
- Session expiry: 7 days
- OAuth providers: Google, LinkedIn (optional)

### Data Protection
- GDPR compliant
- Data retention: 30 days (drafts), 1 year (completed)
- Right to deletion
- Privacy Policy + Terms of Use

### API Security
- Rate limiting:
  - Auth: 5 req/min
  - AI generate: 10 req/hour per user
  - File upload: 3 req/min
- Input sanitization (DOMPurify)
- File validation (PDF/DOCX only, max 5MB)

---

## Performance Requirements

### Response Times (P95)
- Landing page: < 1s
- Dashboard load: < 2s
- Form autosave: < 500ms
- AI generation: < 3s
- PDF export: < 10s

### Optimization
- Next.js Image optimization
- Code splitting
- React Server Components
- Debounced autosave (2s)
- CDN (Cloudflare)

---

## Implementation Phases

### Phase 1: MVP Core (4-6 weeks)
**Priority 1:**
- ✅ Supabase setup
- ✅ Next.js project structure
- ✅ Authentication (email/password)
- ✅ Dashboard (list applications)
- ✅ Multi-step wizard
- ✅ Autosave

**Priority 2:**
- ✅ CV parsing (OpenAI)
- ✅ AI generation (direct API)
- ✅ Preview panel
- ✅ PDF export (basic)

**Priority 3:**
- ✅ Eligibility questionnaire
- ✅ Status badges
- ✅ Copy application
- ✅ Archive

### Phase 2: Enhanced (3-4 weeks)
- OAuth providers
- Consultant role
- n8n fallback
- HZZ rules validation
- Admin dashboard
- Audit log

### Phase 3: Polish (2-3 weeks)
- Performance optimization
- Mobile responsive
- Accessibility (a11y)
- Rate limiting
- Analytics

---

## Success Metrics

### Acquisition
- Registrations/week: 20+
- Conversion (landing → signup): >15%

### Activation
- Complete eligibility: >80%
- Upload CV: >60%
- Create first application: >70%

### Engagement
- AI generations per user: 2-3
- Time in wizard: 15-30 min
- Complete all sections: >50%

### Quality
- Error rate: <1%
- Failed AI generations: <5%
- Uptime: >99.5%

---

## Risk Mitigation

### Risk 1: OpenAI API Downtime
**Mitigation:** n8n fallback, clear error messages

### Risk 2: HZZ Rules Change
**Mitigation:** Version control, manual update process

### Risk 3: GDPR Non-compliance
**Mitigation:** Legal review, data retention policy, export feature

### Risk 4: Peak Load (deadline week)
**Mitigation:** Supabase Pro plan, rate limiting, queue

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# n8n (optional)
N8N_WEBHOOK_URL=
N8N_API_KEY=

# Feature Flags
USE_N8N_GENERATE=false
USE_N8N_RULES=false

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment

### Environments
- **Development:** localhost:3000
- **Staging:** staging.hzz-app.com
- **Production:** hzz-app.com

### CI/CD
- GitHub Actions
- Auto-deploy to Vercel on `main` push
- Supabase migrations via CLI

### Monitoring
- Vercel Analytics
- Sentry (error tracking)
- Supabase Dashboard

---

## Next Steps for Claude Code

1. Initialize Next.js 14 project with App Router
2. Install dependencies: `@supabase/supabase-js`, `openai`, `shadcn-ui`
3. Setup Supabase client
4. Apply database migration
5. Implement authentication flow
6. Build multi-step wizard
7. Integrate OpenAI API
8. Create PDF generation endpoint
9. Deploy to Vercel

---

**This PRD is production-ready. Use it as a reference throughout implementation.**
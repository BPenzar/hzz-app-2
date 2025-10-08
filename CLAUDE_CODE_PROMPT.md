# HZZ-App - Implementation Instructions for Claude Code

## Project Overview

Build a Next.js 14+ web application for automated HZZ (Croatian Employment Service) self-employment application preparation. The app uses AI (OpenAI GPT-4o-mini) to generate business proposals, Supabase for database/auth, and exports PDF documents.

**Repository:** https://github.com/BPenzar/hzz-app/tree/test (existing prototype - use as reference)

---

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), React 18, TypeScript
- **UI:** Shadcn UI, Tailwind CSS, Lucide React icons
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** OpenAI API (GPT-4o-mini) with n8n fallback
- **PDF:** @react-pdf/renderer or puppeteer
- **Hosting:** Vercel (frontend), Supabase Cloud EU (backend)

---

## Phase 1: Project Setup

### 1. Initialize Next.js Project

```bash
npx create-next-app@latest hzz-app --typescript --tailwind --app --src-dir
cd hzz-app
```

### 2. Install Dependencies

```bash
# Core
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs openai

# UI Components
npm install @radix-ui/react-* lucide-react class-variance-authority clsx tailwind-merge

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# PDF Generation
npm install @react-pdf/renderer

# Utilities
npm install date-fns lodash react-hot-toast

# Dev Dependencies
npm install -D @types/lodash
```

### 3. Setup Shadcn UI

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input textarea label card badge alert dialog select tabs toast
```

---

## Phase 2: Supabase Configuration

### 1. Initialize Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to your cloud project
supabase link --project-ref <your-project-ref>
```

### 2. Apply Database Migration

Copy the provided `supabase/migrations/20250101000000_initial_schema.sql` file and run:

```bash
supabase db push
```

### 3. Configure Supabase Client

Create `lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createClient = () => createClientComponentClient();

export const createServerClient = () => createServerComponentClient({ cookies });
```

Create `lib/supabase/middleware.ts`:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();
  return res;
}
```

---

## Phase 3: Core Features Implementation

### 1. Authentication System

**Pages to create:**
- `app/auth/login/page.tsx` - Login form
- `app/auth/signup/page.tsx` - Registration form
- `app/auth/verify/page.tsx` - Email verification

**Components:**
- `components/auth/LoginForm.tsx`
- `components/auth/SignupForm.tsx`
- `components/auth/AuthProvider.tsx` - Context for auth state

**API Routes:**
- `app/api/auth/callback/route.ts` - OAuth callback handler

### 2. Dashboard

**Page:** `app/dashboard/page.tsx`

Features:
- List all user's applications
- Card grid layout (3 columns, responsive)
- Status badges (Draft, Valid, Archived)
- Search and filter
- "Nova prijava" button

**Components:**
- `components/dashboard/ApplicationCard.tsx`
- `components/dashboard/ApplicationList.tsx`
- `components/dashboard/StatusBadge.tsx`

### 3. Multi-Step Wizard

**Page:** `app/applications/[id]/page.tsx`

**Layout:** Split-screen (60% form / 40% preview)

**Sections:**
1. Basic Info (`components/wizard/BasicInfoSection.tsx`)
2. Business Idea (`components/wizard/BusinessIdeaSection.tsx`)
3. Costs (`components/wizard/CostsSection.tsx`)
4. Revenue Plan (`components/wizard/RevenuePlanSection.tsx`)
5. Final Review (`components/wizard/FinalSection.tsx`)

**Shared Components:**
- `components/wizard/WizardLayout.tsx` - Main layout
- `components/wizard/WizardNav.tsx` - Section navigation
- `components/wizard/PreviewPanel.tsx` - Right panel for generated content
- `components/wizard/AutoSave.tsx` - Debounced save indicator

### 4. AI Generation

**API Route:** `app/api/generate/proposal/route.ts`

Copy the provided implementation. Key features:
- Primary: Direct OpenAI API call
- Fallback: n8n webhook (if enabled)
- Error handling
- Token usage tracking

**Frontend Hook:** `hooks/useGenerateProposal.ts`

```typescript
export function useGenerateProposal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (appId: string, idea: string, template: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, idea, template }),
      });

      if (!response.ok) throw new Error('Generation failed');

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
}
```

### 5. PDF Export

**API Route:** `app/api/generate/pdf/route.ts`

```typescript
import { renderToStream } from '@react-pdf/renderer';
import { PDFDocument } from 'components/pdf/PDFDocument';

export async function POST(request: NextRequest) {
  const { app_id } = await request.json();
  
  // Fetch application data from Supabase
  const { data } = await supabase
    .from('applications')
    .select('*, sections(*), costs(*)')
    .eq('id', app_id)
    .single();

  // Generate PDF
  const stream = await renderToStream(<PDFDocument data={data} />);
  
  // Upload to Supabase Storage
  const fileName = `application-${app_id}.pdf`;
  await supabase.storage
    .from('documents')
    .upload(fileName, stream);

  return NextResponse.json({ download_url: `.../${fileName}` });
}
```

**PDF Component:** `components/pdf/PDFDocument.tsx`

```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export const PDFDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>HZZ Zahtjev za Samozapošljavanje</Text>
        {/* Render application data */}
      </View>
    </Page>
  </Document>
);
```

---

## Phase 3.5: Data Structure Setup (CRITICAL)

### Important: Use Provided HZZ Data Files

The project includes **three essential JSON files** that define the HZZ application structure. These files are located in `data/` folder.

---

### 1. data/hzz-structure.json

**Purpose:** Defines all sections and fields in the wizard form

**How to use:**
```typescript
// components/wizard/WizardForm.tsx
import hzzStructure from '@/data/hzz-structure.json';

export function WizardForm() {
  const sections = hzzStructure.sections;
  
  return (
    <div>
      {sections.map(section => (
        <WizardSection key={section.id} data={section} />
      ))}
    </div>
  );
}
```

**Implementation notes:**
- Use this as the source of truth for form generation
- Generate form fields dynamically from this structure
- Validate required fields based on `required` property
- Use `section.id` for navigation and progress tracking

---

### 2. data/hzz-questions.json

**Purpose:** Contains full question text and help descriptions for each field

**How to use:**
```typescript
// components/wizard/FieldWithHelp.tsx
import hzzQuestions from '@/data/hzz-questions.json';

export function FieldWithHelp({ sectionId, fieldKey }) {
  const questionText = hzzQuestions[sectionId]?.[fieldKey];
  
  return (
    <div>
      <Label>{questionText}</Label>
      <Tooltip content={questionText}>
        <InfoIcon />
      </Tooltip>
      <Input />
    </div>
  );
}
```

**Implementation notes:**
- Use for tooltips, placeholders, and help text
- Keys match those in hzz-structure.json
- Provides user-friendly descriptions

---

### 3. data/hzz-examples.json (MOST CRITICAL)

**Purpose:** Complete example of a filled HZZ application - this is the AI template

**How to use - AI Generation:**
```typescript
// app/api/generate/proposal/route.ts
import hzzExamples from '@/data/hzz-examples.json';

export async function POST(request: NextRequest) {
  const { idea, section } = await request.json();
  
  // Use hzz-examples.json as the base template
  const template = section 
    ? hzzExamples[section]  // Generate single section
    : hzzExamples;          // Generate full application

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Business Idea: ${idea}\n\nBase Template:\n${JSON.stringify(template, null, 2)}\n\nRewrite all string values for this business idea. Keep exact JSON structure.`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return NextResponse.json({
    data: JSON.parse(completion.choices[0].message.content)
  });
}
```

**CRITICAL Implementation Notes:**
- This file is the "base template" that AI rewrites
- AI keeps the exact JSON structure but changes the content
- Example: User's business idea is "coffee shop" → AI rewrites all values to match coffee shop business
- Never modify this file - it's the canonical example

---

### Implementation Checklist

**Step 1: Copy data files**
```bash
# Ensure these files exist in your project:
data/
├── hzz-structure.json  ✅
├── hzz-questions.json  ✅
└── hzz-examples.json   ✅
```

**Step 2: Import in TypeScript**
```typescript
// Next.js supports JSON imports natively
import hzzStructure from '@/data/hzz-structure.json';
import hzzQuestions from '@/data/hzz-questions.json';
import hzzExamples from '@/data/hzz-examples.json';
```

**Step 3: Use in components**
- Wizard form: Generate from hzz-structure.json
- Help text: Read from hzz-questions.json
- AI template: Pass hzz-examples.json to OpenAI

---

### Why This Approach Works

1. Single source of truth - All form structure comes from JSON files
2. Easy updates - Change JSON → entire app updates
3. AI consistency - Same template ensures consistent AI outputs
4. Type safety - Can generate TypeScript types from JSON structure

---

### Common Mistakes to Avoid

❌ Don't hardcode form fields in components  
✅ Do generate dynamically from hzz-structure.json

❌ Don't create your own example data for AI  
✅ Do use hzz-examples.json as-is

❌ Don't modify the JSON files during development  
✅ Do treat them as immutable configuration

---

## Phase 4: Additional Features

### 1. CV Parsing

**API Route:** `app/api/cv/parse/route.ts`

```typescript
import { OpenAI } from 'openai';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Read file content
  const buffer = await file.arrayBuffer();
  const text = extractTextFromPDF(buffer); // Use pdf-parse or similar

  // Parse with OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Extract structured data from CV text. Return JSON with: name, email, phone, education[], experience[], skills[]'
      },
      {
        role: 'user',
        content: text
      }
    ],
    response_format: { type: 'json_object' }
  });

  return NextResponse.json(JSON.parse(completion.choices[0].message.content));
}
```

### 2. Eligibility Questionnaire

**Component:** `components/onboarding/EligibilityQuestionnaire.tsx`

5 yes/no questions:
- Unemployed and registered with HZZ?
- Age 18-65?
- No business entity in last 2 years?
- No tax debt?
- Has not used this measure before?

### 3. Validation System

**Utilities:** `lib/validations.ts`

```typescript
export function validateMaxAmount(subjectType: string, amount: number) {
  const LIMITS = {
    samozaposleni: 5000,
    pausalni_obrt: 7000,
    obrt_sa_zaposlenima: 10000,
    jdoo: 15000
  };

  if (amount > LIMITS[subjectType]) {
    return { 
      valid: false, 
      message: `Prelazi maksimalni iznos (${LIMITS[subjectType]}€)` 
    };
  }

  return { valid: true };
}

export function validateCostCategory(category: string, allowedCosts: string[]) {
  if (!allowedCosts.includes(category)) {
    return {
      valid: false,
      message: `Kategorija "${category}" nije dopuštena`
    };
  }
  return { valid: true };
}
```

---

## Phase 5: UI/UX Polish

### 1. Landing Page

**Page:** `app/page.tsx`

Sections:
- Hero with CTA
- How it works (4 steps)
- Features grid
- Footer

### 2. Responsive Design

Ensure mobile-friendly:
- Hamburger menu on mobile
- Single column layout
- Touch-friendly buttons
- Preview panel as separate tab on mobile

### 3. Loading States

- Skeleton screens for dashboard
- Spinner for AI generation
- Progress bar for file upload
- Toast notifications for success/error

### 4. Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus indicators
- Alt text for images

---

## Phase 6: Testing & Deployment

### 1. Environment Setup

Create `.env.local` from `.env.example` template provided.

### 2. Local Testing

```bash
npm run dev
```

Test all user flows:
- Registration → Login
- CV upload → Parse
- Create application → Fill form
- Generate proposal
- Export PDF

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Configure environment variables in Vercel dashboard.

### 4. Supabase Production Setup

```bash
# Apply migrations to production
supabase db push --db-url <production-db-url>
```

---

## Important Implementation Notes

### 1. Use Existing Prototype as Reference

The GitHub repo (https://github.com/BPenzar/hzz-app/tree/test) contains:
- `app/hzz/data/generated/hzz-examples.json` - Example data structure
- `app/hzz/data/generated/hzz-questions.json` - Form questions
- `app/hzz/data/generated/hzz-structure.json` - Application structure

**Use these files** for form structure and validation schemas.

### 2. Row Level Security (RLS)

All Supabase queries must respect RLS policies. Use the migration file provided - it includes all necessary policies.

### 3. Error Handling

Always implement proper error handling:
- Try-catch blocks
- User-friendly error messages
- Fallback UI components
- Logging (console.error for dev, Sentry for prod)

### 4. Performance Optimization

- Use React Server Components where possible
- Implement debounced autosave (2s delay)
- Lazy load heavy components
- Optimize images with Next.js Image
- Enable caching for API routes

### 5. Type Safety

Generate TypeScript types from Supabase schema:

```bash
npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
```

Use in code:

```typescript
import { Database } from '@/types/supabase';

type Application = Database['public']['Tables']['applications']['Row'];
```

---

## Success Criteria

The implementation is complete when:

✅ User can register and login  
✅ User can create a new application  
✅ User can upload CV and see parsed data  
✅ User can fill multi-step form with autosave  
✅ User can generate AI proposal (< 3s)  
✅ User can edit generated content  
✅ User can export PDF  
✅ User can view all applications in dashboard  
✅ Validation warnings appear inline  
✅ Mobile responsive  
✅ No console errors  
✅ Deployed to Vercel  

---

## Additional Resources

- **PRD:** See `PRD.md` for complete product requirements
- **Database Schema:** See `supabase/migrations/initial_schema.sql`
- **n8n Fallback:** See `n8n/workflows/hzz_generate_optimized.json`
- **Prototype:** https://github.com/BPenzar/hzz-app/tree/test

---

## Support & Questions

If you encounter issues:
1. Check the PRD for business logic clarification
2. Review existing prototype code for patterns
3. Ensure all environment variables are set
4. Verify Supabase migration was applied successfully
5. Check OpenAI API key has sufficient quota

---

**Start with Phase 1 (Setup) and work through each phase sequentially. Good luck!** 🚀
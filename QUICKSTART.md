# HZZ-App - Quick Start Guide

## 🚀 Quick Start

**Share these files:**
1. `PRD.md` - Complete product requirements
2. `IMPLEMENTATION_GUIDE.md` - Implementation instructions
3. `supabase/migrations/20250101000000_initial_schema.sql` - Database schema
4. `app/api/generate/proposal/route.ts` - AI generation endpoint
5. `.env.example` - Environment variables template
6. `package.json.template` - Dependencies list

**Then say:**
> "Implementiraj HZZ-App prema PRD-u i IMPLEMENTATION_GUIDE.md instrukcijama. Koristi Next.js 14 App Router, Supabase, OpenAI API i Shadcn UI. Započni s Fazom 1 (Setup)."

---

## 📋 Manual Setup

### Step 1: Prerequisites

```bash
# Install Node.js 18+
node --version  # Should be 18.x or higher

# Install pnpm (optional, faster than npm)
npm install -g pnpm

# Install Supabase CLI
npm install -g supabase
```

### Step 2: Clone Existing Prototype (Optional)

```bash
git clone https://github.com/BPenzar/hzz-app.git
cd hzz-app
git checkout test  # Switch to test branch
```

Or start fresh:

```bash
npx create-next-app@latest hzz-app --typescript --tailwind --app --src-dir
cd hzz-app
```

### Step 3: Install Dependencies

```bash
# Copy package.json.template to package.json
cp package.json.template package.json

# Install
npm install

# Install Shadcn UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input textarea label card badge alert dialog select tabs toast
```

### Step 4: Setup Supabase

```bash
# Initialize Supabase locally
supabase init

# Start local Supabase (Docker required)
supabase start

# Apply migration
supabase db push

# Or link to cloud project
supabase link --project-ref <your-project-ref>
supabase db push
```

### Step 5: Configure Environment

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local and add:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY
```

### Step 6: Create Core Files

**Create these files from the artifacts:**
- `app/api/generate/proposal/route.ts` - AI generation endpoint
- `lib/supabase/client.ts` - Supabase client
- `lib/validations.ts` - Validation functions

### Step 7: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## 🧪 Testing Checklist

### 1. Authentication Flow
- [ ] Register new user
- [ ] Receive verification email
- [ ] Login with credentials
- [ ] Logout

### 2. Application Creation
- [ ] Click "Nova prijava"
- [ ] Application created in database
- [ ] Redirects to wizard

### 3. CV Upload (if implemented)
- [ ] Upload PDF/DOCX
- [ ] Parsing completes in <10s
- [ ] Data appears in form

### 4. Multi-Step Form
- [ ] Navigate between sections
- [ ] Auto-save works (check DB)
- [ ] Validation warnings appear

### 5. AI Generation
- [ ] Click "Generiraj prijedlog"
- [ ] Loading indicator appears
- [ ] Content appears in <3s
- [ ] Preview panel updates

### 6. PDF Export
- [ ] Click "Izvezi PDF"
- [ ] PDF downloads
- [ ] Open PDF - content readable

### 7. Dashboard
- [ ] View all applications
- [ ] Status badges correct
- [ ] Search/filter works
- [ ] Copy application

---

## 🐛 Common Issues & Solutions

### Issue: Supabase connection error

**Solution:**
```bash
# Check if Supabase is running
supabase status

# Restart if needed
supabase stop
supabase start
```

### Issue: OpenAI API error "Invalid API key"

**Solution:**
```bash
# Verify key is set
echo $OPENAI_API_KEY

# Re-add to .env.local
OPENAI_API_KEY=sk-...
```

### Issue: TypeScript errors

**Solution:**
```bash
# Generate types from Supabase
npm run supabase:types

# Type-check
npm run type-check
```

### Issue: PDF generation fails

**Solution:**
```bash
# Check if @react-pdf/renderer is installed
npm list @react-pdf/renderer

# Reinstall if missing
npm install @react-pdf/renderer
```

---

## 📊 Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Landing page load | < 1s | Chrome DevTools Network tab |
| Dashboard load | < 2s | Chrome DevTools Performance |
| AI generation | < 3s | Network tab, `/api/generate/proposal` |
| PDF export | < 10s | Network tab, `/api/generate/pdf` |
| Form autosave | < 500ms | Network tab, watch for debounced saves |

---

## 🔐 Security Checklist

- [ ] RLS policies enabled on all Supabase tables
- [ ] API routes check authentication
- [ ] File uploads limited to 5MB
- [ ] Only PDF/DOCX allowed for CV
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Environment variables not committed
- [ ] Service role key only used server-side

---

## 📦 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Add environment variables (from `.env.local`)
4. Deploy

### 3. Configure Supabase Production

1. Create production project on Supabase
2. Apply migration: `supabase db push --db-url <prod-url>`
3. Update Vercel env vars with production keys

### 4. Setup Custom Domain (Optional)

1. Go to Vercel project settings
2. Add domain: `hzz-app.com`
3. Configure DNS as instructed

---

## 📈 Monitoring & Analytics

### Vercel Analytics
- Auto-enabled on Vercel
- View at: Vercel Dashboard → Analytics

### Supabase Metrics
- Database performance: Supabase Dashboard → Database
- API usage: Supabase Dashboard → API

### Error Tracking (Optional)

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

---

## 🎯 Next Steps After MVP

### Phase 2 Features
- [ ] Google OAuth
- [ ] Consultant role
- [ ] Cost validation against rules
- [ ] Admin dashboard

### Phase 3 Features
- [ ] Stripe billing
- [ ] Email notifications
- [ ] Advanced PDF styling
- [ ] Multi-language support
- [ ] Mobile app (React Native)

---

## 📚 Additional Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **OpenAI API Docs:** https://platform.openai.com/docs
- **Shadcn UI:** https://ui.shadcn.com
- **Existing Prototype:** https://github.com/BPenzar/hzz-app/tree/test

---

## 💬 Support

If stuck, check:
1. PRD.md for business logic
2. IMPLEMENTATION_GUIDE.md for technical guidance
3. Existing prototype code for patterns
4. Supabase logs for database errors
5. Browser console for frontend errors

---

**Happy coding! 🚀**

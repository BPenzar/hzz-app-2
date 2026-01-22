# AGENTS.md

## Project
- Next.js App Router, React 18, TypeScript, Tailwind CSS, Shadcn UI.
- Backend/DB: Supabase. AI: OpenAI API.

## Package manager
- Use npm (lockfile: `package-lock.json`).
- Common scripts: `npm run dev`, `npm run lint`, `npm run type-check`, `npm run build`.
- Supabase scripts: `npm run supabase:start`, `npm run supabase:stop`, `npm run supabase:push`, `npm run supabase:reset`.

## Data + API constraints
- `data/hzz-structure.json` drives the wizard form; do not hardcode form fields.
- `data/hzz-questions.json` supplies help text/labels tied to the structure keys.
- `data/hzz-examples.json` is the AI base template; do not modify it.
- Primary AI generation: `app/api/generate/from-intake/route.ts` (intake → sections 3–5 + validation).
- Full-template AI generation: `app/api/generate/proposal/route.ts`.
- Validation/sanitization lives in `lib/validation/hzz.ts` — keep AI outputs aligned with structure.
- Table column/label logic for preview lives in `lib/hzz/tableSchema.ts`.
- Intake autosave persists to `sections` with `code='intake'`.
- Generated exports are stored in Supabase Storage bucket `generated-documents` with metadata in `generated_documents`.

## Supabase
- Migrations live in `supabase/migrations/`.
- If schema changes, update migrations and regenerate types in `types/supabase.ts` (see `npm run supabase:types`).

## Environment
- Copy `.env.example` to `.env.local` and set required keys.
- Never commit secrets or real credentials.

## Verification
- Prefer `npm run lint` and `npm run type-check` for TypeScript changes.
- Run `npm run build` only when production config or build output paths are affected.

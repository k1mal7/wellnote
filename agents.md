## Current product stage

WellNote is a limited clinical beta and may process identifiable health information.

Prioritize:
1. data integrity
2. authorization/privacy
3. preservation of existing clinical records
4. reliability
5. UX

Do not trade security or clinical-record integrity for convenience.

# WellNote Development Instructions

WellNote is a Next.js + TypeScript + Supabase clinical charting app.

## Core architecture

- Next.js
- TypeScript / React
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase RLS

## Important Next.js rules

- This project uses `cacheComponents`.
- Do NOT use:
  `export const dynamic = "force-dynamic"`
- Authenticated pages/layouts that currently require blocking request-time data may use:

export const instant = false;

Do not add it mechanically to Client Components.
Do not use `dynamic = "force-dynamic"` while `cacheComponents` is enabled.
Preserve existing working `instant = false` usage unless deliberately migrating the route to a newer Cache Components pattern.

## Visit architecture

- A new visit begins as a persistent `visit_sessions` draft.
- Only one open draft should normally exist per client.
- SOAPIE values autosave into `visit_sessions`.
- Draft clinical findings use `visit_session_id`.
- Finalized clinical findings use `visit_id`.
- When finalizing a visit:
  1. Create the permanent visit.
  2. Link draft clinical findings to the permanent visit.
  3. Mark the visit session completed.

## Clinical data rules

- SOAPIE notes and clinical findings are separate data types.
- Do not automatically rewrite clinician-entered interventions.
- Never delete findings belonging to finalized visits.
- Do not build new features around `visit_assessment_drafts`.
- The legacy `assessments` table should not be used for the unified assessment system.

## Development style

- Prefer small targeted changes.
- Do not perform unnecessary refactors.
- Preserve existing functionality when fixing bugs.
- Search for existing patterns before introducing new abstractions.
- Follow existing Tailwind styling conventions.
- Maintain responsive/mobile behavior.

## Validation

After meaningful code changes:

- Check TypeScript errors.
- Check imports.
- Check server/client component boundaries.
- Run the project's available lint/build checks when appropriate.
- Explain what files were changed and why before considering the task complete.

## Security and privacy rules

- Never bypass or disable Supabase RLS to make a feature work.
- Never use the Supabase service-role key in browser/client code.
- Never expose server-only secrets through `NEXT_PUBLIC_*` variables.
- Preserve ownership checks using the authenticated user's `user_id`.
- Any new patient-specific table must have RLS enabled before it is considered complete.
- Any new patient-specific query or mutation must be scoped to the authenticated user.
- Keep the `client-documents` Storage bucket private.
- Do not make patient documents publicly accessible.
- Do not log SOAPIE text, clinical notes, document contents, or other unnecessary PHI into console logs or audit metadata.
- Do not send identifiable client information to third-party AI services unless explicitly requested and the privacy architecture has been approved.
- Never commit `.env.local`, API keys, tokens, passwords, Supabase credentials, or client data to Git.

## Audit logging

Preserve the existing audit logging system.

Important mutations should continue to call `logAuditEvent()` where appropriate.

Current audit events include:
- visit_saved
- document_uploaded
- document_deleted
- assessment_saved
- assessment_updated
- visit_draft_discarded
- client_archived
- appointment_created
- appointment_updated
- appointment_cancelled

Do not place full clinical notes or document contents inside audit-log `details`.

## Database ownership

- `user_id` represents the clinician who owns the record in the current beta architecture.
- `client_id` relationships must not be trusted by themselves; mutations should also validate/scoped ownership through `user_id`.
- Do not introduce shared-client, organization, admin, or cross-user access without explicitly redesigning authorization first.

## Data integrity

- `archived = true` does NOT mean that a client record is deleted.
- Do not permanently delete finalized clinical records unless the task explicitly requires a reviewed deletion workflow.
- Draft findings may be deleted when their associated open visit draft is intentionally discarded.
- Do not silently overwrite historical clinical records.
- Preserve exact clinician-entered intervention text unless the clinician explicitly edits it.

## Supabase patterns

- Use `@/lib/supabase/server` in Server Actions and Server Components.
- Use the browser Supabase client only in Client Components where required.
- Prefer existing server actions over introducing unnecessary API routes.
- Check Supabase errors after inserts, updates, deletes, Storage operations, and authentication operations.

## Scope control

- Do not change database schema, RLS policies, authentication behavior, storage policies, or deployment configuration unless the requested task actually requires it.
- Do not rename tables, columns, routes, or core files merely for cleanup.
- Do not perform broad refactors while fixing a localized bug.
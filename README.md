# ContentRoute

ContentRoute is a private, owner-only LinkedIn publishing workspace for researching, drafting, evaluating, scheduling, and auditing evidence-backed posts.

This repository follows the MVP build specification in `ContentRoute-Codex-Build-Spec.md` (kept outside the repository as the supplied brief). The initial deployment target is Vercel with Supabase, OpenRouter, and official LinkedIn OAuth.

## Status

Initial repository scaffold. The application is intentionally fail-closed: publishing integrations must be configured before any post can be sent.

## Planned stack

- Next.js App Router and TypeScript
- Supabase PostgreSQL/Auth with Row Level Security
- OpenRouter for structured planning, drafting, evaluation, and revision
- Official LinkedIn OAuth and publishing APIs
- Vercel Cron for protected generation and publishing routes

## Development

The implementation will be added in vertical slices, beginning with authenticated ideas → sources → draft evaluation → scheduling and audit records.

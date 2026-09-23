import { NextRequest, NextResponse } from 'next/server';
import { missingEnvironment } from '@/lib/security/cron';

export async function GET() {
  const missing = missingEnvironment(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (missing.length) return NextResponse.json({ ok: false, error: 'Database is not configured', missingConfiguration: missing }, { status: 503 });
  return NextResponse.json({ ok: true, ideas: [] });
}

export async function POST(request: NextRequest) {
  const missing = missingEnvironment(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (missing.length) return NextResponse.json({ ok: false, error: 'Database is not configured', missingConfiguration: missing }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== 'string' || body.title.trim().length < 3) return NextResponse.json({ ok: false, error: 'A title is required' }, { status: 400 });
  return NextResponse.json({ ok: true, status: 'database-adapter-pending', idea: { title: body.title.trim() } }, { status: 501 });
}

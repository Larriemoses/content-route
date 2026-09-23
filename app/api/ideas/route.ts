import { NextRequest, NextResponse } from 'next/server';
import { missingEnvironment } from '@/lib/security/cron';
import { getAdminClient } from '@/lib/db/supabase';

export async function GET() {
  const missing = missingEnvironment(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (missing.length) return NextResponse.json({ ok: false, error: 'Database is not configured', missingConfiguration: missing }, { status: 503 });
  const { data, error } = await getAdminClient().from('content_ideas').select('id,title,raw_note,route_id,status,created_at').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: 'Unable to read ideas', detail: error.message }, { status: 502 });
  return NextResponse.json({ ok: true, ideas: data ?? [] });
}

export async function POST(request: NextRequest) {
  const missing = missingEnvironment(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (missing.length) return NextResponse.json({ ok: false, error: 'Database is not configured', missingConfiguration: missing }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== 'string' || body.title.trim().length < 3) return NextResponse.json({ ok: false, error: 'A title is required' }, { status: 400 });
  const { data, error } = await getAdminClient().from('content_ideas').insert({ title: body.title.trim(), raw_note: typeof body.rawNote === 'string' ? body.rawNote : '', status: 'new' }).select('id,title,raw_note,route_id,status,created_at').single();
  if (error) return NextResponse.json({ ok: false, error: 'Unable to create idea', detail: error.message }, { status: 502 });
  return NextResponse.json({ ok: true, idea: data }, { status: 201 });
}

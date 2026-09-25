import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('content_drafts').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: 'Draft queue unavailable' }, { status: 502 });
  return NextResponse.json({ ok: true, drafts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.headline || !body.body) return NextResponse.json({ ok: false, error: 'headline and body are required' }, { status: 400 });
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('content_drafts').insert({ headline: body.headline, body: body.body, follow_up_comment: body.followUpComment ?? null, source_urls: body.sourceUrls ?? [], status: body.status ?? 'review', scheduled_for: body.scheduledFor ?? null }).select('*').single();
  if (error) return NextResponse.json({ ok: false, error: 'Draft could not be saved' }, { status: 502 });
  return NextResponse.json({ ok: true, draft: data }, { status: 201 });
}

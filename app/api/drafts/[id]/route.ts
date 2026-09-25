import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const input = await request.json();
  const allowed = ['status', 'follow_up_comment', 'scheduled_for'] as const;
  const updates = Object.fromEntries(allowed.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]));
  if (!Object.keys(updates).length) return NextResponse.json({ ok: false, error: 'No changes supplied' }, { status: 400 });
  const { data, error } = await getAdminClient().from('content_drafts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ ok: false, error: 'Draft could not be updated' }, { status: 502 });
  return NextResponse.json({ ok: true, draft: data });
}

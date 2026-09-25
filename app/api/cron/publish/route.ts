import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/security/cron';
import { getAdminClient } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const now = new Date().toISOString();
  const db = getAdminClient();
  const { data: draft, error: draftError } = await db.from('content_drafts')
    .select('*')
    .eq('status', 'scheduled')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (draftError) return NextResponse.json({ ok: false, error: 'Scheduled queue unavailable' }, { status: 502 });
  if (!draft) return NextResponse.json({ ok: true, action: 'publish', status: 'idle', published: 0 });

  const { data: connection, error: connectionError } = await db.from('linkedin_connections')
    .select('access_token, member_sub, expires_at')
    .eq('provider', 'linkedin')
    .maybeSingle();
  if (connectionError) return NextResponse.json({ ok: false, error: 'LinkedIn connection unavailable' }, { status: 502 });
  if (!connection?.access_token || !connection.member_sub) {
    return NextResponse.json({ ok: false, error: 'LinkedIn member identity is missing; reconnect LinkedIn before publishing' }, { status: 409 });
  }
  if (connection.expires_at && new Date(connection.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ ok: false, error: 'LinkedIn connection expired; reconnect LinkedIn before publishing' }, { status: 409 });
  }

  const linkedinResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:person:${connection.member_sub}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: draft.body },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });
  if (!linkedinResponse.ok) {
    const detail = await linkedinResponse.text().catch(() => '');
    return NextResponse.json({ ok: false, error: 'LinkedIn rejected the post', detail: detail.slice(0, 500) }, { status: 502 });
  }
  const postUrn = linkedinResponse.headers.get('x-restli-id');
  const { error: updateError } = await db.from('content_drafts').update({ status: 'published', linkedin_post_urn: postUrn, updated_at: now }).eq('id', draft.id);
  if (updateError) return NextResponse.json({ ok: false, error: 'Published, but queue status could not be updated', postUrn }, { status: 502 });
  return NextResponse.json({ ok: true, action: 'publish', status: 'published', published: 1, draftId: draft.id, postUrn });
}

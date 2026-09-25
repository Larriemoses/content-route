import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  const state = params.get('state');
  const expectedState = request.cookies.get('linkedin_oauth_state')?.value;
  if (!code || !state || state !== expectedState) return NextResponse.json({ ok: false, error: 'Invalid LinkedIn OAuth state' }, { status: 400 });
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return NextResponse.json({ ok: false, error: 'LinkedIn OAuth is not configured' }, { status: 503 });
  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }) });
  if (!tokenResponse.ok) return NextResponse.json({ ok: false, error: 'LinkedIn token exchange failed' }, { status: 502 });
  const token = await tokenResponse.json() as { access_token?: string; expires_in?: number };
  if (!token.access_token) return NextResponse.json({ ok: false, error: 'LinkedIn returned no access token' }, { status: 502 });
  const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` } });
  const profile = profileResponse.ok ? await profileResponse.json() : {};
  const db = getAdminClient();
  const { error } = await db.from('linkedin_connections').upsert({ provider: 'linkedin', member_sub: profile.sub ?? null, access_token: token.access_token, expires_at: new Date(Date.now() + (token.expires_in ?? 5184000) * 1000).toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'provider' });
  if (error) return NextResponse.json({ ok: false, error: 'LinkedIn connected but could not be stored' }, { status: 502 });
  const response = new NextResponse('<h1>LinkedIn connected</h1><p>You can close this window and return to Writeet.</p>', { headers: { 'content-type': 'text/html' } });
  response.cookies.delete('linkedin_oauth_state');
  return response;
}

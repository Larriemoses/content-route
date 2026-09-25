import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  if (!clientId || !redirectUri) return NextResponse.json({ ok: false, error: 'LinkedIn OAuth is not configured' }, { status: 503 });
  const state = crypto.randomBytes(24).toString('hex');
  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'w_member_social');
  const response = NextResponse.redirect(url);
  response.cookies.set('linkedin_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' });
  return response;
}

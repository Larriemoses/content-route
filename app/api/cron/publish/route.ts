import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/security/cron';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Publishing remains fail-closed until the owner explicitly connects LinkedIn.
  return NextResponse.json({ ok: true, action: 'publish', status: 'paused', published: 0 });
}

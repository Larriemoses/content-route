import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/security/cron';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Generation is intentionally inert until Supabase and OpenRouter are configured.
  return NextResponse.json({ ok: true, action: 'generate', status: 'not-configured', generated: 0 });
}

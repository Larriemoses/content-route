import { NextResponse } from 'next/server';
import { missingEnvironment } from '@/lib/security/cron';

export async function GET() {
  const missing = missingEnvironment(['CRON_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  return NextResponse.json({
    ok: missing.length === 0,
    service: 'content-route',
    publishing: 'paused-by-default',
    missingConfiguration: missing,
  }, { status: missing.length === 0 ? 200 : 503 });
}

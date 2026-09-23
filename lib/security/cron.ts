import { NextRequest } from 'next/server';

export function isAuthorizedCron(request: NextRequest) {
  const configured = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization');
  if (!configured || !supplied) return false;
  return supplied === `Bearer ${configured}`;
}

export function missingEnvironment(keys: string[]) {
  return keys.filter((key) => !process.env[key]);
}

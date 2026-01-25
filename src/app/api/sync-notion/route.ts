import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { syncNotionToWordPress } from '@/lib/sync-service';

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });

  // Optional: Simple secret check to prevent unauthorized calls
  const apiKey = req.nextUrl.searchParams.get('key');
  const secret = env.CRON_SECRET || 'test'; // Use a better secret in prod
  if (apiKey !== secret && process.env.NODEJS_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await syncNotionToWordPress(env);

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}

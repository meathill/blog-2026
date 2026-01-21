import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '@/lib/db';
import * as schema from '@/db/schema';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    // @ts-ignore
    const secret = env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
    const authHeader = req.headers.get('Authorization');

    if (!secret) {
      console.error('BETTER_AUTH_SECRET not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password } = body as any;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing name, email, or password' }, { status: 400 });
    }

    const db = await getDb();

    // Create a temporary auth instance with signUp enabled
    const auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: 'sqlite',
        schema: schema,
      }),
      emailAndPassword: {
        enabled: true,
        disableSignUp: false, // Explicitly allow sign up for this admin creation
      },
    });

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    return NextResponse.json({ success: true, user: result.user });
  } catch (error: any) {
    console.error('Setup admin error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

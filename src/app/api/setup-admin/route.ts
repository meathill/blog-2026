import { getDb } from '@/lib/db';
import { user } from '@/db/schema';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from 'better-auth/crypto';

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
    const { name, email, password } = body as { name: string; email: string; password: string };

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing name, email, or password' }, { status: 400 });
    }

    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash password using better-auth's scrypt implementation
    const hashedPassword = await hashPassword(password);

    // Generate a unique ID
    const userId = crypto.randomUUID();
    const now = new Date();

    // Insert user directly
    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    // Insert account with password (better-auth stores credentials in 'account' table)
    // We need to also insert into the account table for email/password auth
    const { account } = await import('@/db/schema');
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId,
      accountId: userId,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      user: { id: userId, name, email },
    });
  } catch (error: any) {
    console.error('Setup admin error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

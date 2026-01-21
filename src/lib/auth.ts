import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db';
import * as schema from '@/db/schema';
import { nextCookies } from 'better-auth/next-js';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });

  return betterAuth({
    baseURL: env.BETTER_AUTH_BASE_URL || 'http://localhost:3100',
    database: drizzleAdapter(await getDb(), {
      provider: 'sqlite',
      schema: schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    plugins: [nextCookies()],
  });
}

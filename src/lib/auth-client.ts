import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // baseURL is automatically inferred in most cases,
  // or we can set it explicitly if needed.
});

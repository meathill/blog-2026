import { getAuth } from '@/lib/auth';

export const GET = async (req: Request) => {
  const auth = await getAuth();
  return auth.handler(req);
};

export const POST = async (req: Request) => {
  const auth = await getAuth();
  return auth.handler(req);
};

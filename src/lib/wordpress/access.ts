interface WordPressAccessEnv {
  WORDPRESS_API_URL?: string;
  CF_ACCESS_CLIENT_ID?: string;
  CF_ACCESS_CLIENT_SECRET?: string;
}

const DEFAULT_WORDPRESS_API_URL = 'https://blog.meathill.com/wp-json/wp/v2';

export function getWordPressApiUrl(env?: WordPressAccessEnv): string {
  return env?.WORDPRESS_API_URL || process.env.WORDPRESS_API_URL || DEFAULT_WORDPRESS_API_URL;
}

export function getWordPressAccessHeaders(env?: WordPressAccessEnv): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'User-Agent': 'Next.js Worker',
  };

  const accessClientId = env?.CF_ACCESS_CLIENT_ID || process.env.CF_ACCESS_CLIENT_ID;
  const accessClientSecret = env?.CF_ACCESS_CLIENT_SECRET || process.env.CF_ACCESS_CLIENT_SECRET;

  if (accessClientId && accessClientSecret) {
    headers['CF-Access-Client-Id'] = accessClientId;
    headers['CF-Access-Client-Secret'] = accessClientSecret;
  }

  return headers;
}

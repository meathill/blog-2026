export function normalizeTagSlug(slug: string): string {
  return slug.toLowerCase().replace(/\./g, '-');
}

export async function resolveBySlugWithNormalizedFallback<T>(
  slug: string,
  resolver: (candidateSlug: string) => Promise<T | null>,
): Promise<T | null> {
  const exactMatch = await resolver(slug);
  if (exactMatch) {
    return exactMatch;
  }

  const normalizedSlug = normalizeTagSlug(slug);
  if (normalizedSlug === slug) {
    return null;
  }

  return resolver(normalizedSlug);
}

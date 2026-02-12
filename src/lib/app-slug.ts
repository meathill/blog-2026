import slugify from 'slugify';

export function buildAppSlug(name: string): string {
  const normalizedInput = name.replace(/_+/g, '-');
  const slug = slugify(normalizedInput, {
    lower: true,
    strict: true,
    trim: true,
  });
  return slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

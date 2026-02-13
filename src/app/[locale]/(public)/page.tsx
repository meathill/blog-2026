import Hero from '@/components/home/Hero';
import RecentPosts from '@/components/home/RecentPosts';
import TagCloud from '@/components/home/TagCloud';
import FeaturedApps from '@/components/home/FeaturedApps';

export const revalidate = 86400;

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedApps />
      <RecentPosts />
      <TagCloud />
    </>
  );
}

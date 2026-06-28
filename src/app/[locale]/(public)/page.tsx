import Hero from '@/components/home/Hero';
import ValueStrip from '@/components/home/ValueStrip';
import Products from '@/components/home/Products';
import Solutions from '@/components/home/Solutions';
import Tools from '@/components/home/Tools';
import RecentPosts from '@/components/home/RecentPosts';
import ContactCTA from '@/components/home/ContactCTA';

export const revalidate = 86400;

export default function Home() {
  return (
    <>
      <Hero />
      <ValueStrip />
      <Products />
      <Solutions />
      <Tools />
      <RecentPosts />
      <ContactCTA />
    </>
  );
}

import Image from 'next/image';
import FeaturedImageClickable from '@/components/posts/featured-image-clickable';

interface FeaturedImageProps {
  src: string;
  alt: string;
}

export default function FeaturedImage({ src, alt }: FeaturedImageProps) {
  return (
    <FeaturedImageClickable src={src} alt={alt}>
      <Image
        src={src}
        alt={alt}
        fill
        preload
        fetchPriority="high"
        loading="eager"
        quality={70}
        className="object-cover"
        sizes="(max-width: 768px) calc(100vw - 2rem), (max-width: 1200px) 768px, 896px"
      />
    </FeaturedImageClickable>
  );
}

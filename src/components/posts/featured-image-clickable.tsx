'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const ImagePreviewDialog = dynamic(() => import('@/components/posts/image-preview-dialog'), { ssr: false });

interface FeaturedImageClickableProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

export default function FeaturedImageClickable({ src, alt, children }: FeaturedImageClickableProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="mb-8 overflow-hidden rounded-xl">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn('relative block w-full cursor-zoom-in', 'aspect-square md:aspect-video')}
          aria-label={`查看大图：${alt}`}
        >
          {children}
        </button>
      </div>

      {isOpen && <ImagePreviewDialog src={src} alt={alt} isOpen={isOpen} onOpenChange={setIsOpen} />}
    </>
  );
}

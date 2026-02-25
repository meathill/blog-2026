'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const ImagePreviewDialog = dynamic(() => import('@/components/posts/image-preview-dialog'), { ssr: false });

interface FeaturedImageProps {
  src: string;
  alt: string;
}

export default function FeaturedImage({ src, alt }: FeaturedImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 固定宽高比容器：移动端 1:1，桌面 16:9 */}
      <div className="mb-8 overflow-hidden rounded-xl">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn('relative block w-full cursor-zoom-in', 'aspect-square md:aspect-video')}
          aria-label={`查看大图：${alt}`}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 768px, 896px"
          />
        </button>
      </div>

      {/* 大图预览弹窗 - 懒加载 */}
      {isOpen && <ImagePreviewDialog src={src} alt={alt} isOpen={isOpen} onOpenChange={setIsOpen} />}
    </>
  );
}

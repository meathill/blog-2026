'use client';

import { useState } from 'react';
import Image from 'next/image';
import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
          className={cn(
            'relative block w-full cursor-zoom-in',
            'aspect-square md:aspect-video',
          )}
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

      {/* 大图预览弹窗 */}
      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0"
          />
          <DialogPrimitive.Viewport
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          >
            <DialogPrimitive.Popup
              className={cn(
                'relative max-h-[90vh] max-w-[90vw]',
                'transition-[scale,opacity] duration-200',
                'data-ending-style:scale-95 data-ending-style:opacity-0',
                'data-starting-style:scale-95 data-starting-style:opacity-0',
              )}
            >
              <DialogPrimitive.Title className="sr-only">
                {alt}
              </DialogPrimitive.Title>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              />
              <DialogPrimitive.Close
                aria-label="关闭"
                className="absolute -top-2 -right-2"
                render={<Button size="icon" variant="ghost" className="bg-black/50 text-white hover:bg-black/70" />}
              >
                <XIcon />
              </DialogPrimitive.Close>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Viewport>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

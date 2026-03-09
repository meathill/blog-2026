'use client';

import Image from 'next/image';
import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImagePreviewDialogProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImagePreviewDialog({ src, alt, isOpen, onOpenChange }: ImagePreviewDialogProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          <DialogPrimitive.Popup
            className={cn(
              'relative max-h-[90vh] max-w-[90vw]',
              'transition-[scale,opacity] duration-200',
              'data-ending-style:scale-95 data-ending-style:opacity-0',
              'data-starting-style:scale-95 data-starting-style:opacity-0',
            )}
          >
            <DialogPrimitive.Title className="sr-only">{alt}</DialogPrimitive.Title>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              width={1000}
              height={1000}
              quality={75}
              sizes="90vw"
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
  );
}

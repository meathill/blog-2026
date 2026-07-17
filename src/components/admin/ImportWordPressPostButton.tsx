'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

export default function ImportWordPressPostButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" variant="outline" className="w-full" disabled={pending}>
      {pending ? '导入中…' : '导入并编辑'}
    </Button>
  );
}

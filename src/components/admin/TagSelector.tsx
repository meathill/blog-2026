'use client';

import { useState, useEffect } from 'react';
import { XIcon, PlusIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface TagSelectorProps {
  appId?: string;
  initialTags?: Tag[];
  allTags: Tag[];
  onChange?: (tagIds: string[]) => void;
}

export default function TagSelector({ appId, initialTags = [], allTags, onChange }: TagSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags);
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const availableTags = allTags.filter((tag) => !selectedTags.some((s) => s.id === tag.id));

  function handleAddTag(tag: Tag) {
    const newSelected = [...selectedTags, tag];
    setSelectedTags(newSelected);
    onChange?.(newSelected.map((t) => t.id));
    setIsOpen(false);
  }

  function handleRemoveTag(tagId: string) {
    const newSelected = selectedTags.filter((t) => t.id !== tagId);
    setSelectedTags(newSelected);
    onChange?.(newSelected.map((t) => t.id));
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      const { createTag } = await import('@/actions/tags');
      const formData = new FormData();
      formData.append('name', newTagName.trim());
      const newTag = await createTag(formData);

      // Add to selected tags
      const newSelected = [...selectedTags, newTag];
      setSelectedTags(newSelected);
      onChange?.(newSelected.map((t) => t.id));

      setNewTagName('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">Tags</label>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:text-amber-600 dark:hover:text-amber-300"
            >
              <XIcon size={12} />
            </button>
          </span>
        ))}

        {/* Add tag button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border border-dashed border-input text-muted-foreground hover:border-amber-500 hover:text-amber-500 transition-colors"
        >
          <PlusIcon size={12} />
          添加标签
        </button>
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name="tagIds" value={selectedTags.map((t) => t.id).join(',')} />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 rounded-lg border border-input bg-popover shadow-lg">
          <div className="p-2">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="新建标签..."
                className="flex-1 px-2 py-1 text-sm rounded border border-input bg-transparent focus:border-amber-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={isCreating || !newTagName.trim()}
                className="px-2 py-1 text-xs rounded bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {isCreating ? <Loader2 size={12} className="animate-spin" /> : '创建'}
              </button>
            </div>

            {availableTags.length > 0 && (
              <div className="max-h-32 overflow-y-auto">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="block w-full text-left px-2 py-1 text-sm rounded hover:bg-accent"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

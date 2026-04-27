import { Link } from '@/i18n/routing';
import { SparklesIcon } from 'lucide-react';
import type { Skill } from '@/lib/skills';
import { getLocalizedDescription } from '@/lib/skills';

interface SkillCardProps {
  skill: Skill;
  locale: string;
}

export default function SkillCard({ skill, locale }: SkillCardProps) {
  const description = getLocalizedDescription(skill, locale);
  return (
    <div className="card-hover group relative flex flex-col rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
          <SparklesIcon size={22} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-lg text-foreground group-hover:text-amber-600 transition-colors truncate">
            <Link href={`/skills/${skill.slug}`}>
              <span className="absolute inset-0" />
              {skill.name}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground truncate">{skill.package}</p>
        </div>
      </div>

      <p className="line-clamp-3 text-sm text-muted-foreground flex-grow">{description}</p>

      {skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          {skill.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

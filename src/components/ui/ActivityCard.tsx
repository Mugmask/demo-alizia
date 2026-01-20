import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityCardProps {
  title: string;
  subtitle: string;
  description: string;
  badgeText?: string;
  onClick: () => void;
}

export function ActivityCard({ title, subtitle, description, badgeText = 'Activo', onClick }: ActivityCardProps) {
  return (
    <div
      className="cursor-pointer activity-card-shadow transition-all fill-primary border-[#E4E8EF] p-4 group rounded-3xl"
      onClick={onClick}
    >
      <div className="flex flex-col h-full gap-4">
        <div className="flex items-center justify-between">
          <span className="callout-regular text-foreground">{subtitle}</span>
          <Badge variant="secondary" className="bg-[#01CEAA4D] callout-regular text-foreground rounded-xl px-2 py-1">
            {badgeText}
          </Badge>
        </div>

        <h3 className="title-3-emphasized text-[#10182B]">{title}</h3>

        <p className="body-2-regular text-secondary-foreground">{description}</p>

        <div className="mt-auto flex justify-end">
          <ArrowRight className="size-6 text-secondary-foreground group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
}

export function ActivityCardSkeleton() {
  return (
    <div className="bg-white/60 backdrop-blur-sm border-slate-200 p-4 rounded-3xl">
      <div className="flex flex-col h-full gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-12 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-24" />
        <div className="mt-auto flex justify-end">
          <Skeleton className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}

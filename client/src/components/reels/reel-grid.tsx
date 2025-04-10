import { Link } from "wouter";
import { Film, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Reel {
  id: number;
  thumbnailUrl: string | null;
  duration: number | null;
  createdAt: string;
}

interface ReelGridProps {
  reels: Reel[];
  isLoading?: boolean;
}

export default function ReelGrid({ reels, isLoading = false }: ReelGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="aspect-[9/16] relative">
            <Skeleton className="w-full h-full" />
          </div>
        ))}
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Film className="h-14 w-14 text-neutral-300 dark:text-neutral-600 mb-4" />
        <p className="text-neutral-500 dark:text-neutral-400 text-center">
          No reels yet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4 p-1 md:p-4">
      {reels.map((reel) => (
        <Link href={`/reels/${reel.id}`} key={reel.id}>
          <a className="relative block aspect-[9/16] bg-neutral-200 dark:bg-neutral-700 overflow-hidden group">
            {reel.thumbnailUrl ? (
              <img
                src={reel.thumbnailUrl}
                alt="Reel thumbnail"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-300 dark:bg-neutral-700">
                <Film className="h-10 w-10 text-neutral-500 dark:text-neutral-400" />
              </div>
            )}
            
            {/* Reel icon and duration */}
            <div className="absolute bottom-2 right-2 flex items-center text-white text-xs bg-black/50 px-2 py-1 rounded-full">
              <Film className="h-3 w-3 mr-1" />
              {reel.duration ? (
                <span>{Math.floor(reel.duration / 60)}:{(reel.duration % 60).toString().padStart(2, '0')}</span>
              ) : (
                <Clock className="h-3 w-3" />
              )}
            </div>
          </a>
        </Link>
      ))}
    </div>
  );
}
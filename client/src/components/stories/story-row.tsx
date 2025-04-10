import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Story {
  user: {
    id: number;
    username: string;
    profileImage: string | null;
  } | null;
  stories: any[];
}

export default function StoryRow() {
  const { data: stories, isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });
  
  if (isLoading) {
    return (
      <section className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700 p-4 overflow-x-auto">
        <div className="flex space-x-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-12 h-3 mt-1" />
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  if (!stories || stories.length === 0) {
    return null;
  }
  
  return (
    <section className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700 p-4 overflow-x-auto">
      <div className="flex space-x-4">
        {stories.map((storyGroup) => (
          <div key={storyGroup.user?.id} className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-yellow-500 p-[2px]">
              <Avatar className="w-full h-full border-2 border-neutral-100 dark:border-neutral-800">
                <AvatarImage 
                  src={storyGroup.user?.profileImage || ""} 
                  className="w-full h-full object-cover rounded-full" 
                />
                <AvatarFallback className="text-lg">
                  {storyGroup.user?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs mt-1 truncate w-16 text-center">
              {storyGroup.user?.username}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

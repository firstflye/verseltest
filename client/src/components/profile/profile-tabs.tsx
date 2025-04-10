import { useState } from "react";
import { Grid, Film, Bookmark, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PostGrid from "@/components/posts/post-grid";
import ReelGrid from "@/components/reels/reel-grid";

interface Post {
  id: number;
  imageUrl: string;
  createdAt: string;
}

interface Reel {
  id: number;
  thumbnailUrl: string | null;
  duration: number | null;
  createdAt: string;
}

interface ProfileTabsProps {
  posts: Post[];
  username: string;
}

type TabType = "posts" | "reels" | "saved" | "tagged";

export default function ProfileTabs({ posts, username }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  
  const { data: reels, isLoading: isReelsLoading } = useQuery<Reel[]>({
    queryKey: [`/api/users/${username}/reels`],
    enabled: activeTab === "reels", // Only fetch when reels tab is active
  });
  
  return (
    <div className="bg-neutral-100 dark:bg-neutral-800 mt-4 md:rounded-lg border border-neutral-300 dark:border-neutral-700">
      <div className="flex border-b border-neutral-300 dark:border-neutral-700">
        <button 
          className={`flex-1 py-3 flex items-center justify-center ${
            activeTab === "posts" 
              ? "border-b-2 border-neutral-700 dark:border-neutral-100" 
              : "text-neutral-500 dark:text-neutral-400"
          }`}
          onClick={() => setActiveTab("posts")}
        >
          <Grid className="h-5 w-5" />
          <span className="ml-2 text-sm font-medium">Posts</span>
        </button>
        <button 
          className={`flex-1 py-3 flex items-center justify-center ${
            activeTab === "reels" 
              ? "border-b-2 border-neutral-700 dark:border-neutral-100" 
              : "text-neutral-500 dark:text-neutral-400"
          }`}
          onClick={() => setActiveTab("reels")}
        >
          <Film className="h-5 w-5" />
          <span className="ml-2 text-sm font-medium">Reels</span>
        </button>
        <button 
          className={`flex-1 py-3 flex items-center justify-center ${
            activeTab === "saved" 
              ? "border-b-2 border-neutral-700 dark:border-neutral-100" 
              : "text-neutral-500 dark:text-neutral-400"
          }`}
          onClick={() => setActiveTab("saved")}
        >
          <Bookmark className="h-5 w-5" />
          <span className="ml-2 text-sm font-medium">Saved</span>
        </button>
        <button 
          className={`flex-1 py-3 flex items-center justify-center ${
            activeTab === "tagged" 
              ? "border-b-2 border-neutral-700 dark:border-neutral-100" 
              : "text-neutral-500 dark:text-neutral-400"
          }`}
          onClick={() => setActiveTab("tagged")}
        >
          <Tag className="h-5 w-5" />
          <span className="ml-2 text-sm font-medium">Tagged</span>
        </button>
      </div>
      
      {activeTab === "posts" && <PostGrid posts={posts} />}
      {activeTab === "reels" && (
        <ReelGrid reels={reels || []} isLoading={isReelsLoading} />
      )}
      {activeTab === "saved" && (
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-neutral-500 dark:text-neutral-400 text-center">
            Only you can see what you've saved
          </p>
        </div>
      )}
      {activeTab === "tagged" && (
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-neutral-500 dark:text-neutral-400 text-center">
            No photos or videos of you
          </p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import PostGrid from "@/components/posts/post-grid";
import ReelGrid from "@/components/reels/reel-grid";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";

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

export default function ExplorePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Check user preference when page loads
  useEffect(() => {
    const userPreference = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (userPreference === 'dark' || (!userPreference && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);
  
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
    setIsDarkMode(isDark);
  };
  
  const { data: posts, isLoading: isPostsLoading } = useQuery<Post[]>({
    queryKey: ['/api/explore/posts'],
  });
  
  const { data: reels, isLoading: isReelsLoading } = useQuery<Reel[]>({
    queryKey: ['/api/explore/reels'],
  });
  
  return (
    <div className="flex flex-col h-screen md:flex-row">
      <MobileHeader toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center space-x-3 mb-6">
            <Compass className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">Explore</h1>
          </div>
          
          <Tabs defaultValue="popular">
            <TabsList className="mb-6">
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="following">For You</TabsTrigger>
            </TabsList>
            
            <TabsContent value="popular" className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Top Posts</h2>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-4">
                  {isPostsLoading ? (
                    <div className="grid grid-cols-3 gap-4">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                    </div>
                  ) : posts && posts.length > 0 ? (
                    <PostGrid posts={posts} />
                  ) : (
                    <div className="py-8 text-center text-neutral-500">
                      <Compass className="h-10 w-10 mx-auto mb-4 text-neutral-400" />
                      <p>No posts to explore yet</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Trending Reels</h2>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-4">
                  {isReelsLoading ? (
                    <div className="grid grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[9/16] rounded-lg" />
                      ))}
                    </div>
                  ) : reels && reels.length > 0 ? (
                    <ReelGrid reels={reels} />
                  ) : (
                    <div className="py-8 text-center text-neutral-500">
                      <Compass className="h-10 w-10 mx-auto mb-4 text-neutral-400" />
                      <p>No reels to explore yet</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="recent">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-8 text-center">
                <Compass className="h-10 w-10 mx-auto mb-4 text-neutral-400" />
                <p className="text-neutral-500">Most recent posts will appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="following">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-8 text-center">
                <Compass className="h-10 w-10 mx-auto mb-4 text-neutral-400" />
                <p className="text-neutral-500">Follow more people to see personalized recommendations</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
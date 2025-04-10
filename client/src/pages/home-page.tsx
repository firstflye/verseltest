import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StoryRow from "@/components/stories/story-row";
import PostCard from "@/components/posts/post-card";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
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
  
  const { data: posts, isLoading } = useQuery({
    queryKey: ['/api/posts'],
  });
  
  return (
    <div className="flex flex-col h-screen md:flex-row">
      <MobileHeader toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <StoryRow />
        
        <div className="max-w-xl mx-auto p-0 md:p-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="mb-6">
                <div className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg">
                  <div className="flex items-center p-3">
                    <Skeleton className="w-8 h-8 rounded-full mr-2" />
                    <div>
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-16 h-3 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="w-full h-96" />
                  <div className="p-3">
                    <Skeleton className="w-32 h-4 mb-2" />
                    <Skeleton className="w-full h-4 mb-1" />
                    <Skeleton className="w-1/2 h-4" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            posts?.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}

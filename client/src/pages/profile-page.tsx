import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import ProfileHeader from "@/components/profile/profile-header";
import StoryHighlights from "@/components/profile/story-highlights";
import ProfileTabs from "@/components/profile/profile-tabs";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { username } = useParams();
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
  
  const { data: profile, isLoading } = useQuery({
    queryKey: [`/api/users/${username}`],
    enabled: !!username
  });
  
  return (
    <div className="flex flex-col h-screen md:flex-row">
      <MobileHeader toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <section className="max-w-4xl mx-auto p-0 md:p-4">
          {isLoading ? (
            <>
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 md:rounded-lg border border-neutral-300 dark:border-neutral-700">
                <div className="flex flex-col md:flex-row md:items-start">
                  <div className="flex justify-center md:justify-start md:w-1/3 mb-4 md:mb-0">
                    <Skeleton className="w-20 h-20 md:w-32 md:h-32 rounded-full" />
                  </div>
                  <div className="md:w-2/3">
                    <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                      <Skeleton className="w-32 h-6" />
                      <Skeleton className="w-24 h-9" />
                    </div>
                    <div className="flex justify-around md:justify-start space-x-4 md:space-x-8 py-4">
                      <Skeleton className="w-16 h-5" />
                      <Skeleton className="w-16 h-5" />
                      <Skeleton className="w-16 h-5" />
                    </div>
                    <Skeleton className="w-48 h-4 mb-2" />
                    <Skeleton className="w-full h-4 mb-2" />
                    <Skeleton className="w-32 h-4" />
                  </div>
                </div>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 mt-4 md:rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-x-auto">
                <div className="flex space-x-6">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <Skeleton className="w-10 h-3 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : profile ? (
            <>
              <ProfileHeader profile={profile} />
              <StoryHighlights />
              <ProfileTabs posts={profile.posts} username={username || ""} />
            </>
          ) : (
            <div className="bg-neutral-100 dark:bg-neutral-800 p-4 md:rounded-lg border border-neutral-300 dark:border-neutral-700 text-center py-10">
              <p className="text-xl">User not found</p>
            </div>
          )}
        </section>
      </main>
      
      <MobileNav />
    </div>
  );
}

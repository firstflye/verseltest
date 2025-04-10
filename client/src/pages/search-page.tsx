import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";

interface User {
  id: number;
  username: string;
  name: string | null;
  profileImage: string | null;
}

export default function SearchPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
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
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { data: searchResults, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/search', debouncedQuery],
    enabled: debouncedQuery.length >= 2
  });
  
  const handleClearSearch = () => {
    setSearchQuery("");
  };
  
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <div className="flex flex-col h-screen md:flex-row">
      <MobileHeader toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Search</h1>
          
          <div className="relative mb-6">
            <Input 
              type="text"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            {searchQuery && (
              <button 
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
          
          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700">
            {!debouncedQuery && (
              <div className="p-8 text-center text-neutral-500">
                <Search className="h-10 w-10 mx-auto mb-4 text-neutral-400" />
                <p>Search for users by typing their name or username</p>
              </div>
            )}
            
            {debouncedQuery && debouncedQuery.length < 2 && (
              <div className="p-8 text-center text-neutral-500">
                <p>Please enter at least 2 characters</p>
              </div>
            )}
            
            {debouncedQuery && debouncedQuery.length >= 2 && isLoading && (
              <div className="divide-y divide-neutral-300 dark:divide-neutral-700">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {debouncedQuery && !isLoading && searchResults && (
              <div className="divide-y divide-neutral-300 dark:divide-neutral-700">
                {searchResults.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    <p>No users found for "{debouncedQuery}"</p>
                  </div>
                ) : (
                  searchResults.map(user => (
                    <Link key={user.id} href={`/profile/${user.username}`}>
                      <div className="flex items-center gap-4 p-4 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profileImage || ""} />
                          <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          {user.name && <p className="text-sm text-neutral-500">{user.name}</p>}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Film, Heart, MessageCircle, Share2, X, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";

interface Reel {
  id: number;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  userId: number;
  duration: number | null;
  createdAt: string;
  user: {
    id: number;
    username: string;
    name: string | null;
    profileImage: string | null;
  } | null;
}

export default function ReelsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  
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
  
  const { data: reels, isLoading } = useQuery<Reel[]>({
    queryKey: ['/api/reels'],
  });
  
  useEffect(() => {
    if (reels && reels.length > 0) {
      videoRefs.current = videoRefs.current.slice(0, reels.length);
    }
  }, [reels]);
  
  const playPauseVideo = (index: number) => {
    if (!reels || !videoRefs.current[index]) return;
    
    const video = videoRefs.current[index];
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const goToNextReel = () => {
    if (!reels) return;
    
    // Pause current video
    const currentVideo = videoRefs.current[currentReelIndex];
    if (currentVideo) {
      currentVideo.pause();
      setIsPlaying(false);
    }
    
    // Move to next reel
    if (currentReelIndex < reels.length - 1) {
      setCurrentReelIndex(prev => prev + 1);
    }
  };
  
  const goToPrevReel = () => {
    if (!reels) return;
    
    // Pause current video
    const currentVideo = videoRefs.current[currentReelIndex];
    if (currentVideo) {
      currentVideo.pause();
      setIsPlaying(false);
    }
    
    // Move to previous reel
    if (currentReelIndex > 0) {
      setCurrentReelIndex(prev => prev - 1);
    }
  };
  
  // Handle video visibility based on current index
  useEffect(() => {
    if (!reels) return;
    
    // Pause all videos
    videoRefs.current.forEach(video => {
      if (video) video.pause();
    });
    
    setIsPlaying(false);
  }, [currentReelIndex, reels]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen md:flex-row bg-black">
        <MobileHeader toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
        <Sidebar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
        
        <main className="flex-1 flex justify-center items-center">
          <Skeleton className="w-full max-w-md h-[80vh] aspect-[9/16] rounded-lg bg-neutral-800" />
        </main>
        
        <MobileNav />
      </div>
    );
  }
  
  if (!reels || reels.length === 0) {
    return (
      <div className="flex flex-col h-screen md:flex-row bg-black">
        <MobileHeader toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
        <Sidebar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
        
        <main className="flex-1 flex flex-col justify-center items-center text-white">
          <Film className="h-16 w-16 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Reels Available</h2>
          <p className="text-neutral-400">Check back later for new content</p>
        </main>
        
        <MobileNav />
      </div>
    );
  }
  
  const currentReel = reels[currentReelIndex];
  
  return (
    <div className="flex flex-col h-screen md:flex-row bg-black">
      <MobileHeader toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      
      <main className="flex-1 relative flex justify-center items-center overflow-hidden">
        {/* Video Player */}
        <div className="relative w-full max-w-md h-[80vh] mx-auto">
          {reels.map((reel, index) => (
            <div 
              key={reel.id}
              className={`absolute inset-0 ${index === currentReelIndex ? 'block' : 'hidden'}`}
            >
              <div className="w-full h-full flex justify-center items-center relative">
                <video
                  ref={el => videoRefs.current[index] = el}
                  src={reel.videoUrl}
                  poster={reel.thumbnailUrl || undefined}
                  className="w-full h-full object-cover rounded-lg"
                  playsInline
                  loop
                  onClick={() => playPauseVideo(index)}
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Play/Pause Overlay */}
                {!isPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={() => playPauseVideo(index)}
                  >
                    <Play className="h-16 w-16 text-white opacity-80" />
                  </div>
                )}
                
                {/* Caption */}
                {reel.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <p>{reel.caption}</p>
                  </div>
                )}
                
                {/* User Info */}
                <div className="absolute top-4 left-4 flex items-center space-x-2 text-white">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-700">
                    {reel.user?.profileImage ? (
                      <img 
                        src={reel.user.profileImage} 
                        alt={reel.user.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-500" />
                    )}
                  </div>
                  <span className="font-medium">{reel.user?.username}</span>
                </div>
                
                {/* Action Buttons */}
                <div className="absolute right-4 bottom-16 flex flex-col space-y-6 text-white items-center">
                  <Button variant="ghost" size="icon" className="rounded-full bg-neutral-800/50 h-10 w-10">
                    <Heart className="h-6 w-6" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full bg-neutral-800/50 h-10 w-10">
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full bg-neutral-800/50 h-10 w-10">
                    <Share2 className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Navigation */}
          <button 
            className={`absolute top-1/2 left-2 transform -translate-y-1/2 p-2 rounded-full bg-neutral-800/50 text-white ${currentReelIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-80 hover:opacity-100'}`}
            onClick={goToPrevReel}
            disabled={currentReelIndex === 0}
          >
            <X className="rotate-45 h-6 w-6" />
          </button>
          
          <button 
            className={`absolute top-1/2 right-2 transform -translate-y-1/2 p-2 rounded-full bg-neutral-800/50 text-white ${currentReelIndex === reels.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-80 hover:opacity-100'}`}
            onClick={goToNextReel}
            disabled={currentReelIndex === reels.length - 1}
          >
            <X className="-rotate-45 h-6 w-6" />
          </button>
          
          {/* Progress Indicator */}
          <div className="absolute top-2 left-0 right-0 px-4 flex space-x-1">
            {reels.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 flex-1 rounded-full ${i === currentReelIndex ? 'bg-white' : 'bg-neutral-600'}`}
              />
            ))}
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
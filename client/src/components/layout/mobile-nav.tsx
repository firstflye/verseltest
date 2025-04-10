import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Home, Search, PlusSquare, Heart, Film } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <nav className="md:hidden bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-300 dark:border-neutral-700 py-2 px-4 fixed bottom-0 left-0 right-0 z-30">
      <div className="flex justify-between items-center">
        <Link href="/">
          <div className={`flex flex-col items-center ${location === "/" ? "text-primary" : ""} cursor-pointer`}>
            <Home className="h-6 w-6" />
          </div>
        </Link>
        <Link href="/search">
          <div className={`flex flex-col items-center ${location === "/search" ? "text-primary" : ""} cursor-pointer`}>
            <Search className="h-6 w-6" />
          </div>
        </Link>
        <Link href="/reels">
          <div className={`flex flex-col items-center ${location === "/reels" ? "text-primary" : ""} cursor-pointer`}>
            <Film className="h-6 w-6" />
          </div>
        </Link>
        <Link href="/create">
          <div className={`flex flex-col items-center ${location === "/create" ? "text-primary" : ""} cursor-pointer`}>
            <PlusSquare className="h-7 w-7" />
          </div>
        </Link>
        <Link href="/notifications">
          <div className={`flex flex-col items-center ${location === "/notifications" ? "text-primary" : ""} cursor-pointer`}>
            <Heart className="h-6 w-6" />
          </div>
        </Link>
        <Link href={`/profile/${user?.username}`}>
          <div className={`flex flex-col items-center ${location.startsWith("/profile") ? "text-primary" : ""} cursor-pointer`}>
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.profileImage ? user.profileImage : ""} />
              <AvatarFallback>{user?.username ? getInitials(user.username) : "U"}</AvatarFallback>
            </Avatar>
          </div>
        </Link>
      </div>
    </nav>
  );
}

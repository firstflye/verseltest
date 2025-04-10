import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Search, 
  Compass, 
  Film, 
  MessageCircle, 
  Heart, 
  PlusSquare, 
  User, 
  Moon, 
  Sun, 
  Settings 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface SidebarProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

export default function Sidebar({ toggleDarkMode, isDarkMode }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const NavItem = ({ 
    href, 
    icon: Icon, 
    label, 
    isActive 
  }: { 
    href: string; 
    icon: any; 
    label: string; 
    isActive?: boolean;
  }) => (
    <li>
      <Link href={href}>
        <div className={`flex items-center p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
          isActive ? "font-medium" : ""
        } cursor-pointer`}>
          <Icon className="w-5 h-5 mr-5" />
          <span>{label}</span>
        </div>
      </Link>
    </li>
  );
  
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 p-4 border-r border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 sticky top-0 h-screen">
      <div className="text-2xl font-bold py-4 mb-8">okcode</div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          <NavItem 
            href="/" 
            icon={Home} 
            label="Home" 
            isActive={location === "/"} 
          />
          <NavItem 
            href="/search" 
            icon={Search} 
            label="Search" 
            isActive={location === "/search"}
          />
          <NavItem 
            href="/explore" 
            icon={Compass} 
            label="Explore" 
            isActive={location === "/explore"}
          />
          <NavItem 
            href="/reels" 
            icon={Film} 
            label="Reels" 
            isActive={location === "/reels"}
          />
          <NavItem 
            href="/messages" 
            icon={MessageCircle} 
            label="Messages" 
            isActive={location === "/messages"}
          />
          <NavItem 
            href="/notifications" 
            icon={Heart} 
            label="Notifications" 
            isActive={location === "/notifications"}
          />
          <NavItem 
            href="/create" 
            icon={PlusSquare} 
            label="Create" 
            isActive={location === "/create"}
          />
          <li>
            <Link href={`/profile/${user?.username}`}>
              <div className={`flex items-center p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
                location === `/profile/${user?.username}` ? "font-medium" : ""
              } cursor-pointer`}>
                <Avatar className="h-5 w-5 mr-5">
                  <AvatarImage src={user?.profileImage ? user.profileImage : ""} />
                  <AvatarFallback>{user?.username ? getInitials(user.username) : "U"}</AvatarFallback>
                </Avatar>
                <span>Profile</span>
              </div>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="pt-4 border-t border-neutral-300 dark:border-neutral-700 mt-4">
        <button 
          onClick={toggleDarkMode}
          className="flex items-center p-2 w-full rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 mr-5" />
          ) : (
            <Moon className="w-5 h-5 mr-5" />
          )}
          <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <button 
          className="flex items-center p-2 w-full rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 mt-2"
        >
          <Settings className="w-5 h-5 mr-5" />
          <span>Settings</span>
        </button>
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="w-full mt-4 justify-start"
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}

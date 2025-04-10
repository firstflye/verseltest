import { MessageCircle, Moon, Sun } from "lucide-react";
import { Link } from "wouter";

interface MobileHeaderProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

export default function MobileHeader({ toggleDarkMode, isDarkMode }: MobileHeaderProps) {
  return (
    <header className="md:hidden bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700 p-3 flex justify-between items-center sticky top-0 z-30">
      <div className="text-xl font-semibold">okcode</div>
      <div className="flex items-center space-x-4">
        <button 
          className="text-neutral-700 dark:text-neutral-200" 
          onClick={toggleDarkMode}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
        <Link href="/messages">
          <div className="cursor-pointer">
            <MessageCircle className="h-5 w-5" />
          </div>
        </Link>
      </div>
    </header>
  );
}

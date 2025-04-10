import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// This is a simple mock component for UI display purposes
// In a full implementation, highlights would be fetched from the backend
export default function StoryHighlights() {
  const mockHighlights = [
    { id: 1, name: "Travel", image: "https://randomuser.me/api/portraits/women/44.jpg" },
    { id: 2, name: "Work", image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: 3, name: "Pets", image: "https://randomuser.me/api/portraits/women/68.jpg" },
    { id: 4, name: "Food", image: "https://randomuser.me/api/portraits/men/75.jpg" },
  ];

  return (
    <div className="bg-neutral-100 dark:bg-neutral-800 p-4 mt-4 md:rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-x-auto">
      <div className="flex space-x-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-xs mt-1">New</span>
        </div>
        
        {mockHighlights.map(highlight => (
          <div key={highlight.id} className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-neutral-300 dark:border-neutral-600 overflow-hidden">
              <Avatar className="w-full h-full">
                <AvatarImage src={highlight.image} className="w-full h-full object-cover" />
                <AvatarFallback>{highlight.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs mt-1">{highlight.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

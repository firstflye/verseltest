import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProfileHeaderProps {
  profile: {
    id: number;
    username: string;
    name: string | null;
    bio: string | null;
    website: string | null;
    profileImage: string | null;
    postsCount: number;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
  };
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(profile.isFollowing);
  const [followersCount, setFollowersCount] = useState(profile.followersCount);
  
  const isOwnProfile = user?.id === profile.id;
  
  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profile.username}`] });
    },
  });
  
  const unfollowMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profile.username}`] });
    },
  });
  
  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate(profile.id);
    } else {
      followMutation.mutate(profile.id);
    }
  };
  
  return (
    <div className="bg-neutral-100 dark:bg-neutral-800 p-4 md:rounded-lg border border-neutral-300 dark:border-neutral-700">
      <div className="flex flex-col md:flex-row md:items-start">
        {/* Profile Image */}
        <div className="flex justify-center md:justify-start md:w-1/3 mb-4 md:mb-0">
          <Avatar className="w-20 h-20 md:w-32 md:h-32 border-2 border-neutral-300 dark:border-neutral-700">
            <AvatarImage src={profile.profileImage || ""} className="w-full h-full object-cover" />
            <AvatarFallback className="text-4xl">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Profile Info */}
        <div className="md:w-2/3">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <h2 className="text-xl font-semibold">{profile.username}</h2>
            <div className="flex space-x-2">
              {isOwnProfile ? (
                <>
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Settings className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button 
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex justify-around md:justify-start space-x-4 md:space-x-8 py-4 text-sm">
            <div className="text-center md:text-left">
              <span className="font-semibold">{profile.postsCount}</span> posts
            </div>
            <div className="text-center md:text-left">
              <span className="font-semibold">{followersCount}</span> followers
            </div>
            <div className="text-center md:text-left">
              <span className="font-semibold">{profile.followingCount}</span> following
            </div>
          </div>
          
          {/* Bio */}
          <div className="text-sm">
            {profile.name && <p className="font-semibold">{profile.name}</p>}
            {profile.bio && <p>{profile.bio}</p>}
            {profile.website && (
              <a 
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary"
              >
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, MessageCircle, User, UserCheck, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";

interface NotificationUser {
  id: number;
  username: string;
  profileImage: string | null;
}

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'follow_request' | 'mention';
  user: NotificationUser;
  postId?: number;
  thumbnailUrl?: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export default function NotificationsPage() {
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
  
  const { data: allNotifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });
  
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const notifDate = new Date(timestamp);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    
    if (diffSec < 60) return `${diffSec}s`;
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}d`;
    if (diffWeek < 4) return `${diffWeek}w`;
    
    return notifDate.toLocaleDateString();
  };
  
  const todayNotifications = allNotifications?.filter(notif => {
    const date = new Date(notif.timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });
  
  const thisWeekNotifications = allNotifications?.filter(notif => {
    const date = new Date(notif.timestamp);
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    return date >= weekAgo && date.toDateString() !== today.toDateString();
  });
  
  const olderNotifications = allNotifications?.filter(notif => {
    const date = new Date(notif.timestamp);
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    return date < weekAgo;
  });
  
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
      case 'follow_request':
        return <User className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-neutral-500" />;
    }
  };
  
  const renderNotificationGroup = (notifications: Notification[] | undefined, title: string) => {
    if (!notifications || notifications.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 divide-y divide-neutral-300 dark:divide-neutral-700">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-4 flex items-center ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
            >
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={notification.user.profileImage || ""} />
                <AvatarFallback>{getInitials(notification.user.username)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-1 mb-1">
                  <span className="p-1 rounded-full bg-neutral-200 dark:bg-neutral-700">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <span className="text-xs text-neutral-500">{timeAgo(notification.timestamp)}</span>
                  {!notification.isRead && (
                    <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
                <p>
                  <Link href={`/profile/${notification.user.username}`}>
                    <span className="font-semibold hover:underline cursor-pointer">
                      {notification.user.username}
                    </span>
                  </Link>
                  {" "}
                  {notification.text}
                  {notification.type === 'like' || notification.type === 'comment' ? (
                    <Link href={`/posts/${notification.postId}`}>
                      <span className="text-neutral-500 hover:underline cursor-pointer">
                        {" "}your post
                      </span>
                    </Link>
                  ) : null}
                </p>
              </div>
              
              {notification.thumbnailUrl && (
                <div className="ml-2 w-12 h-12 shrink-0">
                  <img 
                    src={notification.thumbnailUrl} 
                    alt="Post thumbnail" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
              
              {notification.type === 'follow_request' && (
                <div className="ml-2 flex space-x-2">
                  <Button size="sm" className="h-8">Confirm</Button>
                  <Button size="sm" variant="outline" className="h-8">Delete</Button>
                </div>
              )}
              
              {notification.type === 'follow' && (
                <Button size="sm" variant="outline" className="ml-2 h-8">
                  <UserCheck className="h-4 w-4 mr-1" />
                  Following
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-screen md:flex-row">
      <MobileHeader toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Notifications</h1>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="likes">Likes</TabsTrigger>
              <TabsTrigger value="follows">Follows</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-4 flex items-center">
                      <Skeleton className="h-12 w-12 rounded-full mr-4" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !allNotifications || allNotifications.length === 0 ? (
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-8 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p className="text-lg font-semibold mb-2">Activity on Your Content</p>
                  <p className="text-neutral-500">
                    When someone likes or comments on your posts, you'll see it here
                  </p>
                </div>
              ) : (
                <>
                  {renderNotificationGroup(todayNotifications, "Today")}
                  {renderNotificationGroup(thisWeekNotifications, "This Week")}
                  {renderNotificationGroup(olderNotifications, "Earlier")}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="likes">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p className="text-neutral-500">Notifications about likes will appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="follows">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-8 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p className="text-neutral-500">Notifications about follows will appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="comments">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p className="text-neutral-500">Notifications about comments will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
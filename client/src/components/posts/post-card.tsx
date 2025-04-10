import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Image as ImageIcon,
  Smile 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: {
    id: number;
    caption: string;
    location: string | null;
    imageUrl: string;
    createdAt: string;
    user: {
      id: number;
      username: string;
      profileImage: string | null;
    };
    likesCount: number;
    commentsCount: number;
    userLiked: boolean;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(post.userLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  
  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
    },
  });
  
  const unlikePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
    },
  });
  
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}`] });
      setComment("");
    },
  });
  
  const handleLikeToggle = () => {
    if (!user) return;
    
    if (isLiked) {
      unlikePostMutation.mutate(post.id);
    } else {
      likePostMutation.mutate(post.id);
    }
  };
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    
    addCommentMutation.mutate({
      postId: post.id,
      content: comment
    });
  };
  
  const handleDoubleClickLike = () => {
    if (!user || isLiked) return;
    likePostMutation.mutate(post.id);
  };
  
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  
  return (
    <Card className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 rounded-lg mb-6">
      <CardHeader className="p-3 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <Link href={`/profile/${post.user.username}`}>
            <a className="flex items-center">
              <Avatar className="w-8 h-8 mr-2">
                <AvatarImage src={post.user.profileImage || ""} />
                <AvatarFallback>
                  {post.user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{post.user.username}</p>
                {post.location && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{post.location}</p>
                )}
              </div>
            </a>
          </Link>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      
      <div className="relative">
        <img 
          src={post.imageUrl} 
          alt="Post" 
          className="w-full h-auto"
          onDoubleClick={handleDoubleClickLike}
        />
        {post.imageUrl.includes("images") && (
          <div className="absolute top-4 right-4 bg-neutral-800 bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="flex justify-between mb-2">
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="p-0 h-auto"
              onClick={handleLikeToggle}
            >
              {isLiked ? (
                <Heart className="text-red-500 fill-red-500 h-6 w-6" />
              ) : (
                <Heart className="h-6 w-6" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="p-0 h-auto">
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="p-0 h-auto">
              <Send className="h-6 w-6" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="p-0 h-auto">
            <Bookmark className="h-6 w-6" />
          </Button>
        </div>
        
        <p className="font-semibold text-sm mb-1">{likesCount} likes</p>
        
        <div className="mb-2">
          <p className="text-sm">
            <span className="font-semibold">{post.user.username}</span>{" "}
            {post.caption}
          </p>
        </div>
        
        {post.commentsCount > 0 && (
          <Button variant="ghost" className="p-0 h-auto">
            <span className="text-neutral-500 dark:text-neutral-400 text-sm">
              View all {post.commentsCount} comments
            </span>
          </Button>
        )}
        
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {timeAgo.toUpperCase()}
        </p>
      </CardContent>
      
      <CardFooter className="p-3 border-t border-neutral-300 dark:border-neutral-700">
        <form onSubmit={handleSubmitComment} className="flex items-center w-full">
          <Button type="button" variant="ghost" size="icon" className="mr-3 p-0">
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            placeholder="Add a comment..."
            className="bg-transparent border-none focus-visible:ring-0 text-sm flex-1 p-0 h-auto"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button 
            type="submit"
            variant="ghost"
            size="sm"
            className={`text-primary font-semibold text-sm p-0 ${!comment.trim() ? 'opacity-50' : ''}`}
            disabled={!comment.trim() || addCommentMutation.isPending}
          >
            Post
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

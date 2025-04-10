import { Link } from "wouter";
import { Image as ImageIcon, Play } from "lucide-react";

interface Post {
  id: number;
  imageUrl: string;
  createdAt: string;
}

interface PostGridProps {
  posts: Post[];
  isLoading?: boolean;
}

export default function PostGrid({ posts, isLoading = false }: PostGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array(9).fill(0).map((_, i) => (
          <div key={i} className="aspect-square bg-neutral-300 dark:bg-neutral-700 animate-pulse" />
        ))}
      </div>
    );
  }
  
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-neutral-500 dark:text-neutral-400 text-center">
          No posts yet
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <Link key={post.id} href={`/posts/${post.id}`}>
          <a className="aspect-square relative">
            <img
              src={post.imageUrl}
              alt="Post thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 text-white">
              {post.imageUrl.includes("video") ? (
                <Play className="h-5 w-5" />
              ) : post.imageUrl.includes("carousel") ? (
                <ImageIcon className="h-5 w-5" />
              ) : null}
            </div>
          </a>
        </Link>
      ))}
    </div>
  );
}

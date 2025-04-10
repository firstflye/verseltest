import { 
  users, posts, likes, comments, follows, stories, reels,
  type User, type InsertUser, 
  type Post, type InsertPost, 
  type Like, type InsertLike, 
  type Comment, type InsertComment,
  type Follow, type InsertFollow,
  type Story, type InsertStory,
  type Reel, type InsertReel
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { MySQLStorage } from './database';
import MySQLSessionStore from "express-mysql-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getPosts(): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  getPostsByUserId(userId: number): Promise<Post[]>;
  
  // Like methods
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(userId: number, postId: number): Promise<void>;
  getLikesByPostId(postId: number): Promise<Like[]>;
  getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined>;
  
  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  
  // Follow methods
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(followerId: number, followingId: number): Promise<void>;
  getFollowers(userId: number): Promise<Follow[]>;
  getFollowing(userId: number): Promise<Follow[]>;
  getFollowByUserIds(followerId: number, followingId: number): Promise<Follow | undefined>;
  
  // Story methods
  createStory(story: InsertStory): Promise<Story>;
  getStoriesByUserId(userId: number): Promise<Story[]>;
  getRecentStories(): Promise<Story[]>;
  
  // Reel methods
  createReel(reel: InsertReel): Promise<Reel>;
  getReels(): Promise<Reel[]>;
  getReelById(id: number): Promise<Reel | undefined>;
  getReelsByUserId(userId: number): Promise<Reel[]>;
  
  // Session store
  sessionStore: any; // MemoryStore from 'memorystore'
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private follows: Map<number, Follow>;
  private stories: Map<number, Story>;
  private reels: Map<number, Reel>;
  
  sessionStore: any; // MemoryStore from 'memorystore'
  
  currentUserId: number = 1;
  currentPostId: number = 1;
  currentLikeId: number = 1;
  currentCommentId: number = 1;
  currentFollowId: number = 1;
  currentStoryId: number = 1;
  currentReelId: number = 1;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.follows = new Map();
    this.stories = new Map();
    this.reels = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with test data
    this.initializeTestData();
  }
  
  private async initializeTestData() {
    // Seed some default profile images
    const defaultProfileImages = [
      "https://randomuser.me/api/portraits/women/44.jpg",
      "https://randomuser.me/api/portraits/men/32.jpg", 
      "https://randomuser.me/api/portraits/women/68.jpg",
      "https://randomuser.me/api/portraits/men/75.jpg",
      "https://randomuser.me/api/portraits/women/65.jpg", 
      "https://randomuser.me/api/portraits/men/36.jpg"
    ];
    
    // Sample post images
    const samplePostImages = [
      "https://images.unsplash.com/photo-1535957998253-26ae1ef29506?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1499678329028-101435549a4e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1492138786289-d35ea832da43?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515343480029-43cdfe6b6aae?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80"
    ];
    
    // Create test users
    const testUsers = [
      {
        username: "john_doe",
        password: "password123",
        name: "John Doe",
        bio: "Software developer and photography enthusiast",
        website: "https://johndoe.dev",
        profileImage: defaultProfileImages[1]
      },
      {
        username: "jane_smith",
        password: "password123",
        name: "Jane Smith",
        bio: "Travel blogger and content creator ✈️ | Exploring the world one photo at a time",
        website: "https://janesmith.travel",
        profileImage: defaultProfileImages[2]
      },
      {
        username: "alex_tech",
        password: "password123",
        name: "Alex Johnson",
        bio: "Tech lover, gamer, and coffee addict ☕",
        website: "https://alexjohnson.tech",
        profileImage: defaultProfileImages[3]
      },
      {
        username: "sarah_designs",
        password: "password123",
        name: "Sarah Williams",
        bio: "UI/UX Designer | Creating beautiful experiences",
        website: "https://sarahdesigns.co",
        profileImage: defaultProfileImages[4]
      },
      {
        username: "admin",
        password: "admin123",
        name: "Admin User",
        bio: "Site administrator",
        website: "https://okcode.app",
        profileImage: defaultProfileImages[5]
      }
    ];
    
    // Create users
    for (const userData of testUsers) {
      await this.createUser(userData);
    }
    
    // Create some posts
    const users = Array.from(this.users.values());
    
    for (let i = 0; i < 20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomImage = samplePostImages[Math.floor(Math.random() * samplePostImages.length)];
      const locations = ["New York City", "Tokyo", "London", "Sydney", "Paris", "Berlin", null];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      
      await this.createPost({
        userId: randomUser.id,
        caption: `This is post #${i+1}. ${Math.random() > 0.5 ? "Really enjoying creating content on okcode!" : "Check out this amazing shot! What do you think?"}`,
        imageUrl: randomImage,
        location: randomLocation
      });
    }
    
    // Create some likes and comments
    const posts = Array.from(this.posts.values());
    
    for (const post of posts) {
      // Add random likes
      const numLikes = Math.floor(Math.random() * 20);
      const likingUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, numLikes);
      
      for (const user of likingUsers) {
        await this.createLike({
          userId: user.id,
          postId: post.id
        });
      }
      
      // Add random comments
      const numComments = Math.floor(Math.random() * 5);
      const commentingUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, numComments);
      
      const commentTexts = [
        "Great post!",
        "Love this photo!",
        "Amazing shot!",
        "Looking good!",
        "This is fantastic!",
        "Incredible view!",
        "Nice composition!",
        "Where was this taken?",
        "Brilliant shot!"
      ];
      
      for (const user of commentingUsers) {
        const randomComment = commentTexts[Math.floor(Math.random() * commentTexts.length)];
        await this.createComment({
          userId: user.id,
          postId: post.id,
          content: randomComment
        });
      }
    }
    
    // Create some follow relationships
    for (const user of users) {
      const numFollowing = Math.floor(Math.random() * (users.length - 1));
      const usersToFollow = [...users]
        .filter(u => u.id !== user.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, numFollowing);
      
      for (const followUser of usersToFollow) {
        await this.createFollow({
          followerId: user.id,
          followingId: followUser.id
        });
      }
    }
    
    // Create some sample reels
    const sampleVideos = [
      "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-walking-in-the-city-1456-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-a-video-call-42626-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-young-woman-skateboarder-performing-tricks-on-street-34556-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-skateboarder-on-a-ramp-demonstration-4196-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-fashion-woman-with-silver-makeup-39875-large.mp4"
    ];
    
    const sampleThumbnails = [
      "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-walking-in-the-city-1456-large.jpg",
      "https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-a-video-call-42626-large.jpg",
      "https://assets.mixkit.co/videos/preview/mixkit-young-woman-skateboarder-performing-tricks-on-street-34556-large.jpg",
      "https://assets.mixkit.co/videos/preview/mixkit-skateboarder-on-a-ramp-demonstration-4196-large.jpg",
      "https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-fashion-woman-with-silver-makeup-39875-large.jpg"
    ];
    
    for (let i = 0; i < 10; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const videoIndex = Math.floor(Math.random() * sampleVideos.length);
      
      await this.createReel({
        userId: randomUser.id,
        caption: `Check out this awesome reel! #trending #okcode #viral ${Math.random() > 0.5 ? "✨" : "🔥"}`,
        videoUrl: sampleVideos[videoIndex],
        thumbnailUrl: sampleThumbnails[videoIndex],
        duration: Math.floor(Math.random() * 30) + 15, // 15-45 seconds
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    
    // Ensure all optional fields have null values if undefined
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name ?? null,
      bio: insertUser.bio ?? null,
      website: insertUser.website ?? null,
      profileImage: insertUser.profileImage ?? null,
      createdAt
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.currentPostId++;
    const createdAt = new Date();
    
    // Ensure all optional fields have null values if undefined
    const post: Post = {
      id,
      userId: insertPost.userId,
      imageUrl: insertPost.imageUrl,
      caption: insertPost.caption ?? null,
      location: insertPost.location ?? null,
      createdAt
    };
    
    this.posts.set(id, post);
    return post;
  }
  
  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    });
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }
  
  async getPostsByUserId(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }
  
  // Like methods
  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = this.currentLikeId++;
    const createdAt = new Date();
    const like: Like = { ...insertLike, id, createdAt };
    this.likes.set(id, like);
    return like;
  }
  
  async deleteLike(userId: number, postId: number): Promise<void> {
    const likeToDelete = Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
    
    if (likeToDelete) {
      this.likes.delete(likeToDelete.id);
    }
  }
  
  async getLikesByPostId(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.postId === postId);
  }
  
  async getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
  }
  
  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const createdAt = new Date();
    const comment: Comment = { ...insertComment, id, createdAt };
    this.comments.set(id, comment);
    return comment;
  }
  
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeA - timeB; // Oldest first for comments
      });
  }
  
  // Follow methods
  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    const id = this.currentFollowId++;
    const createdAt = new Date();
    const follow: Follow = { ...insertFollow, id, createdAt };
    this.follows.set(id, follow);
    return follow;
  }
  
  async deleteFollow(followerId: number, followingId: number): Promise<void> {
    const followToDelete = Array.from(this.follows.values()).find(
      follow => follow.followerId === followerId && follow.followingId === followingId
    );
    
    if (followToDelete) {
      this.follows.delete(followToDelete.id);
    }
  }
  
  async getFollowers(userId: number): Promise<Follow[]> {
    return Array.from(this.follows.values())
      .filter(follow => follow.followingId === userId);
  }
  
  async getFollowing(userId: number): Promise<Follow[]> {
    return Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId);
  }
  
  async getFollowByUserIds(followerId: number, followingId: number): Promise<Follow | undefined> {
    return Array.from(this.follows.values()).find(
      follow => follow.followerId === followerId && follow.followingId === followingId
    );
  }
  
  // Story methods
  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.currentStoryId++;
    const createdAt = new Date();
    const story: Story = { ...insertStory, id, createdAt };
    this.stories.set(id, story);
    return story;
  }
  
  async getStoriesByUserId(userId: number): Promise<Story[]> {
    return Array.from(this.stories.values())
      .filter(story => story.userId === userId)
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }
  
  async getRecentStories(): Promise<Story[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return Array.from(this.stories.values())
      .filter(story => story.createdAt instanceof Date && story.createdAt > oneDayAgo)
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }

  // Reel methods
  async createReel(insertReel: InsertReel): Promise<Reel> {
    const id = this.currentReelId++;
    const createdAt = new Date();
    
    // Ensure all optional fields have null values if undefined
    const reel: Reel = {
      id,
      userId: insertReel.userId,
      videoUrl: insertReel.videoUrl,
      caption: insertReel.caption ?? null,
      thumbnailUrl: insertReel.thumbnailUrl ?? null,
      duration: insertReel.duration ?? null,
      createdAt
    };
    
    this.reels.set(id, reel);
    return reel;
  }
  
  async getReels(): Promise<Reel[]> {
    return Array.from(this.reels.values()).sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    });
  }
  
  async getReelById(id: number): Promise<Reel | undefined> {
    return this.reels.get(id);
  }
  
  async getReelsByUserId(userId: number): Promise<Reel[]> {
    return Array.from(this.reels.values())
      .filter(reel => reel.userId === userId)
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }
}

// Create in-memory session store for development/memory storage
const memorySessionStore = new MemoryStore({ checkPeriod: 86400000 });

// Configure MySQL session store for production
// MySQL session store options
const mySqlSessionStoreOptions = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'okcode_db',
  createDatabaseTable: true
};

// Try to create MySQL session store or fall back to memory store
let mySqlSessionStore;
try {
  // @ts-ignore - TypeScript might complain about the module
  const MySQLStore = require('express-mysql-session')(session);
  mySqlSessionStore = new MySQLStore(mySqlSessionStoreOptions);
  console.log('MySQL session store created successfully');
} catch (error) {
  console.warn('Could not create MySQL session store, falling back to memory store:', error);
  mySqlSessionStore = memorySessionStore;
}

// Create the storage instance
let storageInstance: IStorage;

// Use the appropriate storage based on environment
// Try to import the MySQL storage implementation
try {
  // Dynamically import the MySQL storage implementation
  import('./database.js').then(module => {
    const { MySQLStorage } = module;
    const mySqlStorage = new MySQLStorage(mySqlSessionStore);
    console.log('MySQL storage initialized successfully');
    
    // Use MySQL storage as the primary storage
    storageInstance = mySqlStorage;
  }).catch(error => {
    console.warn('MySQL storage initialization failed, falling back to memory storage:', error);
    
    // Fall back to memory storage
    storageInstance = new MemStorage();
  });
  
  // Use memory storage initially until dynamic import resolves
  storageInstance = new MemStorage();
} catch (error: any) {
  console.warn('MySQL storage initialization failed, falling back to memory storage:', error);
  
  // Fall back to memory storage
  storageInstance = new MemStorage();
}

// Export the storage instance
export const storage = storageInstance;

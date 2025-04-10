import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPostSchema, insertCommentSchema, insertLikeSchema, insertFollowSchema, insertStorySchema, insertReelSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Set up file upload middleware
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  });

  // Posts API
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getPosts();
      
      // For each post, get user info, likes, and comments
      const postsWithDetails = await Promise.all(posts.map(async (post) => {
        const user = await storage.getUser(post.userId);
        const likes = await storage.getLikesByPostId(post.id);
        const comments = await storage.getCommentsByPostId(post.id);
        
        return {
          ...post,
          user: user ? { 
            id: user.id, 
            username: user.username,
            name: user.name,
            profileImage: user.profileImage
          } : null,
          likesCount: likes.length,
          commentsCount: comments.length,
          // If authenticated, check if current user liked the post
          userLiked: req.isAuthenticated() 
            ? likes.some(like => like.userId === (req.user as any).id) 
            : false
        };
      }));
      
      res.json(postsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a post" });
    }
    
    try {
      // If there's no file uploaded
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }

      // Convert the file buffer to base64 for in-memory storage
      const imageBase64 = req.file.buffer.toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${imageBase64}`;
      
      // Create the post
      const postData = {
        userId: (req.user as any).id,
        caption: req.body.caption || "",
        location: req.body.location || "",
        imageUrl
      };

      const validatedData = insertPostSchema.parse(postData);
      const post = await storage.createPost(validatedData);
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const user = await storage.getUser(post.userId);
      const likes = await storage.getLikesByPostId(post.id);
      const comments = await storage.getCommentsByPostId(post.id);
      
      res.json({
        ...post,
        user: user ? { 
          id: user.id, 
          username: user.username,
          name: user.name,
          profileImage: user.profileImage
        } : null,
        likesCount: likes.length,
        comments: await Promise.all(comments.map(async (comment) => {
          const commentUser = await storage.getUser(comment.userId);
          return {
            ...comment,
            user: commentUser ? {
              id: commentUser.id,
              username: commentUser.username,
              profileImage: commentUser.profileImage
            } : null
          };
        })),
        userLiked: req.isAuthenticated() 
          ? likes.some(like => like.userId === (req.user as any).id) 
          : false
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  // User Profile API
  app.get("/api/users/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const posts = await storage.getPostsByUserId(user.id);
      const followers = await storage.getFollowers(user.id);
      const following = await storage.getFollowing(user.id);
      
      // Check if the authenticated user is following this profile
      let isFollowing = false;
      if (req.isAuthenticated()) {
        const follow = await storage.getFollowByUserIds(
          (req.user as any).id, 
          user.id
        );
        isFollowing = !!follow;
      }
      
      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        ...userWithoutPassword,
        postsCount: posts.length,
        followersCount: followers.length,
        followingCount: following.length,
        isFollowing,
        posts: posts.map(post => ({
          id: post.id,
          imageUrl: post.imageUrl,
          createdAt: post.createdAt
        }))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Like API
  app.post("/api/posts/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to like a post" });
    }
    
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const userId = (req.user as any).id;
      
      // Check if the user already liked the post
      const existingLike = await storage.getLikeByUserAndPost(userId, postId);
      if (existingLike) {
        return res.status(400).json({ message: "You've already liked this post" });
      }
      
      const likeData = {
        userId,
        postId
      };
      
      const validatedData = insertLikeSchema.parse(likeData);
      const like = await storage.createLike(validatedData);
      
      res.status(201).json(like);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid like data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to unlike a post" });
    }
    
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const userId = (req.user as any).id;
      
      // Check if the user has liked the post
      const existingLike = await storage.getLikeByUserAndPost(userId, postId);
      if (!existingLike) {
        return res.status(400).json({ message: "You haven't liked this post" });
      }
      
      await storage.deleteLike(userId, postId);
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  // Comment API
  app.post("/api/posts/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to comment" });
    }
    
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const commentData = {
        userId: (req.user as any).id,
        postId,
        content: req.body.content
      };
      
      const validatedData = insertCommentSchema.parse(commentData);
      
      if (!validatedData.content.trim()) {
        return res.status(400).json({ message: "Comment cannot be empty" });
      }
      
      const comment = await storage.createComment(validatedData);
      
      // Get the user info to send back with the comment
      const user = await storage.getUser(comment.userId);
      
      res.status(201).json({
        ...comment,
        user: user ? {
          id: user.id,
          username: user.username,
          profileImage: user.profileImage
        } : null
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Follow API
  app.post("/api/users/:id/follow", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to follow a user" });
    }
    
    try {
      const followingId = parseInt(req.params.id);
      if (isNaN(followingId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const followerId = (req.user as any).id;
      
      // Check if the user exists
      const userToFollow = await storage.getUser(followingId);
      if (!userToFollow) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Can't follow yourself
      if (followerId === followingId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }
      
      // Check if already following
      const existingFollow = await storage.getFollowByUserIds(followerId, followingId);
      if (existingFollow) {
        return res.status(400).json({ message: "You're already following this user" });
      }
      
      const followData = {
        followerId,
        followingId
      };
      
      const validatedData = insertFollowSchema.parse(followData);
      const follow = await storage.createFollow(validatedData);
      
      res.status(201).json(follow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid follow data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:id/follow", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to unfollow a user" });
    }
    
    try {
      const followingId = parseInt(req.params.id);
      if (isNaN(followingId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const followerId = (req.user as any).id;
      
      // Check if the user exists
      const userToUnfollow = await storage.getUser(followingId);
      if (!userToUnfollow) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if actually following
      const existingFollow = await storage.getFollowByUserIds(followerId, followingId);
      if (!existingFollow) {
        return res.status(400).json({ message: "You're not following this user" });
      }
      
      await storage.deleteFollow(followerId, followingId);
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  // Stories API
  app.post("/api/stories", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a story" });
    }
    
    try {
      // If there's no file uploaded
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }

      // Convert the file buffer to base64 for in-memory storage
      const imageBase64 = req.file.buffer.toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${imageBase64}`;
      
      // Create the story
      const storyData = {
        userId: (req.user as any).id,
        imageUrl
      };

      const validatedData = insertStorySchema.parse(storyData);
      const story = await storage.createStory(validatedData);
      
      res.status(201).json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid story data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getRecentStories();
      
      // Group stories by user and include user info
      const storiesByUser = await Promise.all(
        Array.from(
          stories.reduce((acc, story) => {
            if (!acc.has(story.userId)) {
              acc.set(story.userId, []);
            }
            acc.get(story.userId)!.push(story);
            return acc;
          }, new Map<number, typeof stories>())
        ).map(async ([userId, userStories]) => {
          const user = await storage.getUser(userId);
          return {
            user: user ? {
              id: user.id,
              username: user.username,
              profileImage: user.profileImage
            } : null,
            stories: userStories
          };
        })
      );
      
      res.json(storiesByUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  // Reels API
  app.post("/api/reels", upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a reel" });
    }
    
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // If there's no video uploaded
      if (!files.video || !files.video[0]) {
        return res.status(400).json({ message: "Video is required" });
      }

      // Convert the file buffer to base64 for in-memory storage
      const videoBase64 = files.video[0].buffer.toString("base64");
      const videoUrl = `data:${files.video[0].mimetype};base64,${videoBase64}`;
      
      // Process thumbnail if provided
      let thumbnailUrl = null;
      if (files.thumbnail && files.thumbnail[0]) {
        const thumbnailBase64 = files.thumbnail[0].buffer.toString("base64");
        thumbnailUrl = `data:${files.thumbnail[0].mimetype};base64,${thumbnailBase64}`;
      }
      
      // Create the reel
      const reelData = {
        userId: (req.user as any).id,
        caption: req.body.caption || null,
        videoUrl,
        thumbnailUrl,
        duration: req.body.duration ? parseInt(req.body.duration) : null
      };

      const validatedData = insertReelSchema.parse(reelData);
      const reel = await storage.createReel(validatedData);
      
      res.status(201).json(reel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reel data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reel" });
    }
  });

  app.get("/api/reels", async (req, res) => {
    try {
      const reels = await storage.getReels();
      
      // For each reel, get user info
      const reelsWithUserInfo = await Promise.all(reels.map(async (reel) => {
        const user = await storage.getUser(reel.userId);
        
        return {
          ...reel,
          user: user ? { 
            id: user.id, 
            username: user.username,
            name: user.name,
            profileImage: user.profileImage
          } : null
        };
      }));
      
      res.json(reelsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reels" });
    }
  });

  app.get("/api/reels/:id", async (req, res) => {
    try {
      const reelId = parseInt(req.params.id);
      if (isNaN(reelId)) {
        return res.status(400).json({ message: "Invalid reel ID" });
      }
      
      const reel = await storage.getReelById(reelId);
      if (!reel) {
        return res.status(404).json({ message: "Reel not found" });
      }
      
      const user = await storage.getUser(reel.userId);
      
      res.json({
        ...reel,
        user: user ? { 
          id: user.id, 
          username: user.username,
          name: user.name,
          profileImage: user.profileImage
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reel" });
    }
  });

  app.get("/api/users/:username/reels", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const reels = await storage.getReelsByUserId(user.id);
      
      res.json(reels.map(reel => ({
        id: reel.id,
        thumbnailUrl: reel.thumbnailUrl,
        duration: reel.duration,
        createdAt: reel.createdAt
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user reels" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

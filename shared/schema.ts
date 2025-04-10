import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Media type enum (for reels/posts distinction)
export enum MediaType {
  Image = "image",
  Video = "video"
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  bio: text("bio"),
  website: text("website"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  caption: text("caption"),
  location: text("location"),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reels = pgTable("reels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  caption: text("caption"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  bio: true,
  website: true,
  profileImage: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  caption: true,
  location: true,
  imageUrl: true,
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  userId: true,
  postId: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  postId: true,
  content: true,
});

export const insertFollowSchema = createInsertSchema(follows).pick({
  followerId: true,
  followingId: true,
});

export const insertStorySchema = createInsertSchema(stories).pick({
  userId: true,
  imageUrl: true,
});

export const insertReelSchema = createInsertSchema(reels).pick({
  userId: true,
  caption: true,
  videoUrl: true,
  thumbnailUrl: true,
  duration: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;

export type Reel = typeof reels.$inferSelect;
export type InsertReel = z.infer<typeof insertReelSchema>;

// Auth types
export type LoginData = Pick<InsertUser, "username" | "password">;

import * as mysql from 'mysql2/promise';
import { log } from './vite';
import { 
  type User, type InsertUser, 
  type Post, type InsertPost, 
  type Like, type InsertLike, 
  type Comment, type InsertComment,
  type Follow, type InsertFollow,
  type Story, type InsertStory,
  type Reel, type InsertReel
} from "@shared/schema";
import { hashPassword } from './auth';

// MySQL connection pool configuration (XAMPP default settings)
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'okcode_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool
let pool: mysql.Pool;

try {
  pool = mysql.createPool(DB_CONFIG);
  log('MySQL connection pool created successfully', 'mysql');
} catch (error) {
  console.error('Error creating MySQL connection pool:', error);
  // Create a mock pool that will throw errors when used
  pool = {
    query: async () => {
      throw new Error('MySQL connection not available');
    },
    getConnection: async () => {
      throw new Error('MySQL connection not available');
    },
    end: async () => {}
  } as unknown as mysql.Pool;
}

// MySQL Storage implementation
export class MySQLStorage {
  sessionStore: any;

  constructor(sessionStore: any) {
    this.sessionStore = sessionStore;
    log('MySQL storage initialized', 'mysql');
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      const users = rows as User[];
      return users.length ? users[0] : undefined;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE username = ?', 
        [username]
      );
      const users = rows as User[];
      return users.length ? users[0] : undefined;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Ensure password is hashed before storage if not already
      if (!insertUser.password.includes('.')) {
        insertUser.password = await hashPassword(insertUser.password);
      }
      
      const [result] = await pool.query(
        'INSERT INTO users (username, password, name, bio, website, profileImage) VALUES (?, ?, ?, ?, ?, ?)',
        [
          insertUser.username,
          insertUser.password,
          insertUser.name || null,
          insertUser.bio || null,
          insertUser.website || null,
          insertUser.profileImage || null
        ]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const id = insertResult.insertId;
      
      // Create the user with proper type assertions
      const user: User = {
        id,
        username: insertUser.username,
        password: insertUser.password,
        name: insertUser.name ?? null,
        bio: insertUser.bio ?? null,
        website: insertUser.website ?? null,
        profileImage: insertUser.profileImage ?? null,
        createdAt: new Date()
      };
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user: ' + (error as Error).message);
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      // Get the current user first
      const user = await this.getUser(id);
      if (!user) return undefined;
      
      // Build the SQL query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      
      if (userData.username !== undefined) {
        updates.push('username = ?');
        values.push(userData.username);
      }
      
      if (userData.password !== undefined) {
        // Hash the password if it's being updated and not already hashed
        const hashedPassword = !userData.password.includes('.') 
          ? await hashPassword(userData.password)
          : userData.password;
        updates.push('password = ?');
        values.push(hashedPassword);
      }
      
      if (userData.name !== undefined) {
        updates.push('name = ?');
        values.push(userData.name);
      }
      
      if (userData.bio !== undefined) {
        updates.push('bio = ?');
        values.push(userData.bio);
      }
      
      if (userData.website !== undefined) {
        updates.push('website = ?');
        values.push(userData.website);
      }
      
      if (userData.profileImage !== undefined) {
        updates.push('profileImage = ?');
        values.push(userData.profileImage);
      }
      
      // If there are no updates, just return the current user
      if (updates.length === 0) {
        return user;
      }
      
      // Add the user ID to the values array
      values.push(id);
      
      // Execute the update query
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      // Return the updated user
      return {
        ...user,
        ...userData
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    try {
      const [result] = await pool.query(
        'INSERT INTO posts (userId, imageUrl, caption, location) VALUES (?, ?, ?, ?)',
        [
          insertPost.userId,
          insertPost.imageUrl,
          insertPost.caption || null,
          insertPost.location || null
        ]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const id = insertResult.insertId;
      
      // Create the post with proper type assertion
      const post: Post = {
        id,
        userId: insertPost.userId,
        imageUrl: insertPost.imageUrl,
        caption: insertPost.caption ?? null,
        location: insertPost.location ?? null,
        createdAt: new Date()
      };
      
      return post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post: ' + (error as Error).message);
    }
  }

  async getPosts(): Promise<Post[]> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM posts ORDER BY createdAt DESC'
      );
      return rows as Post[];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  async getPostById(id: number): Promise<Post | undefined> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM posts WHERE id = ?',
        [id]
      );
      const posts = rows as Post[];
      return posts.length ? posts[0] : undefined;
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      return undefined;
    }
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM posts WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
      );
      return rows as Post[];
    } catch (error) {
      console.error('Error fetching posts by user ID:', error);
      return [];
    }
  }

  // Like methods
  async createLike(insertLike: InsertLike): Promise<Like> {
    try {
      const [result] = await pool.query(
        'INSERT INTO likes (userId, postId) VALUES (?, ?)',
        [insertLike.userId, insertLike.postId]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const id = insertResult.insertId;
      
      return {
        id,
        ...insertLike,
        createdAt: new Date()
      };
    } catch (error) {
      // Check if this is a duplicate entry error (unique constraint violation)
      if ((error as any).code === 'ER_DUP_ENTRY') {
        // Get the existing like
        const existingLike = await this.getLikeByUserAndPost(
          insertLike.userId, 
          insertLike.postId
        );
        
        if (existingLike) {
          return existingLike;
        }
      }
      
      console.error('Error creating like:', error);
      throw new Error('Failed to create like: ' + (error as Error).message);
    }
  }

  async deleteLike(userId: number, postId: number): Promise<void> {
    try {
      await pool.query(
        'DELETE FROM likes WHERE userId = ? AND postId = ?',
        [userId, postId]
      );
    } catch (error) {
      console.error('Error deleting like:', error);
    }
  }

  async getLikesByPostId(postId: number): Promise<Like[]> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM likes WHERE postId = ?',
        [postId]
      );
      return rows as Like[];
    } catch (error) {
      console.error('Error fetching likes by post ID:', error);
      return [];
    }
  }

  async getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM likes WHERE userId = ? AND postId = ?',
        [userId, postId]
      );
      const likes = rows as Like[];
      return likes.length ? likes[0] : undefined;
    } catch (error) {
      console.error('Error fetching like by user and post:', error);
      return undefined;
    }
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    try {
      const [result] = await pool.query(
        'INSERT INTO comments (userId, postId, content) VALUES (?, ?, ?)',
        [
          insertComment.userId, 
          insertComment.postId, 
          insertComment.content
        ]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const id = insertResult.insertId;
      
      return {
        id,
        ...insertComment,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment: ' + (error as Error).message);
    }
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC',
        [postId]
      );
      return rows as Comment[];
    } catch (error) {
      console.error('Error fetching comments by post ID:', error);
      return [];
    }
  }

  // Follow methods
  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    try {
      const [result] = await pool.query(
        'INSERT INTO follows (followerId, followingId) VALUES (?, ?)',
        [insertFollow.followerId, insertFollow.followingId]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const id = insertResult.insertId;
      
      return {
        id,
        ...insertFollow,
        createdAt: new Date()
      };
    } catch (error) {
      // Check if this is a duplicate entry error (unique constraint violation)
      if ((error as any).code === 'ER_DUP_ENTRY') {
        // Get the existing follow relationship
        const existingFollow = await this.getFollowByUserIds(
          insertFollow.followerId, 
          insertFollow.followingId
        );
        
        if (existingFollow) {
          return existingFollow;
        }
      }
      
      console.error('Error creating follow relationship:', error);
      throw new Error('Failed to create follow relationship: ' + (error as Error).message);
    }
  }

  async deleteFollow(followerId: number, followingId: number): Promise<void> {
    try {
      await pool.query(
        'DELETE FROM follows WHERE followerId = ? AND followingId = ?',
        [followerId, followingId]
      );
    } catch (error) {
      console.error('Error deleting follow relationship:', error);
    }
  }

  async getFollowers(userId: number): Promise<Follow[]> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM follows WHERE followingId = ?',
        [userId]
      );
      return rows as Follow[];
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }

  async getFollowing(userId: number): Promise<Follow[]> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM follows WHERE followerId = ?',
        [userId]
      );
      return rows as Follow[];
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  }

  async getFollowByUserIds(followerId: number, followingId: number): Promise<Follow | undefined> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM follows WHERE followerId = ? AND followingId = ?',
        [followerId, followingId]
      );
      const follows = rows as Follow[];
      return follows.length ? follows[0] : undefined;
    } catch (error) {
      console.error('Error fetching follow relationship:', error);
      return undefined;
    }
  }

  // Story methods
  async createStory(insertStory: InsertStory): Promise<Story> {
    try {
      const [result] = await pool.query(
        'INSERT INTO stories (userId, imageUrl) VALUES (?, ?)',
        [insertStory.userId, insertStory.imageUrl]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const id = insertResult.insertId;
      
      return {
        id,
        ...insertStory,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating story:', error);
      throw new Error('Failed to create story: ' + (error as Error).message);
    }
  }

  async getStoriesByUserId(userId: number): Promise<Story[]> {
    try {
      // Get stories created in the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const [rows] = await pool.query(
        'SELECT * FROM stories WHERE userId = ? AND createdAt > ? ORDER BY createdAt DESC',
        [userId, oneDayAgo]
      );
      
      return rows as Story[];
    } catch (error) {
      console.error('Error fetching stories by user ID:', error);
      return [];
    }
  }

  async getRecentStories(): Promise<Story[]> {
    try {
      // Get all stories from the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const [rows] = await pool.query(
        'SELECT * FROM stories WHERE createdAt > ? ORDER BY createdAt DESC',
        [oneDayAgo]
      );
      
      return rows as Story[];
    } catch (error) {
      console.error('Error fetching recent stories:', error);
      return [];
    }
  }

  // Reel methods
  async createReel(insertReel: InsertReel): Promise<Reel> {
    try {
      const [result] = await pool.query(
        'INSERT INTO reels (userId, videoUrl, thumbnailUrl, caption, duration) VALUES (?, ?, ?, ?, ?)',
        [
          insertReel.userId,
          insertReel.videoUrl,
          insertReel.thumbnailUrl || null,
          insertReel.caption || null,
          insertReel.duration || null
        ]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const id = insertResult.insertId;
      
      // Create the reel with proper type assertion
      const reel: Reel = {
        id,
        userId: insertReel.userId,
        videoUrl: insertReel.videoUrl,
        thumbnailUrl: insertReel.thumbnailUrl ?? null,
        caption: insertReel.caption ?? null,
        duration: insertReel.duration ?? null,
        createdAt: new Date()
      };
      
      return reel;
    } catch (error) {
      console.error('Error creating reel:', error);
      throw new Error('Failed to create reel: ' + (error as Error).message);
    }
  }

  async getReels(): Promise<Reel[]> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM reels ORDER BY createdAt DESC'
      );
      return rows as Reel[];
    } catch (error) {
      console.error('Error fetching reels:', error);
      return [];
    }
  }

  async getReelById(id: number): Promise<Reel | undefined> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM reels WHERE id = ?',
        [id]
      );
      const reels = rows as Reel[];
      return reels.length ? reels[0] : undefined;
    } catch (error) {
      console.error('Error fetching reel by ID:', error);
      return undefined;
    }
  }

  async getReelsByUserId(userId: number): Promise<Reel[]> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM reels WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
      );
      return rows as Reel[];
    } catch (error) {
      console.error('Error fetching reels by user ID:', error);
      return [];
    }
  }
}
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Verify JWT token from request
 * @param req VercelRequest object
 * @returns User ID if token is valid, null otherwise
 */
async function getUserIdFromToken(req: VercelRequest): Promise<number | null> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    
    return decoded.id;
  } catch (error) {
    return null;
  }
}

/**
 * Posts endpoint - GET: fetch all posts, POST: create a new post
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET: Fetch all posts
    if (req.method === 'GET') {
      const posts = await prisma.post.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImage: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json(posts);
    }
    
    // POST: Create a new post (requires authentication)
    if (req.method === 'POST') {
      // Verify user is authenticated
      const userId = await getUserIdFromToken(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { caption, imageUrl, location } = req.body;

      // Validate input
      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
      }

      // Create post
      const post = await prisma.post.create({
        data: {
          userId,
          caption: caption || null,
          imageUrl,
          location: location || null
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImage: true
            }
          }
        }
      });

      return res.status(201).json(post);
    }

    // Return 405 for other methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling posts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
  }
}
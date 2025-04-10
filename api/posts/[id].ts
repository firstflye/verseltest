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
 * Single post endpoint - GET, PUT, DELETE operations by post ID
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get post ID from URL
    const postId = parseInt(req.query.id as string);
    
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // GET: Fetch a single post
    if (req.method === 'GET') {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImage: true
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profileImage: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          likes: {
            select: {
              userId: true
            }
          }
        }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      return res.status(200).json(post);
    }

    // For PUT and DELETE, user must be authenticated
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Only the post owner can modify or delete it
    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // PUT: Update a post
    if (req.method === 'PUT') {
      const { caption, location } = req.body;

      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          caption: caption || null,
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

      return res.status(200).json(updatedPost);
    }

    // DELETE: Delete a post
    if (req.method === 'DELETE') {
      // Delete comments and likes first (cascade delete)
      await prisma.comment.deleteMany({
        where: { postId }
      });

      await prisma.like.deleteMany({
        where: { postId }
      });
      
      // Delete the post
      await prisma.post.delete({
        where: { id: postId }
      });

      return res.status(200).json({ message: 'Post deleted successfully' });
    }

    // Return 405 for other methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
  }
}
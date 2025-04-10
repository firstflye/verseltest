import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Get current user endpoint
 * This will verify the JWT token and return the user
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        username: true, 
        name: true, 
        bio: true, 
        website: true, 
        profileImage: true, 
        createdAt: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    
    // Handle token verification errors
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
  }
}
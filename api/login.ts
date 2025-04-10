import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Initialize Prisma client
const prisma = new PrismaClient();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Convert callback-based scrypt to Promise-based
const scryptAsync = promisify(scrypt);

/**
 * Compare a supplied password with a stored hashed password
 * @param supplied The password supplied by the user
 * @param stored The stored hashed password (format: hash.salt)
 * @returns Boolean indicating if passwords match
 */
async function comparePasswords(supplied: string, stored: string) {
  // Split the stored password into hash and salt
  const [hashed, salt] = stored.split('.');
  
  if (!hashed || !salt) {
    return false;
  }
  
  // Create buffer from stored hash
  const hashedBuf = Buffer.from(hashed, 'hex');
  
  // Hash the supplied password with same salt
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  
  // Compare hashes in constant time to prevent timing attacks
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Login endpoint
 * Authenticates user and returns JWT token
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });

    // Check if user exists and password is correct
    if (!user || !(await comparePasswords(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '7d' // Token expires in 7 days
    });

    // Return user data and token
    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        website: user.website,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
  }
}
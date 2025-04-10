import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Initialize Prisma client
const prisma = new PrismaClient();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Convert callback-based scrypt to Promise-based
const scryptAsync = promisify(scrypt);

/**
 * Hash a password using scrypt with a random salt
 * @param password The password to hash
 * @returns Hashed password with salt (format: hash.salt)
 */
async function hashPassword(password: string) {
  // Generate random salt for security
  const salt = randomBytes(16).toString('hex');
  
  // Hash the password with the salt using scrypt
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  
  // Return the hashed password and salt together
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Registration endpoint
 * Creates a new user and returns JWT token
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
    const { username, password, name, bio, website, profileImage } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || null,
        bio: bio || null,
        website: website || null,
        profileImage: profileImage || null
      }
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '7d' // Token expires in 7 days
    });

    // Return user data and token
    return res.status(201).json({
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
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
  }
}
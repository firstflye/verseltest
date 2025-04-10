# Deploying OkCode to Vercel

This document explains how to deploy the OkCode Instagram-like application to Vercel.

## Prerequisites

1. A GitHub repository with your code
2. A Vercel account (https://vercel.com)
3. A PostgreSQL database (Supabase, Neon, or similar)

## Database Setup

1. Create a PostgreSQL database on a service like [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. Get your database connection string, it should look like:
   ```
   postgresql://username:password@hostname:port/database
   ```

## Environment Variables

In Vercel, you'll need to set up the following environment variables:

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `DATABASE_URL` | Your PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `JWT_SECRET` | Secret key for JSON Web Tokens | `your-secure-secret-key` |
| `NEXT_PUBLIC_API_URL` | Base URL of your API (leave empty for auto-detection) | (leave blank) |

## Deployment Steps

1. **Prepare your repository**:
   - Make sure all the Vercel-specific files are included:
     - `vercel.json`
     - `/api` directory with serverless functions
     - `prisma/schema.prisma`
     - `next.config.js`

2. **Set up PostgreSQL migrations**:
   - Before deploying, run this locally to set up your Prisma schema:
     ```bash
     npx prisma generate
     npx prisma migrate dev --name init
     ```
   - Commit the migration files to your repository

3. **Deploy to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: npm run build
   - Add your environment variables (DATABASE_URL, JWT_SECRET)
   - Click "Deploy"

4. **Run database migrations**:
   - After deployment, run this command in Vercel's "Deployments" → "Functions" tab:
     ```bash
     npx prisma migrate deploy
     ```

## Common Issues and Solutions

### 404 Errors

If you're getting 404 errors when accessing pages:

1. Make sure your `vercel.json` has the correct rewrites
2. Verify the API routes are properly set up in `/api` directory
3. Check the Vercel deployment logs for any errors

### Database Connection Issues

If you're having trouble connecting to your database:

1. Verify the DATABASE_URL environment variable is correctly set
2. Make sure your database allows connections from Vercel's IP addresses 
3. Check if your database requires SSL connection

### Authentication Issues

If authentication isn't working:

1. Verify the JWT_SECRET environment variable is set correctly
2. Make sure the frontend code is correctly sending the Authentication header
3. Check that localStorage is being used to persist the JWT token

## Updating Your Deployment

After making changes to your code:

1. Commit and push your changes to GitHub
2. Vercel will automatically detect changes and deploy a new version
3. For database schema changes, run migrations manually

## Best Practices

1. **Use environment variables** for all sensitive information
2. **Set up Preview Environments** in Vercel for testing Pull Requests
3. **Add a custom domain** for your production environment
4. **Set up monitoring** to track errors and performance
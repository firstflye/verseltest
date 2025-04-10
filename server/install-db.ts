import * as mysql from 'mysql2/promise';
import { log } from './vite';
import { hashPassword } from './auth';

// XAMPP MySQL default configuration
const config = {
  host: 'localhost',
  user: 'root',
  password: '',  // default XAMPP has no password
  multipleStatements: true
};

async function createDatabase() {
  try {
    // Create connection to MySQL server
    const connection = await mysql.createConnection(config);
    
    // Create database if it doesn't exist
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS okcode_db;
      USE okcode_db;
    `);
    
    // Create tables
    await connection.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(200) NOT NULL,
        name VARCHAR(100),
        bio TEXT,
        website VARCHAR(200),
        profileImage VARCHAR(500),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Posts table
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        imageUrl VARCHAR(500) NOT NULL,
        caption TEXT,
        location VARCHAR(200),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      
      -- Likes table
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        postId INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (userId, postId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
      );
      
      -- Comments table
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        postId INT NOT NULL,
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
      );
      
      -- Follows table
      CREATE TABLE IF NOT EXISTS follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        followerId INT NOT NULL,
        followingId INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (followerId, followingId),
        FOREIGN KEY (followerId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (followingId) REFERENCES users(id) ON DELETE CASCADE
      );
      
      -- Stories table
      CREATE TABLE IF NOT EXISTS stories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        imageUrl VARCHAR(500) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      
      -- Reels table
      CREATE TABLE IF NOT EXISTS reels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        videoUrl VARCHAR(500) NOT NULL,
        thumbnailUrl VARCHAR(500),
        caption TEXT,
        duration DECIMAL(10,2),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      
      -- Sessions table (for express-session)
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) NOT NULL,
        expires INT UNSIGNED NOT NULL,
        data MEDIUMTEXT,
        PRIMARY KEY (session_id)
      );
    `);
    
    // Create some sample data for testing
    // Hash the password 'password'
    const hashedPassword = await hashPassword('password');
    
    // Insert sample users if they don't exist
    await connection.query(`
      INSERT IGNORE INTO users (username, password, name, bio, website, profileImage) VALUES 
      ('john_doe', ?, 'John Doe', 'Photography enthusiast and travel lover', 'johndoe.com', 'https://randomuser.me/api/portraits/men/1.jpg'),
      ('jane_smith', ?, 'Jane Smith', 'Digital artist and coffee addict', 'janesmith.com', 'https://randomuser.me/api/portraits/women/2.jpg'),
      ('alex_johnson', ?, 'Alex Johnson', 'Adventure seeker | Food lover', 'alexj.com', 'https://randomuser.me/api/portraits/men/3.jpg');
    `, [hashedPassword, hashedPassword, hashedPassword]);
    
    // Insert sample posts
    await connection.query(`
      INSERT IGNORE INTO posts (userId, imageUrl, caption, location) VALUES
      (1, 'https://images.unsplash.com/photo-1501854140801-50d01698950b', 'Beautiful sunset at the beach', 'Malibu, CA'),
      (1, 'https://images.unsplash.com/photo-1526660690293-bcd32dc3b123', 'Morning coffee is the best', 'Home'),
      (2, 'https://images.unsplash.com/photo-1562592306-f32a6e7f9982', 'City lights never get old', 'New York, NY'),
      (3, 'https://images.unsplash.com/photo-1533107862482-0e6974b06ec4', 'Hiking with friends', 'Grand Canyon');
    `);
    
    // Insert sample reels
    await connection.query(`
      INSERT IGNORE INTO reels (userId, videoUrl, thumbnailUrl, caption, duration) VALUES
      (2, 'https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-fashion-woman-with-silver-makeup-39875-large.mp4', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'New makeup tutorial', 60),
      (3, 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 'Ocean vibes', 45);
    `);
    
    log('Database setup complete!', 'mysql');
    
    // Close connection
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  createDatabase().then((success) => {
    if (success) {
      console.log('✅ Database setup complete!');
    } else {
      console.log('❌ Database setup failed. Check your MySQL connection and try again.');
    }
    process.exit(0);
  });
}

export { createDatabase };
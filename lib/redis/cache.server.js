
const express = require('express');
const Redis = require('ioredis');

const app = express();
const redis = new Redis();

const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: 'myuser',
  host: 'localhost',
  database: 'mydb',
  password: 'mypass',
  port: 5432, // Default PostgreSQL port is 5432
  max: 20, // Set the maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds of inactivity
  connectionTimeoutMillis: 2000, // Attempt to connect for 2 seconds (2000 ms)
});

// Middleware to check the Redis cache before processing the request
const checkCache = async (req, res, next) => {
  try {
    const cachedData = await redis.get(req.originalUrl);

    if (cachedData) {
      console.log('Data retrieved from Redis cache');
      return res.json(JSON.parse(cachedData));
    }

    next();
  } catch (error) {
    console.error('Error checking Redis cache:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Example API route with Redis caching for a SQL query
app.get('/', checkCache, async (req, res) => {
  try {
    // Execute your SQL query
    const query = await pool.query('SELECT * FROM info');
    
    
    // Store data in Redis cache with the request URL as the key
    await redis.set(req.originalUrl, JSON.stringify(query), 'EX', 60); // Cache for 60 seconds

    res.json(query);
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

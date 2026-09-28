const express = require('express');
const path = require('path');
const { createApp } = require('./server/dist/app.js');
const { initializeCleanDatabase } = require('./server/dist/config/initDatabase.js');

const app = createApp();

// Serve static assets from client/dist if available
const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

let isInitialized = false;

module.exports = async (req, res) => {
  if (!isInitialized) {
    try {
      await initializeCleanDatabase();
      isInitialized = true;
    } catch (err) {
      console.error('Database initialization error:', err);
    }
  }
  return app(req, res);
};

const { createApp } = require('../server/dist/app.js');
const { initializeCleanDatabase } = require('../server/dist/config/initDatabase.js');

const app = createApp();

let isInitialized = false;

module.exports = async (req, res) => {
  if (!isInitialized) {
    try {
      await initializeCleanDatabase();
      isInitialized = true;
    } catch (err) {
      console.error('Error during database initialization:', err);
    }
  }
  return app(req, res);
};

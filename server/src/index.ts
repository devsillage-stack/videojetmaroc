import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { initializeCleanDatabase } from './config/initDatabase.js';

const app = createApp();

// Auto-initialize clean DB structure if needed
initializeCleanDatabase();

const server = app.listen(ENV.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 NEXORA INDUSTRIAL PLATFORM API RUNNING`);
  console.log(`📡 URL: http://localhost:${ENV.PORT}`);
  console.log(`⚙️  Environment: ${ENV.NODE_ENV}`);
  console.log(`=======================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

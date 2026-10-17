import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';

const app = createApp();

const PORT = Number(process.env.PORT) || 4000;

if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const server = app.listen(PORT, () => {
    console.log(`[BusinessFlow API] Server listening on http://localhost:${PORT}`);
    console.log(`[BusinessFlow API] Health check at http://localhost:${PORT}/api/health`);
  });

  const shutdown = () => {
    console.log('\n[BusinessFlow API] Shutting down gracefully...');
    server.close(() => {
      console.log('[BusinessFlow API] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default app;

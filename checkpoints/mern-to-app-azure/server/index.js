import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';

mongoose.set('bufferCommands', false);

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error(
      'MONGODB_URI is missing. Copy .env.example to .env and set your connection string.',
    );
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    const port = process.env.PORT || 5000;
    const server = createApp().listen(port, '0.0.0.0', () => {
      console.log(`Daylist is listening on port ${port}. MongoDB connected.`);
    });
    server.on('error', async (err) => {
      console.error('HTTP server failed:', err.code);
      await mongoose.disconnect();
      process.exitCode = 1;
    });

    let shuttingDown = false;
    const shutdown = () => {
      if (shuttingDown) return;
      shuttingDown = true;
      const timeout = setTimeout(() => process.exit(1), 10000);
      timeout.unref();
      server.close(async () => {
        await mongoose.disconnect();
        clearTimeout(timeout);
      });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error(
      `MongoDB connection failed (${err.name}). Check MONGODB_URI, database credentials, and network access.`,
    );
    process.exitCode = 1;
  }
}

await start();

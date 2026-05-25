import 'dotenv/config';

import { createServer } from 'http';
import next from 'next';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './src/socket/handlers';
import { setSocketServer } from './src/lib/socket-io';
import { disconnectDb } from './src/lib/db';
import { redis } from './src/lib/redis';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      credentials: true,
    },
    path: '/socket.io',
  });

  registerSocketHandlers(io);
  setSocketServer(io);

  server.listen(port, hostname, () => {
    console.log(`> Mayla ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO on path /socket.io`);
  });

  async function shutdown(signal: string) {
    console.log(`\n[shutdown] Received ${signal}, shutting down gracefully...`);

    console.log('[shutdown] Closing HTTP server...');
    server.close();

    console.log('[shutdown] Closing Socket.IO...');
    io.close();

    console.log('[shutdown] Disconnecting Prisma...');
    await disconnectDb();

    console.log('[shutdown] Disconnecting Redis...');
    await redis.quit();

    console.log('[shutdown] Disconnecting MongoDB...');
    await mongoose.disconnect();

    console.log('[shutdown] Done. Exiting.');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
});

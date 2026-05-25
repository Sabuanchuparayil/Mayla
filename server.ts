import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import { jwtVerify } from 'jose';
import { registerChatHandlers } from './src/socket/handlers';

const port = parseInt(process.env.PORT ?? '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'change-me-access');

const httpServer = createServer();

const app = next({ dev, httpServer });
const handle = app.getRequestHandler();

const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`,
    credentials: true,
  },
  connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
});

// JWT auth middleware for Socket.IO
io.use(async (socket, next) => {
  const token = socket.handshake.auth['token'] as string | undefined;
  if (!token) return next(new Error('NO_TOKEN'));
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    const userId = payload['userId'] as string | undefined;
    if (!userId) throw new Error('MISSING_USER_ID');
    socket.data.userId = userId;
    next();
  } catch {
    next(new Error('INVALID_TOKEN'));
  }
});

io.on('connection', (socket) => {
  registerChatHandlers(io, socket);
});

app.prepare().then(() => {
  httpServer.on('request', (req, res) => {
    handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} [${dev ? 'development' : 'production'}]`);
  });
});

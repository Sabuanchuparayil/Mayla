import type { Server } from 'socket.io';

// Shared across the single Node.js process (custom server + Next.js API routes)
const g = globalThis as unknown as { __io?: Server };

export function setIO(io: Server): void {
  g.__io = io;
}

export function getIO(): Server | undefined {
  return g.__io;
}

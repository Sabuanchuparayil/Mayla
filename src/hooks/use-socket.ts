'use client';

import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    let instance: Socket | null = null;

    fetch('/api/auth/socket-token', { credentials: 'include' })
      .then((r) => r.json())
      .then((body) => {
        if (!active || !body.success) return;

        const url =
          process.env.NEXT_PUBLIC_WS_URL ||
          (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? '');
        instance = io(url, {
          path: '/socket.io',
          auth: { token: body.data.token },
          transports: ['websocket', 'polling'],
        });

        instance.on('connect', () => setConnected(true));
        instance.on('disconnect', () => setConnected(false));
        setSocket(instance);
      })
      .catch(() => setConnected(false));

    return () => {
      active = false;
      instance?.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []);

  return { socket, connected };
}

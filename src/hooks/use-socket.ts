'use client';

import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

const LOCALHOST_APP_URL = /^https?:\/\/localhost(:\d+)?$/i;

/** Prefer explicit WS URL; skip localhost baked in at Docker build time. */
function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !LOCALHOST_APP_URL.test(appUrl)) {
    return appUrl.replace(/^http/i, 'ws');
  }
  return window.location.origin;
}

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

        instance = io(getSocketUrl(), {
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

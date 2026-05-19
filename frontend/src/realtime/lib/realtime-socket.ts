import { io, type Socket } from "socket.io-client";

import { env } from "@/shared/config/env";

let realtimeSocket: Socket | null = null;
let currentToken: string | null = null;

type SocketAckResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
};

export function getRealtimeSocket(token: string) {
  if (realtimeSocket && currentToken === token) {
    return realtimeSocket;
  }

  if (realtimeSocket) {
    realtimeSocket.disconnect();
    realtimeSocket = null;
  }

  currentToken = token;
  realtimeSocket = io(`${env.apiUrl}/realtime`, {
    auth: {
      token: `Bearer ${token}`,
    },
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 5_000,
    timeout: 10_000,
  });

  return realtimeSocket;
}

async function ensureRealtimeConnection(socket: Socket) {
  if (socket.connected) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Realtime connection timed out."));
    }, 5000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
    };

    const handleConnect = () => {
      cleanup();
      resolve();
    };

    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleError);
    socket.connect();
  });
}

export async function emitRealtimeEvent<TPayload, TResponse>(
  token: string,
  eventName: string,
  payload: TPayload
) {
  const socket = getRealtimeSocket(token);
  await ensureRealtimeConnection(socket);

  return new Promise<TResponse>((resolve, reject) => {
    socket.emit(
      eventName,
      payload,
      (ack?: SocketAckResponse<TResponse>) => {
        if (ack?.success && ack.data !== undefined) {
          resolve(ack.data);
          return;
        }

        reject(
          new Error(ack?.error?.message || "Realtime event failed unexpectedly.")
        );
      }
    );
  });
}

export function disconnectRealtimeSocket() {
  if (realtimeSocket) {
    realtimeSocket.disconnect();
    realtimeSocket = null;
  }

  currentToken = null;
}

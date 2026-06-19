import type http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import IORedis from 'ioredis';
import type { Channel } from 'amqplib';
import { verifyJwt, JwtPurpose } from '@lattice/jwt';
import { publish, RK } from '@lattice/queue';
import type { ActionRequestedPayload } from '@lattice/queue';
import { createLogger } from '@lattice/logger';
import { env } from '../config/env.config';
import { initOTel } from '@lattice/otel';

const { metricsHandler } = initOTel('socket-server');
const log = createLogger('socket-server');

// The app_usage token's user identity. The monolith (current auth owner until F2.2)
// signs it as `id`; the future api will use `userId`. Accept either.
interface AppToken {
  id?: number | string;
  userId?: number | string;
  purpose: JwtPurpose;
}

// Inbound event a UI client sends to drive a device (e.g. toggle a switch). The UI only
// knows the UserDeviceAction id; digest resolves it. The server NEVER trusts a
// client-supplied userId — it always uses the JWT's.
interface ClientActionStateUpdate {
  actionId: number;
  state: unknown;
  duration?: string;
}

/**
 * Attach a Socket.IO server (with the Valkey redis-adapter) to an existing HTTP server.
 * The adapter shares room pub/sub with digest-service's redis-emitter, so digest's
 * `action_state_update` / `device_status_change` / `camera_frame` emits reach the right
 * `user_{userId}` rooms with no server-side relay code here.
 */
export function initSocket(httpServer: http.Server, ch: Channel): Server {
  const pubClient = new IORedis(env.valkey.url, {
    username: env.valkey.username,
    password: env.valkey.password,
    lazyConnect: true,
  });
  const subClient = pubClient.duplicate();

  const io = new Server(httpServer, { cors: { origin: '*' } });
  io.adapter(createAdapter(pubClient, subClient));

  // JWT handshake — app_usage tokens only. Reject the connection otherwise.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication error: token missing'));

    const result = verifyJwt<AppToken>(token, JwtPurpose.app_usage, env.jwtSecret);
    if (!result.valid) return next(new Error('Authentication error: invalid token'));

    const id = result.decoded.id ?? result.decoded.userId;
    if (id === undefined) return next(new Error('Authentication error: token has no user id'));

    socket.data.userId = String(id);
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user_${userId}`);
    log.info({ userId }, 'socket connected');

    socket.on('chat:request', async (payload: { chatMode: string; messages: any[] }) => {
      const requestId = `req_${socket.id}_${Date.now()}`;
      const responseChannel = `chat:response:${requestId}`;

      // A. Subscribe to the specific response channel for this request
      await subClient.subscribe(responseChannel);

      const messageHandler = (channel: string, message: string) => {
        if (channel !== responseChannel) return;

        if (message === '[DONE]') {
          socket.emit('chat:done');
          subClient.unsubscribe(responseChannel);
          subClient.off('message', messageHandler);
        } else {
          // Stream the token directly to the Angular client
          socket.emit('chat:token', message);
        }
      };

      // Listen to messages from the worker
      subClient.on('message', messageHandler);
      
      // B. Push the payload into the AI processing queue
      const jobPayload = JSON.stringify({
        requestId,
        userId: userId,
        messages: payload.messages,
      });

      await pubClient.publish('chat:jobs', jobPayload);
    });

    socket.on('disconnect', () => log.info({ userId }, 'socket disconnected'));

    // Publish the request only. digest-service resolves the action, writes current_state
    // and echoes action_state_update to this user's room (echo follows the DB write),
    // then dispatches the concrete command for the device via mqtt-service.
    socket.on('action_state_update', (data: ClientActionStateUpdate) => {
      const payload: ActionRequestedPayload = {
        userId,
        actionId: data.actionId,
        value: data.state,
        duration: data.duration,
      };
      try {
        publish(ch, RK.ACTION_REQUESTED, payload);
      } catch (err) {
        log.error({ err, userId }, 'failed to publish action.requested');
      }
    });
  });

  log.info('Socket.IO server initialised with Valkey adapter');
  return io;
}

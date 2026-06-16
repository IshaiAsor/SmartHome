import { Emitter } from '@socket.io/redis-emitter';
import { valkey } from '../cache/valkey';

// The Socket.IO server (in the api service, F2.7) uses the Valkey adapter, which
// synchronises rooms over Valkey pub/sub. This emitter publishes onto that same
// channel — so a worker with no Socket.IO server can still emit room events with
// sub-millisecond delivery and no extra consumer hop. See the plan for the
// RabbitMQ-vs-emitter rationale.
const emitter = new Emitter(valkey as never);

export const socket = {
  emitActionStateUpdate(userId: number, userDeviceActionId: number, state: unknown): void {
    emitter.to(`user_${userId}`).emit('action_state_update', {
      actionId: userDeviceActionId,
      state,
    });
  },
  emitDeviceStatusChange(userId: number, userDeviceId: number, online: boolean): void {
    emitter.to(`user_${userId}`).emit('device_status_change', {
      deviceId: userDeviceId,
      online,
    });
  },
  emitCameraFrame(userId: number, userDeviceId: number, frame: string): void {
    emitter.to(`user_${userId}`).emit('camera_frame', {
      deviceId: userDeviceId,
      frame,
    });
  },
};

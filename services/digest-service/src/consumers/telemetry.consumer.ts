import type { Channel } from 'amqplib';
import { publish, RK } from '@lattice/queue';
import type { TelemetryArrivedPayload } from '@lattice/queue';
import { createLogger } from '@lattice/logger';
import { db } from '../db/client';
import { valkey, keys, resolveAction } from '../cache/valkey';
import type { ResolvedAction } from '../cache/valkey';
import { socket } from '../socket/emitter';

const log = createLogger('digest-service:telemetry');

// DeviceAction.implementation_type values that produce image/camera-frame telemetry
// rather than scalar sensor readings. Anything else is treated as scalar.
const IMAGE_IMPL_TYPES = new Set([
  'TakePictureAction',
  'LiveStreamAction',
  'TakePictureHttpAction',
  'LiveStreamHttpAction',
]);

// Latest-frame cache TTL — covers live relay / pipeline pickup, not history.
const CAMERA_FRAME_TTL_SECONDS = 60;

function asString(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function telemetryConsumer(ch: Channel) {
  return async (payload: TelemetryArrivedPayload): Promise<void> => {
    const { userId, deviceId, actionName, value, timestamp } = payload;

    // Resolve to the UserDeviceAction id + kind (Valkey cache → DB join fallback).
    const resolved = await resolveAction(deviceId, actionName, async () => {
      const row = await db.userDeviceAction.findFirst({
        where:  { user_device_id: parseInt(deviceId, 10), mqtt_action_name: actionName },
        select: { id: true, action: { select: { implementation_type: true } } },
      });
      if (!row) return null;
      const kind = IMAGE_IMPL_TYPES.has(row.action.implementation_type) ? 'image' : 'scalar';
      return { id: row.id, kind } satisfies ResolvedAction;
    });

    if (resolved === null) {
      // Unknown device/action — not a transient error. Throw so the message is
      // nacked → DLQ (via @lattice/queue's consume wrapper), making the failure
      // visible and re-publishable after the provisioning gap is fixed. Common
      // cause: telemetry arrived before provisioning completed, or action deleted.
      log.error({ userId, deviceId, actionName }, 'unresolved telemetry action → DLQ');
      throw new Error(`unresolved action ${deviceId}/${actionName}`);
    }

    if (resolved.kind === 'image') {
      await handleImage(resolved.id, payload);
      return;
    }
    await handleScalar(ch, resolved.id, payload);
  };
}

// Camera-frame telemetry. Every frame is persisted to sensor_history (the value column
// is TEXT) — full image history is intentional; retention/cleanup is a roadmap item.
// The frame never goes to current_state or rules.evaluate.
async function handleImage(
  userActionId: number,
  payload: TelemetryArrivedPayload,
): Promise<void> {
  const { userId, deviceId, value, timestamp } = payload;
  const userDeviceId = parseInt(deviceId, 10);
  const frame = asString(value);

  // 1. Authoritative history write — failure nacks → DLQ.
  await db.sensorHistory.create({
    data: {
      user_device_action_id: userActionId,
      value:                 frame,
      recorded_at:           new Date(timestamp),
    },
  });

  // 2. Cache latest frame for live relay / pipeline pickup (best-effort).
  try {
    await valkey.set(keys.cameraFrame(userDeviceId), frame, 'EX', CAMERA_FRAME_TTL_SECONDS);
  } catch (err) {
    log.error({ err, userDeviceId }, 'valkey camera_frame set failed');
  }

  // 3. Push the frame to the UI (best-effort).
  try {
    socket.emitCameraFrame(parseInt(userId, 10), userDeviceId, frame);
  } catch (err) {
    log.error({ err, userDeviceId }, 'socket camera_frame emit failed');
  }

  // TODO(F8): trigger a configured pipeline (RK.PIPELINE_TRIGGER) with a per-device
  // cooldown once the Pipeline model lands. The cached frame above feeds VLM/LLM stages.
}

// Scalar sensor reading. state write is authoritative; history/cache/socket/fan-out
// are best-effort.
async function handleScalar(
  ch: Channel,
  userActionId: number,
  payload: TelemetryArrivedPayload,
): Promise<void> {
  const { userId, deviceId, actionName, value, timestamp } = payload;
  const stateValue = asString(value);

  // 1. Authoritative state write — failure nacks → DLQ.
  await db.userDeviceAction.update({
    where: { id: userActionId },
    data:  { current_state: stateValue, updated_at: new Date() },
  });

  // 2. Append to sensor history (best-effort).
  try {
    await db.sensorHistory.create({
      data: {
        user_device_action_id: userActionId,
        value:                 stateValue,
        recorded_at:           new Date(timestamp),
      },
    });
  } catch (err) {
    log.error({ err, userActionId }, 'sensor_history insert failed');
  }

  // 3. Hot cache (best-effort).
  try {
    await valkey.set(keys.actionState(userActionId), stateValue, 'EX', 3600);
  } catch (err) {
    log.error({ err, userActionId }, 'valkey action_state set failed');
  }

  // 4. Push to the UI (best-effort).
  try {
    socket.emitActionStateUpdate(parseInt(userId, 10), userActionId, value);
  } catch (err) {
    log.error({ err, userActionId }, 'socket emit failed');
  }

  // 5. Fan out to rules evaluation (best-effort).
  try {
    publish(ch, RK.RULES_EVALUATE, { userId, deviceId, actionName, value, timestamp });
  } catch (err) {
    log.error({ err, userActionId }, 'rules.evaluate publish failed');
  }
}

import type { Channel } from 'amqplib';
import type { ActionResultPayload } from '@lattice/queue';
import { deviceActionsService } from '../services/device.actions.service';
import { googleHomegraphService } from '../services/google-smart-home/google.homegraph.service';

// Consumes device acks and forwards the resulting state to Google HomeGraph.
// Best-effort: errors are logged but the message is still acked so a bad
// HomeGraph call never blocks the queue.
export function actionResultConsumer(_ch: Channel) {
  return async (payload: ActionResultPayload): Promise<void> => {
    const { userId, deviceId, actionName, status } = payload;

    if (status !== 'ok') return;

    try {
      const action = await deviceActionsService.getActionByDeviceAndName(
        parseInt(deviceId, 10),
        actionName,
      );

      if (!action || !action.googleType) return;

      await googleHomegraphService.reportState(userId, action);
    } catch (err) {
      console.error(`[google-home] actionResultConsumer failed for device ${deviceId}/${actionName}:`, err);
    }
  };
}

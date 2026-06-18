import { Channel } from 'amqplib';
import { publish, RK } from '@lattice/queue';
import type { ActionDispatchPayload } from '@lattice/queue';
import { userDevicesActionsRepository } from '../dal/user.devices.actions.repository';
import { userDevicesRepository } from '../dal/user.devices.repository';

export async function dispatchAction(
  ch: Channel,
  userId: number,
  actionId: number,
  state: string,
): Promise<void> {
  const action = await userDevicesActionsRepository.getById(actionId);
  if (!action) {
    console.warn(`[dispatch] Action ${actionId} not found`);
    return;
  }

  let firmwareVersion: string | undefined;
  try {
    const userDevice = await userDevicesRepository.getById(action.user_device_id);
    firmwareVersion = userDevice.device.version ?? undefined;
  } catch (err) {
    console.error(`[dispatch] Could not resolve version for device ${action.user_device_id}:`, err);
  }

  const payload: ActionDispatchPayload = {
    userId:   String(userId),
    deviceId: String(action.user_device_id),
    actionName: action.mqtt_action_name,
    command: { value: state, duration: '*' },
    firmwareVersion,
  };

  publish(ch, RK.ACTION_DISPATCH, payload);
  console.log(`[dispatch] action.dispatch → device ${action.user_device_id} (action: ${action.mqtt_action_name})`);
}

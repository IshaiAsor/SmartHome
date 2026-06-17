import commandDispatch from './command.dispatch.service';
import { userDevicesActionsRepository } from '../dal/user.devices.actions.repository';

export type ActionSource = 'rules' | 'google';

export interface DispatchOptions {
  skipMqttPublish?: boolean;
  duration?: string;
}

// Dispatches a command to a device from non-UI sources (rules engine, Google Smart Home).
// No DB write here — current_state is written only when the device's ack arrives via
// digest-service's action-result consumer. The UI pending/failed flow is not applicable
// for these sources (no socket client waiting), but the device still acks and the state
// is persisted authoritatively the same way.
class ActionHubService {
  async dispatch(
    userId: number,
    actionId: number,
    state: string,
    source: ActionSource,
    options: DispatchOptions = {},
  ): Promise<void> {
    console.log(`[ActionHub] ${source} userId=${userId} actionId=${actionId} state=${state}`);

    const action = await userDevicesActionsRepository.getById(actionId);
    if (!action) {
      console.log(`[ActionHub] Action ${actionId} not found`);
      return;
    }

    if (!options.skipMqttPublish) {
      const command = { value: state, duration: options.duration ?? '*' };
      await commandDispatch.publishCommand(userId, action.user_device_id, action.mqtt_action_name, command);
    }
  }
}

export const actionHubService = new ActionHubService();

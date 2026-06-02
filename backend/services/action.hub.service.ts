// Circular import with mqtt.service is intentional and safe — neither constructor calls the other.
// Node.js resolves the cycle before any dispatch() calls occur at runtime.
import mqttService, { MqttChannel } from './mqtt.service';
import socketService from './socket.service';
import { rulesEngineService } from './rules.engine.service';
import { userDevicesActionsRepository } from '../dal/user.devices.actions.repository';

export type ActionSource = 'mqtt' | 'socket' | 'rules' | 'google';

export interface DispatchOptions {
  skipMqttPublish?: boolean;
  skipRulesEval?: boolean;
  duration?: string;
}

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

    await userDevicesActionsRepository.updateState(actionId, state);

    if (!options.skipMqttPublish) {
      const channel = (action.action.mqtt_action_type ?? 'command') as MqttChannel;
      const actionName = action.action.mqtt_action_name ?? '';
      const payload = JSON.stringify({ value: state, duration: options.duration ?? '*' });
      await mqttService.publish(userId, action.user_device_id, channel, actionName, payload);
    }

    socketService.publishActionStateUpdate(userId, actionId, state);

    if (!options.skipRulesEval) {
      rulesEngineService.evaluateForUser(userId);
    }
  }
}

export const actionHubService = new ActionHubService();

import { Channel } from 'amqplib';
import { SmartHomeV1ExecuteRequestExecution } from 'actions-on-google';
import { deviceActionsService, DeviceActionView } from '../device.actions.service';
import { dispatchAction } from '../command.dispatch';

type ValueMapper = (params: any) => string | undefined;

const IMPLEMENTATION_COMMAND_MAP: Record<string, Record<string, ValueMapper>> = {
  OutletAction: {
    'action.devices.commands.OnOff':      p => p.on ? 'on' : 'off',
    'action.devices.commands.LockUnlock': p => p.lock ? 'on' : 'off',
    'action.devices.commands.StartStop':  p => p.start ? 'on' : 'off',
    'action.devices.commands.OpenClose':  p => p.openPercent > 0 ? 'on' : 'off',
    'action.devices.commands.ArmDisarm':  p => p.arm ? 'arm' : 'disarm',
  },
  LightDimmerAction: {
    'action.devices.commands.OnOff':              p => p.on ? 'on' : 'off',
    'action.devices.commands.BrightnessAbsolute': p => String(p.brightness),
  },
  OneDirectionalMotorAction: {
    'action.devices.commands.OnOff':       p => p.on ? 'on' : 'off',
    'action.devices.commands.SetFanSpeed': p => p.fanSpeedPercent !== undefined
      ? String(p.fanSpeedPercent)
      : p.fanSpeed === 'high_speed' ? '100' : '50',
    'action.devices.commands.StartStop':   p => p.start ? 'on' : 'off',
  },
  TemperatureAction:    {},
  WaterLevelAction:     {},
  PhLevelAction:        {},
  TdsLevelAction:       {},
  HumidityAction:       {},
  AirTemperatureAction: {},
  CO2LevelAction:       {},
  TakePictureAction:    {},
  LiveStreamAction:     {},
};

class GoogleExecuteDeviceService {
  public async ExecuteDeviceCommands(ch: Channel, userId: number, commands: any[]): Promise<any> {
    const actions = await deviceActionsService.getUserActions(userId);
    const responses: any[] = [];

    for (const command of commands) {
      const deviceIds = command.devices.map((d: any) => parseInt(d.id));
      for (const execution of command.execution) {
        await this.handleExecuteCommand(ch, userId, execution, actions, deviceIds);
      }
      responses.push({ ids: deviceIds, status: 'SUCCESS', states: { online: true } });
    }

    return responses;
  }

  private async handleExecuteCommand(
    ch: Channel,
    userId: number,
    execution: SmartHomeV1ExecuteRequestExecution,
    actions: DeviceActionView[],
    deviceIds: number[],
  ): Promise<void> {
    for (const deviceId of deviceIds) {
      try {
        const userAction = actions.find(a => a.id === deviceId);
        if (!userAction) {
          console.error(`[execute] Action ${deviceId} not found for user ${userId}`);
          continue;
        }

        const deviceValue = this.mapExecutionToValue(execution, userAction.implementation_type, deviceId);
        if (deviceValue === undefined) {
          console.warn(`[execute] No mapping for '${execution.command}' on ${userAction.implementation_type} (device ${deviceId})`);
          continue;
        }

        console.log(`[execute] '${execution.command}' → '${deviceValue}' on device ${deviceId}`);
        await dispatchAction(ch, userId, userAction.id, deviceValue);
      } catch (err) {
        console.error(`[execute] Failed on device ${deviceId}:`, err);
      }
    }
  }

  private mapExecutionToValue(
    execution: SmartHomeV1ExecuteRequestExecution,
    implType: string,
    deviceId: number,
  ): string | undefined {
    const implMap = IMPLEMENTATION_COMMAND_MAP[implType];
    if (!implMap) {
      console.warn(`[execute] No command map for impl type '${implType}' (device ${deviceId})`);
      return undefined;
    }
    const mapper = implMap[execution.command];
    if (!mapper) return undefined;
    return mapper(execution.params ?? {});
  }
}

export const googleExecuteDeviceService = new GoogleExecuteDeviceService();

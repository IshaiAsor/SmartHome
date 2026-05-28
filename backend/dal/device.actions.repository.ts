import db from '../config/db';
import { DeviceAction } from '@prisma/client';

export type DeviceActionEntity = DeviceAction;

class DeviceActionDefinitionRepository {
  async Get(deviceId: number): Promise<DeviceActionEntity[]> {
    return db.deviceAction.findMany({ where: { device_id: deviceId } });
  }

  async GetByActionId(actionId: number): Promise<DeviceActionEntity> {
    return db.deviceAction.findFirstOrThrow({ where: { device_id: actionId } });
  }
}

export const deviceActionDefinitionRepository = new DeviceActionDefinitionRepository();

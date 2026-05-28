import db from '../config/db';
import { DeviceActionType } from '@prisma/client';

export type DeviceActionTypeEntity = DeviceActionType;

class DeviceActionTypeRepository {
  async Get(id: number): Promise<DeviceActionTypeEntity> {
    return db.deviceActionType.findUniqueOrThrow({ where: { id } });
  }
}

export const deviceActionTypeRepository = new DeviceActionTypeRepository();

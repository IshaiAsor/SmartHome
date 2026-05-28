import db from '../config/db';
import { DeviceActionType } from '@prisma/client';

export type { DeviceActionType };

class DeviceActionTypeRepository {
  async get(id: number): Promise<DeviceActionType> {
    return db.deviceActionType.findUniqueOrThrow({ where: { id } });
  }
}

export const deviceActionTypeRepository = new DeviceActionTypeRepository();

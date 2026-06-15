import db from '../config/db';
import { DeviceCapabilityBlueprint } from '@prisma/client';

class BlueprintsRepository {
  async getByDeviceTypeId(deviceTypeId: number): Promise<DeviceCapabilityBlueprint[]> {
    return db.deviceCapabilityBlueprint.findMany({
      where: { device_id: deviceTypeId },
    });
  }

  async getById(id: number): Promise<DeviceCapabilityBlueprint | null> {
    return db.deviceCapabilityBlueprint.findUnique({ where: { id } });
  }
}

export const blueprintsRepository = new BlueprintsRepository();

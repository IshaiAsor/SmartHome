import db from '../config/db';
import { Device } from '@prisma/client';

export type { Device };

class DevicesRepository {
  async GetAll(): Promise<Device[]> {
    return db.device.findMany();
  }

  async GetByType(type: string, version: string): Promise<Device> {
    return db.device.findFirstOrThrow({ where: { type, version } });
  }
}

export const devicesRepository = new DevicesRepository();

import { db, UserDevice, Device } from '@lattice/prisma-client';

export type UserDeviceWithDevice = UserDevice & { device: Device };

class UserDevicesRepository {
  async getById(id: number): Promise<UserDeviceWithDevice> {
    const device = await db.userDevice.findUnique({
      where: { id },
      include: { device: true },
    });
    if (!device) throw new Error(`Device ${id} not found`);
    return device as UserDeviceWithDevice;
  }
}

export const userDevicesRepository = new UserDevicesRepository();

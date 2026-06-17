import { db, UserDevice } from '@lattice/prisma-client';

class UserDevicesRepository {
  async getById(id: number): Promise<UserDevice> {
    const device = await db.userDevice.findUnique({ where: { id } });
    if (!device) throw new Error(`UserDevice ${id} not found`);
    return device;
  }
}

export const userDevicesRepository = new UserDevicesRepository();

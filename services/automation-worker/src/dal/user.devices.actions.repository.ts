import { db, UserDeviceAction, DeviceAction, UserDevice, Device } from '@lattice/prisma-client';

export type UserDeviceActionWithAction = UserDeviceAction & { action: DeviceAction };
export type UserDeviceActionFull = UserDeviceAction & {
  action: DeviceAction;
  user_device: UserDevice & { device: Device };
};

class UserDevicesActionsRepository {
  async getById(id: number): Promise<UserDeviceActionWithAction | null> {
    return db.userDeviceAction.findUnique({
      where: { id },
      include: { action: true },
    }) as Promise<UserDeviceActionWithAction | null>;
  }

  async getByIdFull(id: number): Promise<UserDeviceActionFull | null> {
    return db.userDeviceAction.findUnique({
      where: { id },
      include: { action: true, user_device: { include: { device: true } } },
    }) as Promise<UserDeviceActionFull | null>;
  }
}

export const userDevicesActionsRepository = new UserDevicesActionsRepository();

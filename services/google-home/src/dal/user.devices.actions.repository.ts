import { db, UserDeviceAction, DeviceCapability, UserDevice, UserActionGroup } from '@lattice/prisma-client';

export type UserDeviceActionWithCapability = UserDeviceAction & { capability: DeviceCapability; group: UserActionGroup | null };
export type UserDeviceActionWithCapabilityAndDevice = UserDeviceAction & { capability: DeviceCapability; user_device: UserDevice; group: UserActionGroup | null };

class UserDevicesActionsRepository {
  async getAllByUserId(userId: number): Promise<UserDeviceActionWithCapabilityAndDevice[]> {
    return db.userDeviceAction.findMany({
      where: { user_device: { user_id: userId } },
      include: { capability: true, user_device: true, group: true },
      orderBy: { sort_order: 'asc' },
    }) as Promise<UserDeviceActionWithCapabilityAndDevice[]>;
  }

  async getById(actionId: number): Promise<UserDeviceActionWithCapability | null> {
    return db.userDeviceAction.findFirst({
      where: { id: actionId },
      include: { capability: true, group: true },
    }) as Promise<UserDeviceActionWithCapability | null>;
  }

  async getByDeviceAndActionName(deviceId: number, actionName: string): Promise<UserDeviceActionWithCapability | null> {
    return db.userDeviceAction.findFirst({
      where: { user_device_id: deviceId, mqtt_action_name: actionName },
      include: { capability: true, group: true },
    }) as Promise<UserDeviceActionWithCapability | null>;
  }
}

export const userDevicesActionsRepository = new UserDevicesActionsRepository();

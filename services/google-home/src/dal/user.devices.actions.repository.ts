import { db, UserDeviceAction, DeviceAction, UserDevice } from '@lattice/prisma-client';

export type UserDeviceActionWithAction = UserDeviceAction & { action: DeviceAction };
export type UserDeviceActionWithActionAndDevice = UserDeviceAction & { action: DeviceAction; user_device: UserDevice };

class UserDevicesActionsRepository {
  async getAllByUserId(userId: number): Promise<UserDeviceActionWithActionAndDevice[]> {
    return db.userDeviceAction.findMany({
      where: { user_device: { user_id: userId } },
      include: { action: true, user_device: true },
      orderBy: { sort_order: 'asc' },
    }) as Promise<UserDeviceActionWithActionAndDevice[]>;
  }

  async getById(actionId: number): Promise<UserDeviceActionWithAction | null> {
    return db.userDeviceAction.findFirst({
      where: { id: actionId },
      include: { action: true },
    }) as Promise<UserDeviceActionWithAction | null>;
  }

  async getByDeviceAndActionName(deviceId: number, actionName: string): Promise<UserDeviceActionWithAction | null> {
    return db.userDeviceAction.findFirst({
      where: { user_device_id: deviceId, mqtt_action_name: actionName },
      include: { action: true },
    }) as Promise<UserDeviceActionWithAction | null>;
  }
}

export const userDevicesActionsRepository = new UserDevicesActionsRepository();

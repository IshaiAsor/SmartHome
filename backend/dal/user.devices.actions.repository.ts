import db from '../config/db';
import { UserDeviceAction, DeviceCapability, UserDevice, Prisma } from '@prisma/client';

export type UserDeviceActionWithCapability = UserDeviceAction & { capability: DeviceCapability };
export type UserDeviceActionWithCapabilityAndDevice = UserDeviceAction & { capability: DeviceCapability; user_device: UserDevice };

class UserDevicesActionsRepository {

  async updateState(id: number, state: unknown) {
    await db.userDeviceAction.update({
      where: { id },
      data: { current_state: state as string, updated_at: new Date() },
    });
  }

  async getByDeviceId(deviceId: number): Promise<UserDeviceActionWithCapability[]> {
    return db.userDeviceAction.findMany({
      where: { user_device_id: deviceId },
      include: { capability: true },
    }) as Promise<UserDeviceActionWithCapability[]>;
  }

  async getAllByUserId(userId: number): Promise<UserDeviceActionWithCapabilityAndDevice[]> {
    return db.userDeviceAction.findMany({
      where: { user_device: { user_id: userId } },
      include: { capability: true, user_device: true },
      orderBy: { sort_order: 'asc' },
    }) as Promise<UserDeviceActionWithCapabilityAndDevice[]>;
  }

  async reorderActions(orderedIds: number[]): Promise<void> {
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.userDeviceAction.update({ where: { id }, data: { sort_order: index + 1 } })
      )
    );
  }

  async insertAction(action: Pick<UserDeviceAction, 'user_device_id' | 'capability_id' | 'action_name' | 'mqtt_action_name'> & { current_state?: string | null }) {
    return db.userDeviceAction.create({
      data: {
        user_device_id: action.user_device_id,
        capability_id: action.capability_id,
        action_name: action.action_name,
        mqtt_action_name: action.mqtt_action_name,
        current_state: action.current_state,
      },
    });
  }

  async deleteAction(actionId: number) {
    return db.userDeviceAction.delete({ where: { id: actionId } });
  }

  async getById(actionId: number): Promise<UserDeviceActionWithCapability | null> {
    return db.userDeviceAction.findFirst({
      where: { id: actionId },
      include: { capability: true },
    }) as Promise<UserDeviceActionWithCapability | null>;
  }

  async updateAction(id: number, updates: {
    action_name?: string;
    mqtt_action_name?: string;
    current_state?: string | null;
    telemetry_interval_ms?: number | null;
    sort_order?: number;
  }) {
    return db.userDeviceAction.update({
      where: { id },
      data: { ...updates, updated_at: new Date() },
    });
  }
}

export const userDevicesActionsRepository = new UserDevicesActionsRepository();

import db from '../config/db';
import { UserDevice, Device } from '@prisma/client';

export type UserDeviceWithDevice = UserDevice & {
  device: Device;
};

class UserDevicesRepository {

  async getUserDevices(userId: number): Promise<UserDeviceWithDevice[]> {
    return await db.userDevice.findMany({
      where: { user_id: userId },
      include: { device: true }
    }) as UserDeviceWithDevice[];
  }

  async getByMacId(macId: string): Promise<UserDeviceWithDevice> {
    const device = await db.userDevice.findUnique({
      where: { mac_id: macId },
      include: { device: true }
    });
    if (!device) {
      throw new Error('Device not found');
    }
    return device as UserDeviceWithDevice;
  }

  async getById(id: number): Promise<UserDeviceWithDevice> {
    const device = await db.userDevice.findUnique({
      where: { id },
      include: { device: true }
    });
    if (!device) {
      throw new Error('Device not found');
    }
    return device as UserDeviceWithDevice;
  }

  async updateDeviceOnlineStatus(userId: number, id: number, deviceOnlineStatus: boolean) {
    return await db.userDevice.update({
      where: { id, user_id: userId },
      data: {
        online: deviceOnlineStatus,
        last_online_date: new Date()
      }
    });
  }

  async insertDevice(device: any): Promise<UserDevice> {
    return await db.userDevice.create({
      data: {
        device_type_id: device.device_type_id,
        user_id: device.user_id,
        mac_id: device.mac_id,
        name: device.name,
        online: false
      }
    });
  }

  async deleteDevice(id: number, userId: number) {
    return await db.userDevice.delete({
      where: { id, user_id: userId }
    });
  }

  async updateDevice(userId: number, id: number, updates: any) {
    // Filter out fields that are not in the database if necessary
    const { id: _, user_id: __, device: ___, ...data } = updates;
    return await db.userDevice.update({
      where: { id, user_id: userId },
      data: {
        ...data,
        updated_at: new Date()
      }
    });
  }
}

export const userDevicesRepository = new UserDevicesRepository();

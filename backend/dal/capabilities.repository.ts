import db from '../config/db';
import { DeviceCapability, DeviceCapabilityPin, DeviceCapabilityTrait, GoogleActionType, GoogleDeviceTrait } from '@prisma/client';

export type CapabilityEntity = DeviceCapability & {
  pins: DeviceCapabilityPin[];
  google_type: GoogleActionType | null;
  traits: (DeviceCapabilityTrait & { google_trait: GoogleDeviceTrait })[];
};

class CapabilitiesRepository {
  async getByDeviceTypeId(deviceTypeId: number): Promise<CapabilityEntity[]> {
    return db.deviceCapability.findMany({
      where: { device_id: deviceTypeId },
      include: { pins: true, google_type: true, traits: { include: { google_trait: true } } },
    });
  }

  async getById(id: number): Promise<CapabilityEntity | null> {
    return db.deviceCapability.findUnique({
      where: { id },
      include: { pins: true, google_type: true, traits: { include: { google_trait: true } } },
    });
  }
}

export const capabilitiesRepository = new CapabilitiesRepository();

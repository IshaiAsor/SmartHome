import { devicesRepository } from '../dal/devices';
import { googleTraitsRepository } from '../dal/google.action.traits.repository';
import db from '../config/db';

export interface DeviceTypeView {
  id: number;
  type: string;
  version: string;
  default_name: string;
}

export interface TraitView {
  id: number;
  value: string;
  is_default: boolean;
}

export interface DeviceActionView {
  id: number;
  device_id: number;
  default_name: string;
  mqtt_action_type: string;
  mqtt_action_name: string;
  implementation_type: string;
  pins: { key: string; label: string; mode: string }[];
  telemetry_interval_ms: number | null;
  google_action_type: string | null;
  google_traits: TraitView[];
}

class AdminDeviceConfigService {
  async listDeviceTypes(): Promise<DeviceTypeView[]> {
    const devices = await devicesRepository.GetAll();
    return devices.map((d) => ({
      id: d.id,
      type: d.type ?? '',
      version: d.version ?? '',
      default_name: d.default_name,
    }));
  }

  async listActions(deviceId: number): Promise<DeviceActionView[]> {
    const capabilities = await db.deviceCapability.findMany({
      where: { device_id: deviceId },
      include: {
        pins: true,
        traits: { include: { google_trait: true } },
        google_type: true,
      },
    });
    return capabilities.map((c) => ({
      id: c.id,
      device_id: c.device_id,
      default_name: c.label,
      mqtt_action_type: c.mqtt_action_type,
      mqtt_action_name: c.mqtt_action_name,
      implementation_type: c.implementation_type,
      pins: c.pins.map((p) => ({ key: p.key, label: p.label, mode: p.mode })),
      telemetry_interval_ms: c.min_telemetry_interval_ms ?? null,
      google_action_type: c.google_type?.name ?? null,
      google_traits: c.traits.map((t) => ({
        id: t.google_trait_id,
        value: t.google_trait.value,
        is_default: t.is_default,
      })),
    }));
  }

  async setDefaultTrait(capabilityId: number, traitId: number): Promise<void> {
    await googleTraitsRepository.setDefaultTrait(capabilityId, traitId);
  }
}

export const adminDeviceConfigService = new AdminDeviceConfigService();

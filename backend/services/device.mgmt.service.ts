// All device management logic migrated to services/api (F2.5).
// Retained interface definitions only — implementations removed (dead code).

export interface PinSlot {
  key: string;
  label: string;
  mode: string;
}

export interface UserActionView {
  id: number;
  name: string;
  mqttName: string;
  pins: { pinNumber: number; pinMode: string }[];
  intervalMs: number | null;
  status: string;
}

export interface CapabilityView {
  id: number;
  capability_key: string;
  label: string;
  implementation_type: string;
  mqtt_action_type: string;
  mqtt_action_name: string;
  min_telemetry_interval_ms: number | null;
  configurable_pins: PinSlot[];
  instances: UserActionView[];
}

export interface DeviceView {
  id: number;
  deviceName: string;
  online?: boolean;
  lastOnlineDate?: Date;
  type: string;
  version: string;
  current_firmware_version: string | null;
  update_available: boolean;
}

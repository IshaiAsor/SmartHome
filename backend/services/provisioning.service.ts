import config from '../config/env.config';
import { JwtPurpose, jwtService } from './jwt.service';
import { userDevicesRepository } from '../dal/user.devices.repository';
import { Prisma } from '@prisma/client';
import db from '../config/db';

export interface CapabilityInput {
  capability_key: string;
  label: string;
  implementation_type: string;
  mqtt_action_type: string;
  mqtt_action_name: string;
  configurable_pins?: { key: string; label: string; mode: string }[];
  min_telemetry_interval_ms?: number | null;
  google_action_type?: string | null;
  google_traits?: string[] | null;
}

class ProvisioningService {
  async GenerateProvisioningToken(userId: number) {
    const tokenPayload = { userId, clientid: String(userId) };
    const token = jwtService.generateToken(tokenPayload, JwtPurpose.device_provisioning);
    console.log(`Generated provisioning token for user ${userId}`);

    const provisioningCallbackUrl = `${config.baseUrl}/api/provisioning/provision`;
    return {
      provisioningToken: token,
      userId: userId.toString(),
      server: config.mqtt.serverName,
      mqttPort: config.mqtt.port,
      provisioningCallbackUrl,
      validateCACert: config.mqtt.validateCert,
    };
  }

  async provisionDevice(
    userId: number,
    macAddress: string,
    deviceType: string,
    version: string,
    capabilities: CapabilityInput[],
  ) {
    console.log(`[provision] userId=${userId} mac=${macAddress} type=${deviceType} version=${version}`);

    // 1. Upsert device type row
    const device = await db.device.upsert({
      where: { type_version: { type: deviceType, version } },
      update: {},
      create: { type: deviceType, version, default_name: `${deviceType} ${version}` },
    });

    // 2. Upsert capability blueprints declared by the firmware
    for (const cap of capabilities) {
      await db.deviceCapabilityBlueprint.upsert({
        where: { device_id_capability_key: { device_id: device.id, capability_key: cap.capability_key } },
        update: {
          label: cap.label,
          implementation_type: cap.implementation_type,
          mqtt_action_type: cap.mqtt_action_type,
          mqtt_action_name: cap.mqtt_action_name,
          configurable_pins: cap.configurable_pins ?? [],
          min_telemetry_interval_ms: cap.min_telemetry_interval_ms ?? null,
          google_action_type: cap.google_action_type ?? null,
          google_traits: cap.google_traits ?? Prisma.JsonNull,
        },
        create: {
          device_id: device.id,
          capability_key: cap.capability_key,
          label: cap.label,
          implementation_type: cap.implementation_type,
          mqtt_action_type: cap.mqtt_action_type,
          mqtt_action_name: cap.mqtt_action_name,
          configurable_pins: cap.configurable_pins ?? [],
          min_telemetry_interval_ms: cap.min_telemetry_interval_ms ?? null,
          google_action_type: cap.google_action_type ?? null,
          google_traits: cap.google_traits ?? Prisma.JsonNull,
        },
      });
    }

    // 3. Upsert user_device by mac_id (re-provisioning same device always works)
    const userDevice = await db.userDevice.upsert({
      where: { mac_id: macAddress },
      update: { user_id: userId, device_type_id: device.id },
      create: {
        user_id: userId,
        device_type_id: device.id,
        mac_id: macAddress,
        name: deviceType,
      },
    });

    // 4. Return permanent JWT
    return this.generatePermanentToken(userId, userDevice.id, version);
  }

  RefreshMqttToken(refreshToken: string) {
    console.log(`Received refresh token request`);
    const verificationResult = jwtService.verifyToken(refreshToken, JwtPurpose.device_usage_refresh);
    if (!verificationResult.valid) {
      throw new Error('Invalid or expired refresh token');
    }

    return this.generatePermanentToken(
      verificationResult.decoded.userId,
      verificationResult.decoded.deviceId,
      verificationResult.decoded.version,
    );
  }

  private async generatePermanentToken(userId: number, deviceId: number, deviceVersion: string) {
    const token = jwtService.generateToken(
      { userid: userId, clientid: deviceId },
      JwtPurpose.device_usage,
    );

    const refreshToken = jwtService.generateToken(
      { userId, deviceId },
      JwtPurpose.device_usage_refresh,
    );

    const deviceConfigUrl = `${config.baseUrl}/api/device/${encodeURIComponent(deviceVersion)}/configuration`;
    return {
      deviceId,
      mqttToken: token,
      refreshToken,
      refreshTokenCallbackUrl: `${config.baseUrl}/api/provisioning/refresh-token`,
      deviceConfigUrl,
      validateCACert: config.mqtt.validateCert,
      wsStreamUrl: config.baseUrl,
      cameraHttpUrl: config.baseUrl,
    };
  }
}

export const provisioningService = new ProvisioningService();

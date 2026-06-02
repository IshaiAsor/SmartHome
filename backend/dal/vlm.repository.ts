import db from '../config/db';
import type { VlmModel, DeviceVlmConfig } from '@prisma/client';

export type VlmModelWithConfigs = VlmModel & { device_configs: DeviceVlmConfig[] };

export type DeviceVlmConfigFull = DeviceVlmConfig & {
  vlm_model: VlmModel;
  user_device_action: { id: number; user_device_id: number; user_device: { user_id: number } };
};

export type CreateVlmModelInput = {
  user_id: number;
  name: string;
  type: string;
  endpoint_url: string;
  config?: object;
};

export type UpsertDeviceVlmConfigInput = {
  user_device_action_id: number;
  vlm_model_id: number;
  enabled?: boolean;
  analysis_interval_sec?: number;
};

class VlmRepository {
  async getModelsByUserId(userId: number): Promise<VlmModel[]> {
    return db.vlmModel.findMany({ where: { user_id: userId }, orderBy: { created_at: 'asc' } });
  }

  async createModel(data: CreateVlmModelInput): Promise<VlmModel> {
    return db.vlmModel.create({ data });
  }

  async deleteModel(id: number, userId: number): Promise<void> {
    await db.vlmModel.deleteMany({ where: { id, user_id: userId } });
  }

  async getDeviceConfigByActionId(actionId: number): Promise<DeviceVlmConfigFull | null> {
    return db.deviceVlmConfig.findUnique({
      where: { user_device_action_id: actionId },
      include: {
        vlm_model: true,
        user_device_action: {
          select: { id: true, user_device_id: true, user_device: { select: { user_id: true } } },
        },
      },
    }) as Promise<DeviceVlmConfigFull | null>;
  }

  async getEnabledConfigs(): Promise<DeviceVlmConfigFull[]> {
    return db.deviceVlmConfig.findMany({
      where: { enabled: true },
      include: {
        vlm_model: true,
        user_device_action: {
          select: { id: true, user_device_id: true, user_device: { select: { user_id: true } } },
        },
      },
    }) as Promise<DeviceVlmConfigFull[]>;
  }

  async getDeviceConfigsByUserId(userId: number): Promise<DeviceVlmConfigFull[]> {
    return db.deviceVlmConfig.findMany({
      where: { vlm_model: { user_id: userId } },
      include: {
        vlm_model: true,
        user_device_action: {
          select: { id: true, user_device_id: true, user_device: { select: { user_id: true } } },
        },
      },
    }) as Promise<DeviceVlmConfigFull[]>;
  }

  async upsertDeviceConfig(data: UpsertDeviceVlmConfigInput): Promise<DeviceVlmConfig> {
    return db.deviceVlmConfig.upsert({
      where: { user_device_action_id: data.user_device_action_id },
      create: data,
      update: {
        vlm_model_id: data.vlm_model_id,
        enabled: data.enabled ?? true,
        analysis_interval_sec: data.analysis_interval_sec ?? 30,
      },
    });
  }

  async deleteDeviceConfig(id: number, userId: number): Promise<void> {
    await db.deviceVlmConfig.deleteMany({
      where: { id, vlm_model: { user_id: userId } },
    });
  }

  async updateLastAnalyzed(id: number): Promise<void> {
    await db.deviceVlmConfig.update({ where: { id }, data: { last_analyzed_at: new Date() } });
  }
}

export const vlmRepository = new VlmRepository();

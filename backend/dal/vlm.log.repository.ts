import db from '../config/db';

export type CreateVlmLogInput = {
  device_vlm_config_id: number;
  input_image_hash?: string;
  input_detections: object;
  input_sensors?: object;
  llm_prompt?: string;
  llm_response?: string;
  decision?: string;
};

class VlmLogRepository {
  async insert(data: CreateVlmLogInput): Promise<void> {
    await db.vlmAnalysisLog.create({ data });
  }

  async getRecent(userId: number, limit = 50): Promise<unknown[]> {
    return db.vlmAnalysisLog.findMany({
      where: {
        device_vlm_config: {
          vlm_model: { user_id: userId },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }
}

export const vlmLogRepository = new VlmLogRepository();

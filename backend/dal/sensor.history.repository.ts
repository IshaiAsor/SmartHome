import db from '../config/db';
import type { SensorHistory } from '@prisma/client';

class SensorHistoryRepository {
  async insert(userDeviceActionId: number, value: string): Promise<void> {
    await db.sensorHistory.create({ data: { user_device_action_id: userDeviceActionId, value } });
  }

  async getRecentForUser(userId: number, hoursBack: number): Promise<SensorHistory[]> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return db.sensorHistory.findMany({
      where: {
        recorded_at: { gte: since },
        user_device_action: { user_device: { user_id: userId } },
      },
      include: { user_device_action: { select: { action_name: true } } },
      orderBy: { recorded_at: 'asc' },
    }) as Promise<SensorHistory[]>;
  }

  async pruneOlderThan(days: number): Promise<void> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    await db.sensorHistory.deleteMany({ where: { recorded_at: { lt: cutoff } } });
  }
}

export const sensorHistoryRepository = new SensorHistoryRepository();

import { db } from '../db';

class CatalogService {
  // ─── Device catalog ───────────────────────────────────────────────────
  listDevices() {
    return db.device.findMany({ orderBy: [{ type: 'asc' }, { version: 'asc' }] });
  }

  async getDevice(id: number) {
    const device = await db.device.findUnique({
      where: { id },
      include: {
        capabilities: {
          orderBy: { id: 'asc' },
          include: { pins: true, traits: true, google_type: true },
        },
      },
    });
    if (!device) throw Object.assign(new Error('Device not found'), { statusCode: 404 });
    return device;
  }

  async deleteDevice(id: number) {
    await this.ensureExists('device', id);
    await db.device.delete({ where: { id } }); // cascades capabilities/pins/traits
  }

  listCapabilities(deviceId: number) {
    return db.deviceCapability.findMany({
      where: { device_id: deviceId },
      orderBy: { id: 'asc' },
      include: { pins: true, traits: true, google_type: true },
    });
  }

  private async ensureExists(
    model: 'device',
    id: number,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const found = await (db as any)[model].findUnique({ where: { id } });
    if (!found) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  }
}

export const catalogService = new CatalogService();

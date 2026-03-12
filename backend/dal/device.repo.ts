
import db from '../config/db';

interface EspDevice {
  device_mac_id: string;
  device_name: string;
  status: number;
  is_on: boolean;
  created_at: Date;
  updated_at: Date;
}

class DeviceRepository {
  async getAll() {
    const result = await db.query<EspDevice>('SELECT * FROM esp_devices');
    return result.rows;
  }

  async getById(id: string) {
    const result = await db.query<EspDevice>('SELECT * FROM esp_devices WHERE device_mac_id = $1', [id]);
    if (result.rows.length === 0) {
      throw new Error('Device not found');
    }
    return result.rows[0];
  }

  async updateStatus(id: string, status: number) {
    const result = await db.query<EspDevice>(
      'UPDATE esp_devices SET status = $1 WHERE device_mac_id = $2 RETURNING *', [status, id]);
    if (result.rows.length === 0) {
      throw new Error('Device not found');
    }
    return result.rows[0];
  }
  
  async updateState(id: string, isOn: boolean) {
    const result = await db.query<EspDevice>(
      'UPDATE esp_devices SET is_on = $1, updated_at = CURRENT_TIMESTAMP WHERE device_mac_id = $2 RETURNING *',
      [isOn, id]
    );
    if (result.rows.length === 0) {
      throw new Error('Device not found');
    }
    return result.rows[0];
  }

  async insertDevice(device: Partial<EspDevice>) {
    const result = await db.query<EspDevice>(
      'INSERT INTO esp_devices (device_mac_id, device_name, status) VALUES ($1, $2, $3) RETURNING *',
      [device.device_mac_id, device.device_name, device.status || 0]
    );
    return result.rows[0];
  }
}

export default new DeviceRepository();
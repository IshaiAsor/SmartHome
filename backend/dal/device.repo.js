// This represents your future PostgreSQL table
let devicesDB = [
  { id: 'outlet-1', name: 'Desk Monitor', type: 'action.devices.types.OUTLET', is_on: false },
  { id: 'outlet-2', name: 'Soldering Station', type: 'action.devices.types.OUTLET', is_on: false },
  { id: 'outlet-3', name: 'Bambu Lab H2S', type: 'action.devices.types.OUTLET', is_on: false },
  { id: 'outlet-4', name: 'Power Supply', type: 'action.devices.types.OUTLET', is_on: false }
];

const db = require('../config/db'); // The file we made in the previous step

class DeviceRepository {
  async getAll() {
    return db.query<{device_mac_id: string,device_name: string, status: Number}>('SELECT * FROM esp_devices');
  }

  async getById(id) {
    return db.query('SELECT * FROM esp_devices WHERE device_mac_id = $1', [id]);
  }

async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE esp_devices SET status = $1 WHERE device_mac_id = $2 RETURNING *', [status, id]);
    if (result.rows.length === 0) {
      throw new Error('Device not found');
    }
    return result.rows[0];
  }
  
  async updateState(id, isOn) {
    const device = devicesDB.find(d => d.id === id);
    if (device) {
      device.is_on = isOn;
      return device;
    }
    throw new Error('Device not found');
  }

  async insertDevice(device) {
   return db.query(
    'INSERT INTO esp_devices (device_mac_id, device_name, status) VALUES ($1, $2, $3) RETURNING *',
    [device.device_mac_id, device.device_name, device.status]
  );
  }
}

module.exports = new DeviceRepository();
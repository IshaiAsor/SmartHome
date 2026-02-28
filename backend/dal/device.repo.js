// This represents your future PostgreSQL table
let devicesDB = [
  { id: 'outlet-1', name: 'Desk Monitor', type: 'action.devices.types.OUTLET', is_on: false },
  { id: 'outlet-2', name: 'Soldering Station', type: 'action.devices.types.OUTLET', is_on: false },
  { id: 'outlet-3', name: 'Bambu Lab H2S', type: 'action.devices.types.OUTLET', is_on: false },
  { id: 'outlet-4', name: 'Power Supply', type: 'action.devices.types.OUTLET', is_on: false }
];

class DeviceRepository {
  async getAll() {
    return devicesDB;
  }

  async getById(id) {
    return devicesDB.find(d => d.id === id);
  }

  async updateState(id, isOn) {
    const device = devicesDB.find(d => d.id === id);
    if (device) {
      device.is_on = isOn;
      return device;
    }
    throw new Error('Device not found');
  }
}

module.exports = new DeviceRepository();